import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

// Use separate database for this project (safe)
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/taskmanager_assessment')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ========== SCHEMAS ==========
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'member' }
});

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  owner: String,
  members: [String],
  status: { type: String, default: 'active' }
});

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: String,
  status: { type: String, default: 'pending' },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Task = mongoose.model('Task', taskSchema);

// ========== MIDDLEWARE ==========
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') next();
  else res.status(403).json({ message: 'Admin only' });
};

// ========== TEST ==========
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// ========== AUTH ==========
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'member' });
    const token = jwt.sign({ id: user._id, role: user.role }, 'secret', { expiresIn: '30d' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, 'secret', { expiresIn: '30d' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== PROJECTS ==========
app.get('/api/projects', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find().populate('owner', 'name').populate('members', 'name');
    } else {
      projects = await Project.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }]
      }).populate('owner', 'name').populate('members', 'name');
    }
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/projects', auth, adminOnly, async (req, res) => {
  const { name, description, members } = req.body;
  const project = await Project.create({ name, description, members, owner: req.user.id });
  const populated = await Project.findById(project._id).populate('owner', 'name').populate('members', 'name');
  res.json(populated);
});

app.put('/api/projects/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, members, status } = req.body;
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, members, status },
      { new: true }
    ).populate('owner', 'name').populate('members', 'name');
    if (!updated) return res.status(404).json({ message: 'Project not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/projects/:id', auth, adminOnly, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/api/projects/users', auth, adminOnly, async (req, res) => {
  const users = await User.find({}, 'name email role');
  res.json(users);
});

// ========== TASKS ==========
app.get('/api/tasks', auth, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find()
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
    } else {
      // Use string comparison to avoid ObjectId issues
      tasks = await Task.find()
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
      // Filter in JavaScript for simplicity (works with mixed ID types)
      tasks = tasks.filter(t => t.assignedTo && t.assignedTo._id.toString() === req.user.id);
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tasks', auth, async (req, res) => {
  const task = await Task.create({ ...req.body, assignedBy: req.user.id });
  const populated = await Task.findById(task._id)
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');
  res.json(populated);
});

app.put('/api/tasks/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, priority, dueDate, status },
      { new: true }
    ).populate('project', 'name').populate('assignedTo', 'name email');
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/tasks/:id/status', auth, async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  ).populate('project', 'name').populate('assignedTo', 'name email');
  res.json(task);
});

app.delete('/api/tasks/:id', auth, adminOnly, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// ========== DASHBOARD (FIXED for members) ==========
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    let tasks, projects;
    if (req.user.role === 'admin') {
      tasks = await Task.find();
      projects = await Project.find();
    } else {
      // Member: get tasks assigned to them
      const allTasks = await Task.find().populate('assignedTo', 'name email');
      tasks = allTasks.filter(t => t.assignedTo && t.assignedTo._id.toString() === req.user.id);
      // Member: get projects they are owner or member of
      projects = await Project.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }]
      });
    }

    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const now = new Date();

    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks: totalTasks,
        completedTasks: completed,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        overdueTasks: tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'completed').length,
        completionRate: totalTasks ? ((completed / totalTasks) * 100).toFixed(1) : 0
      },
      recentTasks: tasks.slice(-5),
      overdueTasks: tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'completed')
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));