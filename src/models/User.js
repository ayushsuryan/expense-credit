const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["merchant", "user"], required: true },
  totalExpenses: { type: Number, default: 0 }, // Tracks total expenses
});

module.exports = mongoose.model("User", userSchema);
