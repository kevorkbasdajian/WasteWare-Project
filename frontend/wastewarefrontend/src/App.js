// import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/clientDashboard";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import Reports from "./Pages/clientReports";
import { AuthProvider } from "./Components/AuthProvider";
import CompanyDashboard from "./Pages/companyDashboard";
import TruckRoutes from "./Pages/companyRoutes";
import Chatbot from "./Components/chatbot";
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/routes" element={<TruckRoutes />} />
          <Route path="/report" element={<Reports />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
        <Chatbot />
      </AuthProvider>
    </div>
  );
}

export default App;
