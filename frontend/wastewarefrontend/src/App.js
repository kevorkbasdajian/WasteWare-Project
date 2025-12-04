// import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/clientDashboard';
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import ProfilePage from './Pages/Profile/ProfilePage';
import EditProfilePage from './Pages/Profile/EditProfilePage';
import AdminUserManagement from './Pages/Admin/AdminUserManagement';
import AdminCompanyManagement from './Pages/Admin/AdminCompanyManagement';
import CompanyProfilePage from './Pages/Company/CompanyProfilePage';
import EditCompanyProfile from './Pages/Company/EditCompanyProfile';
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
        <Route path="/admin/company" element={<AdminCompanyManagement />} />
        <Route path="/company/profile" element={<CompanyProfilePage />} />
        <Route path="/company/edit-profile" element={<EditCompanyProfile />} />


      </Routes>
      {/* <LoginPage/> */}

    </div>
  );
}

export default App;


