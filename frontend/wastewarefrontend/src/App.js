// import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/clientDashboard";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUpPage";
import { AuthProvider } from "./Components/AuthProvider";
import { TestFetch } from "./Components/TestFetch";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/SignUp" element={<SignupPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dummy" element={<TestFetch />} />

          <Route path="/Login" element={<LoginPage />} />
        </Routes>
        {/* <LoginPage/> */}
      </AuthProvider>
    </div>
  );
}

export default App;
