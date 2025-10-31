// import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/clientDashboard';
import Reports from './Pages/clientReports'; // Make sure to create this component


function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/report" element={<Reports />} />
      </Routes>
    </div>
  );
}

export default App;
