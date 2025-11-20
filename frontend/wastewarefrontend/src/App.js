// import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/clientDashboard";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import Reports from "./Pages/clientReports";
import { AuthProvider } from "./Components/AuthProvider";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/SignUp" element={<SignupPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/Client/Reports" element={<Reports/>}/>
          <Route path="/Login" element={<LoginPage />} />
        </Routes>
        {/* <LoginPage/> */}
      </AuthProvider>
    </div>
  );
}

export default App;
