import React from 'react';


import '../Styles/Base/fonts.css';
import '../Styles/Page/SignUp.css';
import '../Styles/Base/glass.css';


import {FaRecycle} from "react-icons/fa"
import { useState } from 'react';

import {Formik,Form,Field,ErrorMessage} from "formik";
import * as Yup from "yup";
import { Link } from 'react-router-dom';


export const LoginPage = () => {
    const [errorMessage,setErrorMessage] = useState("");
  {/*Validation Using Yup*/}
  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  {/*Initial Values for Formik*/}
  const initialValues = {
    email: "",
    password: "",
  };

  {/*When the Sign Up Button is pressed*/}
  const handleSubmit = async (values, {setSubmitting,resetForm}) => {
    
    try{
      const response = await fetch("http://localhost:8000/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values), // Formik values
    });

    const data = await response.json();

    if (!response.ok) {
      setErrorMessage(data.error);
    } else {
      alert("Login successful!");
      alert(JSON.stringify(data, null, 2));
      resetForm();
      setErrorMessage(""); 
    }

    } catch(error){
        alert("Request failed: " + error.message);
    }finally{
      setSubmitting(false);
    }
  };



  return (
    <div className = "signup-container">
      {/*Left Side */}
      <div className = "left-side">
        <h1 className = "Main Title">Bienvenue</h1>
        <p style={{color:'white'}}>Recyclez aujourd'hui, vivez demain</p>
      </div>
      {/*Right Side*/}
      <div className="right-side">
        <div className ="glass2 custom">
          <div className = "logo">
            <FaRecycle  size = {40} style={{color: 'green',marginRight:15}}/>
            <h2 className = "logo-title">WasteWare</h2>
          </div>
          <h1 style={{margin: 0}}>Join Us</h1>
          <p style={{marginBottom:40}}>Start making a difference today</p>
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
                <ErrorMessage name="email" component="div" className="error_e"  /><br/>
                <Field
                    type="password"
                    name="password"
                    placeholder="Create Password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                />
                <div >                
                    <ErrorMessage name="password" component="div" style={{color:'red',fontSize: '0.9rem',display:'flex', justifyContent:'center'}}  />
                </div>
                { errorMessage && <p style={{color:'red', fontSize:14}}>{errorMessage} or account does not exists</p>}
                <button type="submit" style={{marginTop:20}}>Login</button>

                <p className="signin">
                 Don't have an account? <Link to="/SignUp" className = "link">Sign Up</Link>
                </p>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
    
  )
}
export default LoginPage;