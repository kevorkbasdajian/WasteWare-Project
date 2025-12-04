import React, { useState, useContext, useEffect } from "react";

import "../Styles/Base/fonts.css";
import "../Styles/Page/SignUp.css";
import "../Styles/Base/glass.css";

import { FaRecycle } from "react-icons/fa";

import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../Components/AuthProvider";
import Loading from "../Content/Loading.json";
import { Box, Slide, Alert, Snackbar } from "@mui/material";
import Lottie from "lottie-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import AlertSnackbar from "../Components/Alert";
export const SignUpPage = () => {
  const [backendError, setBackendError] = useState("");
  const { saveAccessToken, accessToken } = useContext(AuthContext);
  const [snackbar, setsnackbar] = useState(false);
  const [is_loading, set_is_loading] = useState(false);
  const navigate = useNavigate();
  const { user_type, set_user_type, saveusertype } = useContext(AuthContext);
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

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
  }, [navigate]);

  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone_number: Yup.string()
      .matches(/^\d{11}$/, "Phone number must be 11 digits")
      .required("Phone number is required"),
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
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const { password2, terms, ...payload } = values;
    set_is_loading(true);
    let url = "http://localhost:8000/api/auth/signup/user/";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      set_is_loading(false);

      if (!response.ok) {
        setBackendError(data.email?.[0] || data.detail || "Signup failed.");
      } else {
        setsnackbar(true);

        const accessToken = data.access || data.token?.access;

        if (accessToken) {
          saveAccessToken(accessToken);
        } else {
          console.log("⚠️ No token in response!");
        }
      }
    } catch (error) {
      console.log("❌ Request failed:", error);
      alert("Request failed: " + error.message);
    } finally {
      setSubmitting(false);
      resetForm();
    }
  };
  const closesnackbar = () => {
    setsnackbar(false);
    saveusertype("user");
    navigate("/", { replace: true });
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

      <AlertSnackbar
        open={snackbar}
        onClose={closesnackbar}
        message="Signup Successful"
      />
      {is_loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: 1001,
          }}
        >
          <div>
            <Lottie
              animationData={defaultOptions.animationData}
              loop={defaultOptions.loop}
              autoplay={defaultOptions.autoplay}
              style={{ width: 450, height: 450 }}
            />
          </div>

          <div>
            <p
              style={{
                fontSize: 80,
                marginTop: 0,
                fontFamily: "Montserrat",
                color: "#E6FFE6",
                marginLeft: 30,
              }}
            >
              Loading ...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default SignUpPage;
