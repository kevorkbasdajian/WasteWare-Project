import { useState } from "react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    const response = await fetch("http://localhost:8000/api/auth/signup/user/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    console.log("Signup Response:", data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Signup</h2>

      <input name="first_name" placeholder="First Name" onChange={handleChange} /> <br />
      <input name="last_name" placeholder="Last Name" onChange={handleChange} /> <br />
      <input name="email" placeholder="Email" onChange={handleChange} /> <br />
      <input name="password" placeholder="Password" type="password" onChange={handleChange} /> <br />
      <input name="phone_number" placeholder="Phone Number" onChange={handleChange} /> <br />

      <button onClick={handleSignup}>Sign Up</button>
    </div>
  );
}
