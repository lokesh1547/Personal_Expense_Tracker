const nodemailer = require('nodemailer');
let ResendClient = null;
try {
  const { Resend } = require('resend');
  ResendClient = Resend;
} catch (e) {
  // resend package not loaded
}

/**
 * Generates an elegant, responsive HTML template for monthly expense alerts
 */
function generateMonthlyReportHtml({ userName, monthName, totalSpent, highestExpense, topCategory, transactionCount, categoryBreakdown, dashboardUrl }) {
  const categoriesHtml = categoryBreakdown && categoryBreakdown.length > 0
    ? categoryBreakdown.map(item => `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 10px 14px; font-weight: 500; color: #2d3748;">${item.category || 'General'}</td>
        <td style="padding: 10px 14px; text-align: right; color: #4a5568; font-weight: 600;">₹${parseFloat(item.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px 14px; text-align: right; color: #718096; font-size: 13px;">
          ${totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(1) + '%' : '0%'}
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="3" style="padding: 14px; text-align: center; color: #718096;">No categorized expenses recorded for this month.</td></tr>`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Expense Summary</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7fafc; padding: 30px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                <div style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Expensify</div>
                <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; opacity: 0.9;">Monthly Financial Briefing</div>
                <div style="margin-top: 14px; display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                  📅 ${monthName}
                </div>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding: 28px 24px 14px 24px;">
                <h2 style="margin: 0 0 6px 0; color: #1a202c; font-size: 20px;">Hello, ${userName || 'Valued User'} 👋</h2>
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">
                  Here is your automated monthly expenditure summary. Keeping tabs on your spend keeps your financial goals on track!
                </p>
              </td>
            </tr>

            <!-- Metric Cards -->
            <tr>
              <td style="padding: 10px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="48%" style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 8px; padding: 14px; vertical-align: top;">
                      <div style="font-size: 12px; color: #2b6cb0; font-weight: 600; text-transform: uppercase;">Total Spent</div>
                      <div style="font-size: 22px; color: #2c5282; font-weight: 700; margin-top: 4px;">₹${parseFloat(totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="background-color: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 14px; vertical-align: top;">
                      <div style="font-size: 12px; color: #276749; font-weight: 600; text-transform: uppercase;">Highest Expense</div>
                      <div style="font-size: 22px; color: #22543d; font-weight: 700; margin-top: 4px;">₹${parseFloat(highestExpense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </td>
                  </tr>
                  <tr><td height="12" colspan="3"></td></tr>
                  <tr>
                    <td width="48%" style="background-color: #faf5ff; border: 1px solid #e9d8fd; border-radius: 8px; padding: 14px; vertical-align: top;">
                      <div style="font-size: 12px; color: #6b46c1; font-weight: 600; text-transform: uppercase;">Top Category</div>
                      <div style="font-size: 18px; color: #553c9a; font-weight: 700; margin-top: 4px;">${topCategory || 'None'}</div>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 14px; vertical-align: top;">
                      <div style="font-size: 12px; color: #c05621; font-weight: 600; text-transform: uppercase;">Total Transactions</div>
                      <div style="font-size: 22px; color: #9c4221; font-weight: 700; margin-top: 4px;">${transactionCount || 0}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Category Breakdown Table -->
            <tr>
              <td style="padding: 20px 24px 10px 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #2d3748;">📊 Spending by Category</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 14px; border: 1px solid #edf2f7; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #edf2f7; color: #4a5568; font-size: 12px; text-transform: uppercase;">
                      <th style="padding: 8px 14px; text-align: left;">Category</th>
                      <th style="padding: 8px 14px; text-align: right;">Amount</th>
                      <th style="padding: 8px 14px; text-align: right;">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${categoriesHtml}
                  </tbody>
                </table>
              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td style="padding: 24px 24px 30px 24px; text-align: center;">
                <a href="${dashboardUrl || 'http://localhost:5173/dashboard'}" target="_blank" style="display: inline-block; background-color: #3182ce; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 600; font-size: 14px; border-radius: 6px; box-shadow: 0 2px 4px rgba(49, 130, 206, 0.3);">
                  View Full Analytics in Dashboard &rarr;
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f7fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0;">
                <p style="margin: 0 0 6px 0;">This is an automated monthly financial notification sent by Expensify.</p>
                <p style="margin: 0;">Expensify • Smart Expense Management System</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Sends email via Resend API if RESEND_API_KEY is configured,
 * otherwise falls back to standard SMTP / Nodemailer (including Ethereal fallback).
 */
async function sendEmail({ to, subject, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Expensify <onboarding@resend.dev>';

  // 1. If user configured Resend API key
  if (resendKey && ResendClient) {
    try {
      const resend = new ResendClient(resendKey);
      const data = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
      });
      console.log(`[EmailService] Resend email successfully sent to ${to}. Message ID:`, data.data?.id || data.id);
      return { success: true, provider: 'resend', messageId: data.data?.id || data.id };
    } catch (err) {
      console.error('[EmailService] Resend delivery error:', err.message);
      // Fall through to SMTP if configured or throw
      throw err;
    }
  }

  // 2. Standard SMTP configuration (or Resend SMTP: smtp.resend.com)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });
    console.log(`[EmailService] SMTP email sent to ${to}. Message ID:`, info.messageId);
    return { success: true, provider: 'smtp', messageId: info.messageId };
  }

  // 3. Fallback to Ethereal Email for instant local testing without needing keys configured yet
  console.log('[EmailService] No active SMTP or RESEND_API_KEY detected. Using Ethereal test mailer...');
  const testAccount = await nodemailer.createTestAccount();
  const testTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await testTransporter.sendMail({
    from: '"Expensify Alerts" <alerts@expensify.local>',
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log('----------------------------------------------------');
  console.log(`[EmailService] Ethereal Preview URL for ${to}:`);
  console.log(previewUrl);
  console.log('----------------------------------------------------');

  return { success: true, provider: 'ethereal', messageId: info.messageId, previewUrl };
}

module.exports = {
  generateMonthlyReportHtml,
  sendEmail,
};
