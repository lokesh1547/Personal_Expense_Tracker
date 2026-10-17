const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register Route
const registerUser = async (req, res) => {


	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		return res.status(400).json({ message: "All fields are required" });
	}

	const hashedPassword = bcrypt.hashSync(password, 10);

	const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
	db.query(sql, [name, email, hashedPassword], (err, result) => {
		if (err) {
			if (err.code === 'ER_DUP_ENTRY') {
				return res.status(400).json({ message: 'Email already exists' });
			}
			return res.status(500).json({ message: 'Database error' });
		}
		return res.status(201).json({ message: 'User registered successfully' });
	});
};

// Login Route
const loginUser = async (req, res) => {

	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ message: "Email and password are required" });
	}

	const sql = 'SELECT * FROM users WHERE email = ?';

	db.query(sql, [email], (err, results) => {

		if (err || results.length === 0) {
			return res.status(400).json({ message: 'Invalid email or password' });
		}

		const user = results[0];

		const isMatch = bcrypt.compareSync(password, user.password);

		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid email or password' });
		}

		const token = jwt.sign(
			{ id: user.id },
			process.env.JWT_SECRET,
			{ expiresIn: '1d' }
		);

		res.cookie('token', token, {
			httpOnly: true,
			secure: false,
			sameSite: 'Lax',
			maxAge: 24 * 60 * 60 * 1000
		});

		return res.status(200).json({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
			token: token,
			message: 'Login successful',
		});
	});
};



// Get User Route (Protected)
const getUser = async (req, res) => {

	const userId = req.userId;  // From the JWT payload

	const sql = 'SELECT id, name, email FROM users WHERE id = ?';
	db.query(sql, [userId], (err, results) => {
		if (err || results.length === 0) {
			return res.status(400).json({ message: 'User not found' });
		}
		return res.json(results[0]);
	});
};

const logout = async (req, res) => {
	res.clearCookie('token', {
		httpOnly: true,
		sameSite: 'Lax',
		secure: false, // set to true if you're using HTTPS
	});
	return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
	registerUser,
	loginUser,
	getUser,
	logout
}