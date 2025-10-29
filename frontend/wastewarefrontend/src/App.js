// import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/clientDashboard';
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";

function App() {
  return (
    <div className="App">
      {/* <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes> */}
      <SignupPage/>
    </div>
  );
}

export default App;
