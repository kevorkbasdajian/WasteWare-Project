import React from 'react';
import '../Styles/Page/clientDashboard.css';       // Dashboard CSS in same folder
import Navbar from '../Components/navbar.js'; // Component import

const Dashboard = () => {
const links = [
  { 
    name: 'Home', 
    path: '/', 
    color: 'var(--gradient-red)',
    glowColor: '#EF4444' // Solid color for LED glow
  },
  { 
    name: 'Map', 
    path: '/map', 
    color: 'var(--gradient-clean-blue)',
    glowColor: '#3B82F6'
  },
  { 
    name: 'Report', 
    path: '/report', 
    color: 'var(--gradient-purple)',
    glowColor: '#A855F7'
  },
  { 
    name: 'Rewards', 
    path: '/rewards', 
    color: 'var(--gradient-orange)',
    glowColor: '#F97316'
  },
  { 
    name: 'Profile', 
    path: '/profile', 
    color: 'var(--gradient-green-blue)',
    glowColor: '#10B981'
  },
];


  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout clicked');
  };

  return (
    <div className="page">
      <Navbar
        links={links}
        onLogout={handleLogout}
      />
      <main className="dashboard-content">
        <h1>Dashboard Content</h1>
      </main>
    </div>
  );
};

export default Dashboard;
