import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'bg-blue-700' : '';

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">Team Task Manager</Link>
          <div className="flex space-x-4">
            <Link to="/" className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/')}`}>Dashboard</Link>
            <Link to="/projects" className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/projects')}`}>Projects</Link>
            <Link to="/tasks" className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/tasks')}`}>Tasks</Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.name} ({user.role})</span>
            <button onClick={onLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
