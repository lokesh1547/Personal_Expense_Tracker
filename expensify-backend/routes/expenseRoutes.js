const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for in-memory file uploads (max 10MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

const { 
    addExpense, 
    getExpenses, 
    updateExpense, 
    deleteExpense, 
    getInsights,
    scanBill,
    sendMonthlySummary
} = require('../controllers/expenseController');
const verifyToken = require('../middleware/authMiddleware');

// Route: POST /api/expenses
// Purpose: Create new expense
router.post('/', verifyToken, addExpense);

// Route: GET /api/expenses 
// Purpose: Get all expenses
router.get('/', verifyToken, getExpenses);

// Route: PUT /api/expenses/:id 
// Purpose: Update expense
router.put('/:id', verifyToken, updateExpense);

// Route: DELETE /api/expenses/:id 
// Purpose: Delete expense
router.delete('/:id', verifyToken, deleteExpense);

// Route: GET /api/expenses/insights 
// Purpose: Monthly analytics & insights
router.get('/insights', verifyToken, getInsights);

// Route: POST /api/expenses/scan-bill
// Purpose: AI-powered bill/receipt OCR and metadata extraction
router.post('/scan-bill', verifyToken, upload.single('bill'), scanBill);

// Route: POST /api/expenses/send-monthly-summary
// Purpose: Trigger monthly summary email alert for user
router.post('/send-monthly-summary', verifyToken, sendMonthlySummary);

module.exports = router;
