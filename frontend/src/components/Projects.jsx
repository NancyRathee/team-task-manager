import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Projects({ user }) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', members: [] });

  // Helper to get token from localStorage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchProjects();
    if (user.role === 'admin') fetchUsers();
  }, []);

  const fetchProjects = async () => {
    const token = getToken();
    if (!token) return;
    const res = await axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProjects(res.data);
  };

  const fetchUsers = async () => {
    const token = getToken();
    if (!token) return;
    const res = await axios.get(`${API_URL}/projects/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      if (editingProject) {
        await axios.put(`${API_URL}/projects/${editingProject._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Project updated!');
      } else {
        await axios.post(`${API_URL}/projects`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Project created!');
      }
      fetchProjects();
      setShowModal(false);
      setEditingProject(null);
      setFormData({ name: '', description: '', members: [] });
    } catch (err) {
      alert('Error saving project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    const token = getToken();
    if (!token) return;
    await axios.delete(`${API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchProjects();
  };

  const handleMemberSelect = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        {user.role === 'admin' && (
          <button
            onClick={() => {
              setEditingProject(null);
              setFormData({ name: '', description: '', members: [] });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(p => (
          <div key={p._id} className="bg-white rounded shadow p-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">{p.name}</h2>
              {user.role === 'admin' && (
                <div>
                  <button
                    onClick={() => {
                      setEditingProject(p);
                      setFormData({
                        name: p.name,
                        description: p.description,
                        members: p.members || []
                      });
                      setShowModal(true);
                    }}
                    className="text-blue-600 mr-2"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p._id)} className="text-red-600">
                    Delete
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-600 mt-2">{p.description}</p>
            <p className="text-sm text-gray-500 mt-2">Members: {p.members?.length || 0}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-8 w-96">
            <h2 className="text-2xl font-bold mb-4">{editingProject ? 'Edit Project' : 'New Project'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border p-2 rounded mb-3"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full border p-2 rounded mb-3"
                rows="3"
                required
              />
              {user.role === 'admin' && users.length > 0 && (
                <div className="mb-3">
                  <label className="block mb-1">Team Members</label>
                  {users.map(u => (
                    <label key={u._id} className="block">
                      <input
                        type="checkbox"
                        checked={formData.members.includes(u._id)}
                        onChange={() => handleMemberSelect(u._id)}
                      /> {u.name} ({u.email})
                    </label>
                  ))}
                </div>
              )}
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingProject(null);
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

export default Projects;