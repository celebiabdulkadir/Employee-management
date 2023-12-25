const express = require('express');
const router = express.Router({ mergeParams: true });
const { check } = require('express-validator');
const {
	validateJWT,
	validateRefreshToken,
} = require('../middlewares/authMiddleware');
const employeeController = require('../controllers/employeeController');

// Define routes and map them to controller methods
router.post(
	'/register',
	[
		check('name', 'Name is required').notEmpty(),
		check('age', 'Age must be a valid number').isNumeric(),
		check('email', 'Email is not valid').isEmail(),
		check('password', 'Password must be 6 or more characters long').isLength({
			min: 6,
		}),
	],
	employeeController.register
);
router.post(
	'/login',
	[
		check('email', 'Email is required').isEmail(),
		check('password', 'Password is required').notEmpty(),
	],
	employeeController.login
);
router.post('/refresh', validateRefreshToken, employeeController.refreshToken);
router.post('/logout', validateRefreshToken, employeeController.logout);
router.post('/save', validateJWT, employeeController.createEmployee);
router.get('/employees', validateJWT, employeeController.getAllEmployees);
router.get('/employees/:id', validateJWT, employeeController.getEmployeeById);
router.put('/employees', validateJWT, employeeController.updateEmployee);
router.delete('/employees/:id', validateJWT, employeeController.deleteEmployee);

module.exports = router;
