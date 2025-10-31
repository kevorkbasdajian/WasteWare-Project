// import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/clientDashboard';
import Reports from './Pages/clientReports'; // Make sure to create this component

import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/report" element={<Reports />} />
        {/* <Route path="/" element={<Dashboard />} /> */}
        <Route path="/SignUp" element = {<SignupPage/>}/>
        <Route path="/Login" element = {<LoginPage/>}/>
      </Routes>
      {/* <LoginPage/> */}

    </div>
  );
}

export default App;
