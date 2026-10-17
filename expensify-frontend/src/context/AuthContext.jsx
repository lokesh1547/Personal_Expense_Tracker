import { createContext, useState, useEffect } from 'react';  // React hooks
import axios from 'axios';                                   // Axios to make HTTP requests


// Create the context. This will be used to provide and consume authentication data across components.
const AuthContext = createContext();



// The provider component which will wrap the rest of your app and provide authentication data.
export function AuthProvider({ children }) {


    // State to hold the authenticated user's info
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);  // To handle loading state while checking user session




    // useEffect to check if the user is already logged in (by sending a request to the backend)
    useEffect(() => {
        axios.get('http://localhost:5000/api/user', { withCredentials: true })
            .then(response => {
                //console.log(response.data);
                setUser(response.data);  // If logged in, set user data
                setLoading(false);        // Set loading to false once data is fetched
            })
            .catch(error => {
                console.log('Not logged in');
                setLoading(false);        // Set loading to false if there's an error
            });
    }, []);




    // Function to handle login (accepts email and password)
    const login = (email, password) => {
        return axios.post('http://localhost:5000/api/login', { email, password }, { withCredentials: true })
            .then(response => {
                console.log("Login successful");

                setUser(response.data.user);  // If login is successful, set user data
                // Store token in localStorage to maintain session
                localStorage.setItem('token', response.data.token);
            })
            .catch((error) => {
                console.log('Login failed', error.response.data);
                throw new Error('Invalid email or password');  // Return an error if login fails
            });
    };



    // Function to handle registration (accepts name, email, and password)
    const register = (name, email, password) => {
        return axios.post('http://localhost:5000/api/register', { name, email, password })
            .then(response => {
                console.log(response.data);  // Log success message (can be customized)
            })
            .catch((error) => {
                console.log('Registration failed', error.response.data);
                throw new Error('Failed to register. Try again.');  // Return an error if registration fails
            });
    };




    // Function to log out the user (clear the user state)
    const logout = () => {
        axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true })
            .then(() => {
                setUser(null); // Clear state
                localStorage.removeItem('token'); // Optional, if you use it
            })
            .catch(err => {
                console.error('Logout failed:', err);
            });
    };



    // Return the context provider, making all the above methods and state available to children components
    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}  {/* Render all children components that are wrapped with AuthProvider */}
        </AuthContext.Provider>
    );
}

// Export the context to be used in other components
export default AuthContext;
