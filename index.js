const express = require('express');
var cookieParser = require('cookie-parser');
const connectDB = require('./configs/dbConfig');
const employeeRoutes = require('./routes/employeeRoutes');

require('dotenv').config();

const app = express();
app.use(cookieParser());

// Connect to MongoDB
connectDB();

app.use(express.json());

// Use the employee routes
app.use('/api/v1/', employeeRoutes);

let port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
