// import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/clientDashboard';
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import ProfilePage from './Pages/Profile/ProfilePage';
import EditProfilePage from '../Pages/Profile/EditProfilePage';
import AdminUserManagement from '../src/Pages/Admin/Adminusermanagement';

function App() {
  return (
    <div className="App">
      <Routes>
         <Route path="/" element={<Dashboard />} /> 
        <Route path="/SignUp" element = {<SignupPage/>}/>
        <Route path="/Login" element = {<LoginPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/> 
        <Route path="/edit-profile" element={<EditProfilePage/>}/>  
        <Route path="/admin/users" element={<AdminUserManagement />} />

      </Routes>
      {/* <LoginPage/> */}

    </div>
  );
}

export default App;


