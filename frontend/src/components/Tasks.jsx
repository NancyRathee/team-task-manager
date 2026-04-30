import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    if (user.role === 'admin') fetchUsers();
  }, []);

  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTasks(res.data);
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProjects(res.data);
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/projects/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editingTask) {
        await axios.put(`${API_URL}/tasks/${editingTask._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Task updated!');
      } else {
        await axios.post(`${API_URL}/tasks`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Task created!');
      }
      fetchTasks();
      setShowModal(false);
      setEditingTask(null);
      setFormData({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', dueDate: '' });
    } catch (err) {
      alert('Error saving task');
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    const token = localStorage.getItem('token');
    await axios.patch(`${API_URL}/tasks/${taskId}/status`, { status: newStatus }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTasks();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/tasks/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTasks();
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'in-progress') return 'bg-blue-100 text-blue-800';
    if (status === 'completed') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-800';
    if (priority === 'medium') return 'bg-orange-100 text-orange-800';
    if (priority === 'low') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tasks</h1>
        {user.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
            + New Task
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Project</th>
              <th className="p-3 text-left">Assigned To</th>
              <th className="p-3 text-left">Priority</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-500">{task.description}</div>
                </td>
                <td className="p-3">{task.project?.name || task.project}</td>
                <td className="p-3">{task.assignedTo?.name || task.assignedTo}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="p-3">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                    className={`border rounded px-2 py-1 ${getStatusColor(task.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="p-3">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No date'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setFormData({
                        title: task.title,
                        description: task.description,
                        project: task.project?._id || task.project,
                        assignedTo: task.assignedTo?._id || task.assignedTo,
                        priority: task.priority,
                        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
                      });
                      setShowModal(true);
                    }}
                    className="text-blue-600 mr-2"
                  >
                    Edit
                  </button>
                  {user.role === 'admin' && (
                    <button onClick={() => handleDelete(task._id)} className="text-red-600">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border p-2 rounded mb-3"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border p-2 rounded mb-3"
                rows="3"
                required
              />
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full border p-2 rounded mb-3"
                required
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full border p-2 rounded mb-3"
                required
              >
                <option value="">Assign To</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border p-2 rounded mb-3"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border p-2 rounded mb-3"
                required
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                  setFormData({ title: '', description: '', project: '', assignedTo: '', priority: 'medium', dueDate: '' });
                }}
                className="mt-2 text-gray-600 w-full"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;