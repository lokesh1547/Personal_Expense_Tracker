import '../styles/InsightsPage.css';

import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext"; // Importing authentication context
import { useNavigate } from "react-router-dom"; // Hook for navigation
import axios from "axios"; // For making HTTP requests

// Importing Recharts components for charts
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend as LineLegend, ResponsiveContainer } from "recharts";

const InsightsPage = () => {
    const { user, loading } = useContext(AuthContext); // Access user and loading status from context
    const navigate = useNavigate(); // Initialize navigation function

    // State for selected month filter (default: May 2025)
    const [month, setMonth] = useState("2025-05");

    // State to store stats data returned from API
    const [stats, setStats] = useState(null);

    // State to manage loading indicator for insights API
    const [loadingStats, setLoadingStats] = useState(true);

    // Redirect to login if user is not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [loading, user, navigate]);

    // Fetch insights data when month or user changes
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/expenses/insights?month=${month}`, {
                    withCredentials: true, // Include credentials for cookie-based auth
                });
                console.log(res.data);
                setStats(res.data); // Save the stats to state
            } catch (err) {
                console.error("Error fetching insights:", err); // Log any error
            } finally {
                setLoadingStats(false); // Stop loading
            }
        };

        if (user) {
            fetchStats(); // Fetch stats only if user is authenticated
        }
    }, [month, user]);

    // Update month filter when user selects a different month
    const handleMonthChange = (e) => {
        setMonth(e.target.value);
    };

    // Reset filter to show all data
    const handleClearFilters = () => {
        setMonth(""); // Set month to empty to remove filtering
    };

    // Show loading message while insights or auth state is loading
    if (loading || loadingStats) return <p>Loading insights...</p>;

    // Transform category-wise data with color for each category
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28FD0", "#FF6666"];

    const categoryData = stats?.categoryBreakdown?.map((item, index) => ({
        category: item.category,
        value: parseFloat(item.value),
        color: COLORS[index % COLORS.length],
    })) || [];

    console.log(categoryData);
    // Transform daily trends data for line chart
    const dailyData = stats?.dailyTrends?.map(item => ({
        date: item.date,
        amount: item.amount,
    })) || [];

    console.log("REACHED");

    return (
        <div className="insights-container">
            <h2>📊 Expense Insights</h2>
            <p>Hello, <strong>{user?.name || user?.email}</strong> 👋</p>

            {/* Month Selector Input */}
            <label>
                🔄 Select Month:
                <input
                    type="month"
                    value={month}
                    onChange={handleMonthChange}
                />
            </label>

            {/* Quick Stats Section - displayed at the top */}
            <div className="quick-stats">
                <h3>📌 Quick Stats</h3>
                <ul>
                    <li>🔸 Total Spent: ₹{stats?.totalSpent}</li>
                    <li>🔹 Highest Expense: ₹{stats?.highestExpense}</li>
                    <li>🔸 Top Category: {stats?.topCategory}</li>
                    <li>🔹 Avg. Daily Spend: ₹{stats?.averageDaily}</li>
                </ul>
            </div>

            <hr />

            {/* Pie Chart Section - Category Breakdown */}
            <div className="chart-section">
                <h3>🍽️ Category-wise Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="category"
                            outerRadius={100}
                            fill="#8884d8"
                            label
                        >
                            {/* Assign a unique color to each category */}
                            {categoryData.map((entry, index) => (
                                
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <hr />

            {/* Line Chart Section - Daily Spending Trends */}
            <div className="chart-section">
                <h3>📈 Daily Spending Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#82ca9d"
                            activeDot={{ r: 8 }}
                        />
                        <LineTooltip />
                        <LineLegend />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <hr />

            {/* Button to reset filters and show all data */}
            <button onClick={handleClearFilters}>🔄 Clear Filters</button>

            <br /><br />

            {/* Button to return back to the main dashboard */}
            <button onClick={() => navigate("/")}>⬅️ Back to Dashboard</button>
        </div>
    );
};

export default InsightsPage;
