import { useState, useContext } from 'react';  // Import React hooks
import { useNavigate } from 'react-router-dom';  // Import navigate hook for page redirection
import AuthContext from '../context/AuthContext';  // Import AuthContext to access register function

function RegisterForm() {

    // State to store input data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');  // To store any error messages
    const [loading, setLoading] = useState(false);  // Loading state for form submission

    // Get the register function from AuthContext
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();  // To redirect the user after successful registration

    // Basic form validation
    const validateForm = () => {
        if (!name || !email || !password) {
            setError("All fields are required!");
            return false;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return false;
        }
        setError("");  // Clear previous error if validation passes
        return true;
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();  // Prevent the page from refreshing

        // Validate form before submitting
        if (!validateForm()) return;

        setLoading(true);  // Set loading state to true when submitting the form

        // Call the register function from AuthContext
        register(name, email, password)
            .then(() => {
                setName('');  // Reset the form on success
                setEmail('');
                setPassword('');
                setError('');  // Clear any previous errors

                // After successful registration, navigate to login or dashboard page
                navigate("/login"); // Redirect to login page after successful registration
            })
            .catch(() => {
                setError('Failed to register. Try again.');  // Show an error if registration fails
            })
            .finally(() => {
                setLoading(false);  // Reset loading state after the request completes
            });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name">Name</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                />
            </div>
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
            {error && <p className="text-red-500">{error}</p>}  {/* Display error message */}
            <button type="submit" className="btn" disabled={loading}>
                {loading ? "Registering..." : "Register"}
            </button>  {/* Disable the button and show loading text */}
        </form>
    );
}

export default RegisterForm;
