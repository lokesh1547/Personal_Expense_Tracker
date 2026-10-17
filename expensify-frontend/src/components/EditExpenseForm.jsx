import React, { useState } from "react";
import axios from "axios";

const EditExpenseForm = ({ expense, onSuccess, onCancel }) => {
    // Pre-fill form fields with current expense data
    const [title, setTitle] = useState(expense.title);
    const [amount, setAmount] = useState(expense.amount);
    const [category, setCategory] = useState(expense.category);
    const [date, setDate] = useState(expense.date.slice(0, 10)); // Trim time part


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.put(`http://localhost:5000/api/expenses/${expense.id}`, {
                title,
                amount,
                category,
                date,
            }, {
                withCredentials: true,
            });

            onSuccess({
                ...expense,
                title,
                amount,
                category,
                date,
            }); // Notify parent

        } catch (err) {
            console.error(err);
            setError("Failed to update expense");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="edit-expense-form">
            <h4>Edit Expense</h4>

            {error && <p className="error">{error}</p>}

            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />

            <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
            />

            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select Category</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Shopping">Shopping</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
            </select>

            <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
            />

            <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
            </button>

            <button type="button" onClick={onCancel} className="cancel-btn">
                Cancel
            </button>
        </form>
    );
};

export default EditExpenseForm;
