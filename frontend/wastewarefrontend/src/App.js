// import './App.css';
import React from "react";
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Client/clientDashboard";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import Reports from "./Pages/Client/clientReports";
import { AuthProvider } from "./Components/AuthProvider";
import CompanyDashboard from "./Pages/Company/companyDashboard";
import TruckRoutes from "./Pages/Company/companyRoutes";
import CompanySchedule from "./Pages/Company/companySchedule";
import CompanyReports from "./Pages/Company/companyReports";
import ClientMap from "./Pages/Client/clientMap";
import ClientProfile from "./Pages/Client/clientProfile";
import CompanyPickups from "./Pages/Company/companyPickups";
import Chatbot from "./Components/chatbot";
import AdminUserManagement from "./Pages/Admin/AdminUserManagement";
import CompanyNotifications from "./Pages/Company/companyNotifications";
import AdminCompanyManagement from "./Pages/Admin/AdminCompanyManagement";
import CompanyProfilePage from "./Pages/Company/CompanyProfilePage";
import EditCompanyProfile from "./Pages/Company/EditCompanyProfile";
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          {/* authentication */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* client */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/client/map" element={<ClientMap />} />
          <Route path="/client/reports" element={<Reports />} />
          <Route path="/client/profile" element={<ClientProfile />} />

          {/* admin */}
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/company" element={<AdminCompanyManagement />} />

          {/* company */}
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/schedule" element={<CompanySchedule />} />
          <Route path="/company/routes" element={<TruckRoutes />} />
          <Route path="/company/pickups" element={<CompanyPickups />} />
          <Route path="/company/reports" element={<CompanyReports />} />
          <Route path="/company/profile" element={<CompanyProfilePage />} />
          <Route
            path="/company/edit-profile"
            element={<EditCompanyProfile />}
          />
          <Route
            path="/company/notifications"
            element={<CompanyNotifications />}
          />
        </Routes>
        <Chatbot />
      </AuthProvider>
    </div>
  );
}

export default App;
