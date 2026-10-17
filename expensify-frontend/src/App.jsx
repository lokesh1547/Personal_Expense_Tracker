//import './App.css';

import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AuthContext from './context/AuthContext';  // Import AuthContext
import InsightsPage from "./pages/InsightsPage";



const App = () => {
    const { user, loading } = useContext(AuthContext); // Check login status from context
    
    if (loading) {
        return <p>Loading...</p>;
    }
    
    return (
        
        <Routes>
            {/* Public Routes */}
            <Route 
                path="/login" 
                element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route 
                path="/register" element={<RegisterPage />} 
            />

            {/* Protected Route - Only logged-in users can access */}
            <Route 
                path="/dashboard" 
                element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
            />

            <Route 
                path="/insights" 
                element={user ? <InsightsPage /> : <Navigate to="/login" replace />}
            />

            {/* Default route (redirect to login) */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default App;
