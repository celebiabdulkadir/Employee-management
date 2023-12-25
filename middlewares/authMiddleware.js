const jwt = require('jsonwebtoken');

const validateJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;

	// Check if the Authorization header is present
	if (!authHeader) {
		return res.status(401).send('Authorization header is missing');
	}

	// Extract the token from the Authorization header
	// Expected format: "Bearer [token]"
	const token = authHeader.split(' ')[1];

	// Verify the token
	jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY, (err, user) => {
		if (err) {
			return res.status(403).send('Token is invalid');
		}

		// Add the decoded user information to the request object
		req.user = user;
		next();
	});
};
const validateRefreshToken = (req, res, next) => {
	console.log('validateRefreshToken', req.cookies);
	const { refreshToken } = req.cookies;

	// Check if the refreshToken is present
	if (!refreshToken) {
		return res.status(401).send('Refresh token is missing');
	}

	// Verify the refresh token
	jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY, (err, user) => {
		if (err) {
			return res.status(403).send('Refresh token is invalid');
		}

		// Add the decoded user information to the request object
		req.user = user;
		next();
	});
};

module.exports = { validateJWT, validateRefreshToken };
