// import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Client/clientDashboard";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import Reports from "./Pages/Client/clientReports";
import { AuthProvider } from "./Components/AuthProvider";
import CompanyDashboard from "./Pages/Company/companyDashboard";
import TruckRoutes from "./Pages/Company/companyRoutes";
import CompanySchedule from "./Pages/Company/companySchedule";
import ClientMap from "./Pages/Client/clientMap";
import ClientProfile from "./Pages/Client/clientProfile";
import CompanyDashboard from "./Pages/companyDashboard";
import TruckRoutes from "./Pages/companyRoutes";
import Chatbot from "./Components/chatbot";
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/client/map" element={<ClientMap />} />
          <Route path="/client/report" element={<Reports />} />
          <Route path="/client/profile" element={<ClientProfile />} />

          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/schedule" element={<CompanySchedule />} />
          <Route path="/company/routes" element={<TruckRoutes />} />
        </Routes>
        <Chatbot />
      </AuthProvider>
    </div>
  );
}

export default App;
