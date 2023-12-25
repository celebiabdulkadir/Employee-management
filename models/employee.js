const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = process.env.SALT_ROUNDS; // You can adjust the number of rounds

const employeeSchema = new mongoose.Schema({
  name: String,
  age: Number,
  stillEmployee: Boolean,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: String,
  refreshTokens: [String], // New field for storing refresh tokens
});
employeeSchema.index({ email: 1 });


employeeSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const Employee = mongoose.model('employees', employeeSchema);

module.exports = Employee;
