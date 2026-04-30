import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find().populate('project', 'name').populate('assignedTo', 'name email');
    } else {
      tasks = await Task.find({ assignedTo: req.user._id }).populate('project', 'name').populate('assignedTo', 'name email');
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate } = req.body;
    const task = await Task.create({
      title, description, project, assignedTo, assignedBy: req.user._id, priority, dueDate, status: 'pending'
    });
    const populatedTask = await Task.findById(task._id).populate('project', 'name').populate('assignedTo', 'name email');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.status = req.body.status;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
