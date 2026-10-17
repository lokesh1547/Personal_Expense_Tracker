import React from "react";
import { Link } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import '../styles/RegisterPage.css'; // ⬅️ New CSS file

const RegisterPage = () => {
  return (
    <div className="register-page-container">
      <h2 className="register-heading">Create an Account</h2>
      <RegisterForm />
      <p className="login-link">
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
