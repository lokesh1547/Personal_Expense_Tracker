import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import '../styles/LoginPage.css'; // Add this import

const LoginPage = () => {
  return (
    <div className="login-page-container">
      <h2 className="login-heading">Login</h2>
      <LoginForm />
      <p className="register-link">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
