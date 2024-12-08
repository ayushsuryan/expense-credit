const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Change this to allow null values initially
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  isTimerBased: { type: Boolean, default: false },
  timerStart: Date,
  timerEnd: Date,
});

module.exports = mongoose.model("Expense", expenseSchema);
