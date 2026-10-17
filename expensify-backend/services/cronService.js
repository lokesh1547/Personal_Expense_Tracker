const cron = require('node-cron');
const moment = require('moment');
const db = require('../db/db');
const { generateMonthlyReportHtml, sendEmail } = require('./emailService');

/**
 * Computes expense metrics for a user within a date window and sends the email alert
 */
async function sendMonthlyReportForUser(userId, targetMonth = null) {
  return new Promise((resolve, reject) => {
    // 1. Determine target date range
    let startDate, endDate, monthName;
    if (targetMonth) {
      // Form: YYYY-MM
      startDate = moment(targetMonth, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
      endDate = moment(targetMonth, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');
      monthName = moment(targetMonth, 'YYYY-MM').format('MMMM YYYY');
    } else {
      // Previous month
      const prevMonth = moment().subtract(1, 'month');
      startDate = prevMonth.startOf('month').format('YYYY-MM-DD');
      endDate = prevMonth.endOf('month').format('YYYY-MM-DD');
      monthName = prevMonth.format('MMMM YYYY');
    }

    // 2. Fetch user details
    const userSql = 'SELECT id, name, email FROM users WHERE id = ?';
    db.query(userSql, [userId], (err, users) => {
      if (err || !users || users.length === 0) {
        return reject(new Error(err ? err.message : 'User not found'));
      }
      const user = users[0];
      if (!user.email) {
        return resolve({ skipped: true, reason: 'No email address on file' });
      }

      // 3. Fetch user's expenses for that month
      const expenseSql = 'SELECT * FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC';
      db.query(expenseSql, [userId, startDate, endDate], async (err, expenses) => {
        if (err) {
          return reject(err);
        }

        const transactionCount = expenses.length;
        let totalSpent = 0;
        let highestExpense = 0;
        let topCategory = 'None';
        let categoryBreakdown = [];

        if (transactionCount > 0) {
          totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          highestExpense = Math.max(...expenses.map(e => parseFloat(e.amount || 0)));

          const categoryTotals = {};
          for (const exp of expenses) {
            const cat = exp.category || 'General';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(exp.amount || 0);
          }

          categoryBreakdown = Object.entries(categoryTotals).map(([category, value]) => ({
            category,
            value: parseFloat(value.toFixed(2)),
          }));

          topCategory = Object.entries(categoryTotals).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        }

        const html = generateMonthlyReportHtml({
          userName: user.name || user.email.split('@')[0],
          monthName,
          totalSpent,
          highestExpense,
          topCategory,
          transactionCount,
          categoryBreakdown,
          dashboardUrl: process.env.CLIENT_URL || 'http://localhost:5173/dashboard',
        });

        try {
          const result = await sendEmail({
            to: user.email,
            subject: `📊 Expensify: Your ${monthName} Spending Report`,
            html,
          });
          resolve({
            success: true,
            user: { id: user.id, email: user.email, name: user.name },
            month: monthName,
            totalSpent,
            transactionCount,
            ...result,
          });
        } catch (mailErr) {
          reject(mailErr);
        }
      });
    });
  });
}

/**
 * Executes monthly summary dispatch for all registered users
 */
async function dispatchMonthlyReportsToAllUsers(targetMonth = null) {
  return new Promise((resolve) => {
    db.query('SELECT id, name, email FROM users WHERE email IS NOT NULL AND email != ""', async (err, users) => {
      if (err) {
        console.error('[Cron] Failed to fetch users for monthly reports:', err);
        return resolve({ success: false, error: err.message });
      }

      console.log(`[Cron] Initiating monthly reports for ${users.length} users...`);
      const results = [];

      for (const user of users) {
        try {
          const res = await sendMonthlyReportForUser(user.id, targetMonth);
          results.push({ userId: user.id, email: user.email, status: 'sent', details: res });
        } catch (userErr) {
          console.error(`[Cron] Error sending report to user ${user.id} (${user.email}):`, userErr.message);
          results.push({ userId: user.id, email: user.email, status: 'failed', error: userErr.message });
        }
      }

      console.log('[Cron] Monthly report broadcast completed.');
      resolve({ success: true, processed: results.length, results });
    });
  });
}

/**
 * Initializes the cron job scheduler
 */
function initCronJobs() {
  // Default: At 09:00 on the 1st of every month
  const schedule = process.env.MONTHLY_CRON_SCHEDULE || '0 9 1 * *';

  if (!cron.validate(schedule)) {
    console.error(`[Cron] Invalid cron expression: "${schedule}". Job not scheduled.`);
    return;
  }

  cron.schedule(schedule, async () => {
    console.log(`[Cron] Running scheduled monthly summary job (${schedule})...`);
    await dispatchMonthlyReportsToAllUsers();
  });

  console.log(`[Cron] Monthly expense summary cron job initialized with schedule: "${schedule}"`);
}

module.exports = {
  initCronJobs,
  sendMonthlyReportForUser,
  dispatchMonthlyReportsToAllUsers,
};
