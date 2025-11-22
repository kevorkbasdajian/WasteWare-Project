import React, { useState, useContext, useEffect } from "react";

import "../Styles/Base/fonts.css";
import "../Styles/Page/SignUp.css";
import "../Styles/Base/glass.css";

import { FaRecycle } from "react-icons/fa";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../Components/AuthProvider";
export const SignUpPage = () => {
  const [backendError, setBackendError] = useState("");
  const { saveAccessToken, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect away from signup page if already authenticated
  useEffect(() => {
    const token =
      accessToken ||
      (() => {
        try {
          return sessionStorage.getItem("access_token");
        } catch (e) {
          return null;
        }
      })();
    if (token) {
      navigate("/", { replace: true });
    }
  }, [accessToken, navigate]);

  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone_number: Yup.string()
      .matches(/^\d{11}$/, "Phone number must be 11 digits")
      .required("Phone number is required"),
    role: Yup.string()
      .oneOf(["User", "Admin"], "Please select a valid role")
      .required("Please select a role"),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
    password2: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    terms: Yup.bool().oneOf([true], "You must accept the terms"),
  });

  const initialValues = {
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    password2: "",
    terms: false,
    role: "", // Empty string to show placeholder
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const { password2, terms, role, ...payload } = values;
    let url = "http://localhost:8000/api/auth/signup/user/";
    if (values.role === "Admin")
      url = "http://localhost:8000/api/auth/signup/admin/";
    if (values.role === "Company")
      url = "http://localhost:8000/api/auth/signup/company/";

    try {
      console.log("📤 Submitting to:", url);
      console.log("📤 Payload:", payload);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("📥 Response status:", response.status);
      console.log("📥 Response data:", data); // 👈 Check what backend returns

      if (!response.ok) {
        setBackendError(data.email?.[0] || data.detail || "Signup failed.");
      } else {
        const accessToken = data.access || data.token?.access;
        console.log("🔑 Token received:", accessToken ? "Yes" : "No"); // 👈 Debug
        console.log("🔑 Token value:", accessToken?.substring(0, 30) + "..."); // 👈 Debug

        if (accessToken) {
          saveAccessToken(accessToken);
          console.log("💾 Token saved to context and sessionStorage");

          // Verify it was saved
          console.log(
            "✅ SessionStorage check:",
            sessionStorage.getItem("access_token")?.substring(0, 30) + "..."
          );
        } else {
          console.log("⚠️ No token in response!");
        }

        alert("Signup successful!");
        if (role === "Admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "User")
          navigate("/user/dashboard", { replace: true });
        else navigate("/company/dashboard", { replace: true });
      }
    } catch (error) {
      console.log("❌ Request failed:", error);
      alert("Request failed: " + error.message);
    } finally {
      setSubmitting(false);
      resetForm();
    }
  };

  return (
    <div className="signup-container">
      {/*Left Side */}
      <div className="left-side">
        <h1 className="Main Title">Bienvenue</h1>
        <p style={{ color: "white" }}>Recyclez aujourd'hui, vivez demain</p>
      </div>
      {/*Right Side*/}
      <div className="right-side">
        <div className="glass2 custom">
          <div className="logo">
            <FaRecycle size={40} style={{ color: "green", marginRight: 15 }} />
            <h2 className="logo-title">WasteWare</h2>
          </div>
          <h1 style={{ margin: 0 }}>Join Us</h1>
          <p style={{ marginBottom: 40 }}>Start making a difference today</p>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleChange, handleBlur }) => (
              <Form className="forms">
                <Field
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.first_name}
                />
                <ErrorMessage
                  name="first_name"
                  component="div"
                  className="error"
                />
                <br />

                <Field
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.last_name}
                />
                <ErrorMessage
                  name="last_name"
                  component="div"
                  className="error"
                />
                <br />

                <Field
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="error_e"
                />
                <br />

                <Field
                  type="tel"
                  name="phone_number"
                  placeholder="Phone Number"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.phone_number}
                />
                <ErrorMessage
                  name="phone_number"
                  component="div"
                  className="error_pn"
                />
                <br />
                <Field
                  as="select"
                  name="role"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.role}
                  className="role-select"
                >
                  <option value="">Select your role</option>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </Field>
                <ErrorMessage name="role" component="div" className="error" />
                <br />

                <div className="passwords">
                  <Field
                    type="password"
                    name="password"
                    placeholder="Create Password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                  />
                  <Field
                    type="password"
                    name="password2"
                    placeholder="Confirm Password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password2}
                  />
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="error"
                />

                <div className="checkbox">
                  <Field type="checkbox" name="terms" />
                  <label>
                    I agree to the <span> Terms of Service</span> and{" "}
                    <span> Privacy Policy</span>
                  </label>
                </div>
                <ErrorMessage name="terms" component="div" className="error" />

                <button type="submit">Sign Up</button>
                {backendError && (
                  <div
                    className="error"
                    style={{ color: "red", marginTop: "10px" }}
                  >
                    {backendError}
                  </div>
                )}

                <p className="signin">
                  Already have an account?{" "}
                  <Link to="/Login" className="link">
                    Sign In
                  </Link>
                </p>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};
export default SignUpPage;
