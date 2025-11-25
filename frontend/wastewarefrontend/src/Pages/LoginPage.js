import React, { useContext, useEffect, useState } from "react";

import "../Styles/Base/fonts.css";
import "../Styles/Page/SignUp.css";
import "../Styles/Base/glass.css";
import "@fontsource/roboto/300.css";
import { FaRecycle } from "react-icons/fa";
import { Box, Slide, Alert, Snackbar } from "@mui/material";
import Lottie from "lottie-react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../Components/AuthProvider";
import Loading from "../Content/Loading.json";
import "@fontsource/montserrat/700.css";

export const LoginPage = () => {
  // const { accessToken, saveAccessToken, clearAuth } = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState("");
  const { saveAccessToken, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [snackbar, setsnackbar] = useState(false);
  const [user_type, set_user_type] = useState("");
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const [is_loading, set_is_loading] = useState(false);
  // If user is already authenticated, redirect away from login page
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

  {
    /*Validation Using Yup*/
  }
  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  {
    /*Initial Values for Formik*/
  }
  const initialValues = {
    email: "",
    password: "",
  };

  {
    /*When the Sign Up Button is pressed*/
  }
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    set_is_loading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values), // Formik values
      });
      set_is_loading(false);
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error);
      } else {
        const accessToken = data.access || data.token?.access;
        if (accessToken) saveAccessToken(accessToken);
        setsnackbar(true);
        // alert(JSON.stringify(data, null, 2));
        set_user_type(data.user_type);
        setErrorMessage("");
      }
    } catch (error) {
      alert("Request failed: " + error.message);
    } finally {
      resetForm();
      setSubmitting(false);
    }
  };
  const closesnackbar = () => {
    setsnackbar(false);
    if (user_type === "company") {
      navigate("/company", { replace: true });
    }
    if (user_type === "user") navigate("/", { replace: true });
    else if (user_type === "admin")
      navigate("/admin/dashboard", { replace: true });
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
          <h1 style={{ margin: 0, color: "#000000" }}>Join Us</h1>
          <p style={{ marginBottom: 40 }}>Start making a difference today</p>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleChange, handleBlur }) => (
              <Form className="forms">
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
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.password}
                />
                <div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    style={{
                      color: "red",
                      fontSize: "0.9rem",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  />
                </div>
                {errorMessage && (
                  <p style={{ color: "red", fontSize: 14 }}>
                    {errorMessage} or account does not exists
                  </p>
                )}
                <button type="submit" style={{ marginTop: 20 }}>
                  Login
                </button>

                <p className="signin">
                  Don't have an account?{" "}
                  <Link to="/SignUp" className="link">
                    Sign Up
                  </Link>
                </p>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={snackbar}
        onClose={closesnackbar}
        autoHideDuration={2000}
        slots={{ transition: Slide }}
      >
        <Alert
          onClose={closesnackbar}
          severity="success"
          variant="filled"
          sx={{
            width: 400,
            fontSize: 17,
            fontWeight: "bold",
            borderRadius: 5,
          }}
        >
          <Box sx={{ marginLeft: 11 }}>Login Successful</Box>
        </Alert>
      </Snackbar>
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
export default LoginPage;
