import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let tasks, projects;
    if (req.user.role === 'admin') {
      tasks = await Task.find().populate('project', 'name');
      projects = await Project.find();
    } else {
      tasks = await Task.find({ assignedTo: req.user._id }).populate('project', 'name');
      projects = await Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] });
    }
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const overdueTasks = tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'completed').length;
    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks,
        completionRate: totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
      },
      recentTasks: tasks.slice(0, 5),
      overdueTasks: tasks.filter(t => new Date(t.dueDate) < now && t.status !== 'completed')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
