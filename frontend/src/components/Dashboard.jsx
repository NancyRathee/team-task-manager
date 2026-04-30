import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Dashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load dashboard data.</p>
      </div>
    );
  }

  const { stats, recentTasks, overdueTasks } = dashboardData;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}! 👋</h2>
        <p className="text-blue-100">Here's what's happening with your projects today.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div className="text-gray-600 text-sm mb-1">Total Projects</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalProjects || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div className="text-gray-600 text-sm mb-1">Total Tasks</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalTasks || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div className="text-gray-600 text-sm mb-1">Completed Tasks</div>
          <div className="text-3xl font-bold text-green-600">{stats.completedTasks || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
          <div className="text-gray-600 text-sm mb-1">Overdue Tasks</div>
          <div className="text-3xl font-bold text-red-600">{stats.overdueTasks || 0}</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Overall Progress</h2>
        <div className="mb-2 flex justify-between">
          <span className="text-gray-700">Completion Rate</span>
          <span className="font-semibold text-green-600">{stats.completionRate || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-600 h-4 rounded-full transition-all duration-500" 
            style={{ width: `${stats.completionRate || 0}%` }}
          ></div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks || 0}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks || 0}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks || 0}</div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      {recentTasks && recentTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📋 Recent Tasks</h2>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task._id} className="border-b pb-3 last:border-0 hover:bg-gray-50 p-2 rounded transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{task.project?.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  📅 Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Tasks Alert */}
      {overdueTasks && overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-4">⚠️ Overdue Tasks</h2>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <div key={task._id} className="flex justify-between items-center bg-white rounded-lg p-3">
                <div>
                  <p className="font-semibold text-red-800">{task.title}</p>
                  <p className="text-sm text-red-600">
                    Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;