import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Import navigation hook
import AuthContext from '../context/AuthContext';

function LoginForm() {

    // States for input fields, error and loading
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);  // Loading state


    
    const { login } = useContext(AuthContext);  // Get login function from context
    const navigate = useNavigate();             // To navigate after login

    // Basic form validation
    const validateForm = () => {
        if (!email || !password) {
            setError('Both fields are required');
            return false;
        }
        setError('');  // Clear error if validation passes
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh

        if (!validateForm()) return;  // Validate form before submitting

        setLoading(true);  // Set loading state when the form is being submitted

        try {
            await login(email, password); // Call login from AuthContext
            setEmail('');
            setPassword('');
            setError('');
            navigate("/dashboard"); // Navigate to dashboard after successful login
        } catch (err) {
            console.error("Login error:", err); // Log error to help debug
            setError('Invalid email or password'); // Show friendly message
        } finally {
            setLoading(false);  // Reset loading state after the request is done
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                />
            </div>
            {/* Show error if any */}
            {error && <p className="text-red-500">{error}</p>}

            <button type="submit" className="btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}  {/* Show loading text */}
            </button>
        </form>
    );
}

export default LoginForm;
