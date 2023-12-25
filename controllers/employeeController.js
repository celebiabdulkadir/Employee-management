const Employee = require('../models/employee');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const employeeController = {
	// Register a new employee
	async register(req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			let employee = await Employee.findOne({
				email: req.body.email.toLowerCase(),
			});
			if (employee) {
				return res.status(400).send('Employee already registered.');
			}
			employee = new Employee({ ...req.body });

			// ...
			const refreshToken = jwt.sign(
				{ id: employee._id, email: employee.email },
				process.env.JWT_REFRESH_SECRET_KEY,
				{ expiresIn: '7d' }
			);
			employee.refreshTokens.push(refreshToken);
			await employee.save();

			// Set the refreshToken in an HTTP-only cookie
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				// secure: true, // Uncomment this line if you're using HTTPS
				// sameSite: 'none', // Uncomment this line if you're using HTTPS and your frontend and backend are on different domains
			});

			res.status(201).json(employee);
			// ...
		} catch (err) {
			console.error(err);
			res.status(500).send('Error in saving');
		}
	},

	// Employee login
	async login(req, res) {
		try {
			const employee = await Employee.findOne({ email: req.body.email });
			if (!employee) {
				return res.status(400).send('Invalid email or password.');
			}
			const validPassword = await bcrypt.compare(
				req.body.password,
				employee.password
			);
			if (!validPassword) {
				return res.status(400).send('Invalid email or password.');
			}

			const refreshToken = jwt.sign(
				{ id: employee._id, email: employee.email },
				process.env.JWT_REFRESH_SECRET_KEY,
				{ expiresIn: '7d' }
			);
			employee.refreshTokens.push(refreshToken);
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				// secure: true, // Uncomment this line if you're using HTTPS
				// sameSite: 'none', // Uncomment this line if you're using HTTPS and your frontend and backend are on different domains
			});

			const accessToken = jwt.sign(
				{ id: employee._id, email: employee.email },
				process.env.JWT_ACCESS_SECRET_KEY,
				{ expiresIn: '30m' }
			);
			res.json({ accessToken });
		} catch (err) {
			console.error(err);
			res.status(500).send('Internal server error');
		}
	},

	// Refresh token
	async refreshToken(req, res) {
		const { refreshToken } = req.cookies;

		if (!refreshToken) return res.sendStatus(401);
		console.log('refreshToken', refreshToken);
		const employee = await Employee.findOne({
			refreshTokens: { $in: [refreshToken] },
		});
		console.log('employee', employee);
		if (!employee) return res.sendStatus(403);

		jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET_KEY,
			(err, user) => {
				if (err) return res.sendStatus(403);

				const accessToken = jwt.sign(
					{ id: user._id, email: user.email },
					process.env.JWT_ACCESS_SECRET_KEY,
					{ expiresIn: '1h' }
				);
				res.json({ accessToken });
			}
		);
	},

	// Logout employee
	async logout(req, res) {
		const { refreshToken } = req.cookies;
		const employee = await Employee.findOne({
			refreshTokens: { $in: [refreshToken] },
		});
		if (!employee) return res.sendStatus(204); // No Content

		employee.refreshTokens = employee.refreshTokens.filter(
			(token) => token !== refreshToken
		);
		await employee.save();
		res.clearCookie('refreshToken');
		res.sendStatus(204);
	},

	// Create a new employee (protected route)
	async createEmployee(req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const employee = await Employee.create({ ...req.body });
			employee = await Employee.findById(employee._id).select(
				'-password -refreshTokens'
			);
			res.status(201).json(employee);
		} catch (err) {
			console.error(err);
			res.status(500).send('Error creating employee');
		}
	},

	// Retrieve all employees (protected route)
	async getAllEmployees(req, res) {
		try {
			const employees = await Employee.find().select(
				'-password -refreshTokens'
			);
			res.json(employees);
		} catch (err) {
			console.error(err);
			res.status(500).send('Error retrieving employees');
		}
	},

	// Retrieve a single employee by ID (protected route)
	async getEmployeeById(req, res) {
		try {
			const employee = await Employee.findById(req.params.id).select(
				'-password -refreshTokens'
			);
			if (!employee) {
				return res.status(404).send('Employee not found');
			}
			res.json(employee);
		} catch (err) {
			console.error(err);
			res.status(500).send('Error retrieving employee');
		}
	},

	// Update an employee by ID (protected route)
	async updateEmployee(req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const id = req.body.id;
		// if (!mongoose.Types.ObjectId.isValid(id)) {
		// 	return res.status(400).send('Invalid ID');
		// }

		try {
			let employee = await Employee.findByIdAndUpdate(id, req.body, {
				new: true,
				runValidators: true,
			});
			if (!employee) {
				return res.status(404).send('Employee not found');
			}
			employee = await Employee.findById(employee._id).select(
				'-password -refreshTokens'
			);
			res.json(employee);
		} catch (err) {
			console.error(err);
			res.status(500).send('Error updating employee');
		}
	},

	// Delete an employee by ID (protected route)
	async deleteEmployee(req, res) {
		try {
			const employee = await Employee.findByIdAndDelete(req.params.id);
			if (!employee) {
				return res.status(404).send('Employee not found');
			}
			res.sendStatus(204);
		} catch (err) {
			console.error(err);
			res.status(500).send('Error deleting employee');
		}
	},
};

module.exports = employeeController;
