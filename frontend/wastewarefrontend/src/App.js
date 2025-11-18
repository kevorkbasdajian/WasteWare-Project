// import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/clientDashboard";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import { AuthProvider } from "./Components/AuthProvider";
import CompanyDashboard from "./Pages/companyDashboard";
import TruckRoutes from "./Pages/companyRoutes";
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/SignUp" element={<SignupPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/Company" element={<CompanyDashboard />} />
          <Route path="/Company/Routes" element={<TruckRoutes />} />

          <Route path="/Login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
