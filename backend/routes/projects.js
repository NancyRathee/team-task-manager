import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find().populate('owner', 'name email').populate('members', 'name email');
    } else {
      projects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }]
      }).populate('owner', 'name email').populate('members', 'name email');
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.create({
      name, description, owner: req.user._id, members: members || []
    });
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email').populate('members', 'name email');
    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.status = req.body.status || project.status;
    project.members = req.body.members || project.members;
    await project.save();
    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email').populate('members', 'name email');
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
