const db = require('../db/db');
const moment = require('moment');
const { parseBillWithGemini } = require('../services/geminiService');
const { sendMonthlyReportForUser } = require('../services/cronService');


// @desc    Add new expense
// @route   POST /api/expenses
// @access  Private (requires login)

const addExpense = (req, res) => {

    const userId = req.userId; // set by verifyToken middleware
    const { title, amount, category, date } = req.body;

    // Basic validation
    if (!title || !amount || !date) {
        return res.status(400).json({ message: "Title, amount, and date are required" });
    }

    const sql = `
    INSERT INTO expenses (user_id, title, amount, category, date)
    VALUES (?, ?, ?, ?, ?)
  `;



    db.query(sql, [userId, title, amount, category || '', date], (err, result) => {
        if (err) {
            console.error("DB Insert Error:", err);
            return res.status(500).json({ message: "Failed to add expense" });
        }

        const newExpense = {
            id: result.insertId,
            user_id: userId,
            title,
            amount,
            category: category || '',
            date,
        };

        return res.status(201).json({ message: "Expense added successfully", newExpense });
    });
};


// @desc    Get all expenses for the logged-in user
// @route   GET /api/expenses
// @access  Private
const getExpenses = (req, res) => {
    const userId = req.userId; // comes from middleware

    const sql = `SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("DB Fetch Error:", err);
            return res.status(500).json({ message: "Failed to fetch expenses" });
        }

        return res.status(200).json(results);
    });
};


// @desc    Update an existing expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = (req, res) => {
    const userId = req.userId; // from middleware
    const expenseId = req.params.id;
    const { title, amount, category, date } = req.body;


    // Validate required fields
    if (!title || !amount || !date) {
        return res.status(400).json({ message: "Title, amount, and date are required" });
    }

    const sql = `
    UPDATE expenses 
    SET title = ?, amount = ?, category = ?, date = ?
    WHERE id = ? AND user_id = ?
  `;

    db.query(sql, [title, amount, category || '', date, expenseId, userId], (err, result) => {
        if (err) {
            console.error("DB Update Error:", err);
            return res.status(500).json({ message: "Failed to update expense" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Expense not found or unauthorized" });
        }

        return res.status(200).json({ message: "Expense updated successfully" });
    });
};


// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = (req, res) => {

    const userId = req.userId; // from middleware
    const expenseId = req.params.id;

    const sql = `DELETE FROM expenses WHERE id = ? AND user_id = ?`;

    db.query(sql, [expenseId, userId], (err, result) => {
        if (err) {
            console.error("DB Delete Error:", err);
            return res.status(500).json({ message: "Failed to delete expense" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Expense not found or unauthorized" });
        }

        return res.status(200).json({ message: "Expense deleted successfully" });
    });
};



const getInsights = (req, res) => {
    const userId = req.userId;
    const month = req.query.month;

    if (!month) {
        return res.status(400).json({ message: "Month is required (YYYY-MM)" });
    }

    const startDate = `${month}-01`;
    const endDate = moment(startDate).endOf("month").format("YYYY-MM-DD");

    const sql = `SELECT * FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?`;

    db.query(sql, [userId, startDate, endDate], (err, expenses) => {
        if (err) {
            console.error("Error in getInsights:", err);
            return res.status(500).json({ message: "Server error" });
        }

        if (expenses.length === 0) {
            return res.json({
                totalSpent: 0,
                highestExpense: 0,
                topCategory: null,
                averageDaily: 0,
                categoryBreakdown: [],
                dailyTrends: [],
            });
        }

        // 1. Total spent & highest expense
        const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2);
        const highestExpense = Math.max(...expenses.map(e => parseFloat(e.amount))).toFixed(2);

        // 2. Category breakdown
        const categoryTotals = {};
        for (const exp of expenses) {
            categoryTotals[exp.category] = ((categoryTotals[exp.category] || 0) + exp.amount);
        }

        const categoryBreakdown = Object.entries(categoryTotals).map(([category, value]) => ({
            category,
            value: parseFloat(value).toFixed(2), // Convert value to a number
            color: getRandomColor(),
        }));


        // 3. Top category
        const topCategory = Object.entries(categoryTotals).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        // 4. Daily trends

        const dailyTotals = {};
        for (const exp of expenses) {
            const day = moment(exp.date).format("YYYY-MM-DD");
            dailyTotals[day] = ((dailyTotals[day] || 0) + parseFloat(exp.amount)); // Convert to number
        }


        const dailyTrends = Object.entries(dailyTotals).map(([date, amount]) => ({
            date,
            amount: parseFloat(amount).toFixed(2),
        }));

        // 5. Average daily spending
        const daysInMonth = moment(startDate).daysInMonth();
        const averageDaily = (totalSpent / daysInMonth).toFixed(2);


        res.json({
            totalSpent,
            highestExpense,
            topCategory,
            averageDaily,
            categoryBreakdown,
            dailyTrends,
        });
    });
};

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    return '#' + Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 16)]).join('');
}


// @desc    Scan a bill/receipt using Gen AI
// @route   POST /api/expenses/scan-bill
// @access  Private
const scanBill = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No bill image uploaded. Please provide an image file." });
        }

        const parsedData = await parseBillWithGemini(req.file.buffer, req.file.mimetype);
        return res.status(200).json({
            message: "Bill scanned successfully",
            expense: parsedData
        });
    } catch (error) {
        console.error("Error in scanBill:", error.message);
        return res.status(500).json({ 
            message: error.message || "Failed to analyze bill with AI" 
        });
    }
};

// @desc    Trigger monthly summary email alert manually for testing
// @route   POST /api/expenses/send-monthly-summary
// @access  Private
const sendMonthlySummary = async (req, res) => {
    const userId = req.userId;
    const month = (req.body && req.body.month) || req.query.month;
    try {
        const result = await sendMonthlyReportForUser(userId, month);
        return res.status(200).json({
            message: "Monthly expense summary email sent successfully",
            result
        });
    } catch (error) {
        console.error("Error sending monthly summary email:", error.message);
        return res.status(500).json({ 
            message: error.message || "Failed to send monthly expense summary" 
        });
    }
};

module.exports = {
    addExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
    getInsights,
    scanBill,
    sendMonthlySummary
};
