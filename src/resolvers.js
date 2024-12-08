require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Expense = require("./models/Expense");
const Inventory = require("./models/Inventory");

const resolvers = {
  Query: {
    // User can only view their own data
    myExpenses: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Expense.find({ userId: user.userId }).populate(
        "inventoryItem"
      );
    },

    myTotalExpenses: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const userObj = await User.findById(user.userId);
      return userObj ? userObj.totalExpenses : 0;
    },

    // Merchant-only queries
    users: async (_, __, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      return await User.find({ role: "user" });
    },

    expenses: async (_, { userId }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      return await Expense.find({ userId }).populate("inventoryItem");
    },
    activeTimers: async (_, __, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      return await Expense.find({
        isTimerBased: true,
        timerStart: { $exists: true },
        timerEnd: { $exists: false },
        userId: null,
      });
    },
    userExpenseTotal: async (_, { userId }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      const userObj = await User.findById(userId);
      return userObj ? userObj.totalExpenses : 0;
    },

    inventoryItems: async (_, __, { user }) => {
      // Both users and merchants can view inventory
      if (!user) throw new Error("Not authenticated");
      return await Inventory.find({}).sort({ createdAt: -1 });
    },

    inventoryItem: async (_, { id }, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return await Inventory.findById(id);
    },
    userExpenses: async (_, { userId }, { user }) => {
      // Check if the requesting user is authenticated
      if (!user) throw new Error("Not authenticated");

      // Allow merchants to fetch any user's expenses or allow a user to fetch their own expenses
      if (user.role === "merchant" || user.userId === userId) {
        return await Expense.find({ userId });
      }

      throw new Error("Not authorized to view this user's expenses");
    },
  },

  Mutation: {
    login: async (_, { username, password }) => {
      try {
        console.log("Login attempt for username:", username); // Debug log

        const user = await User.findOne({ username });
        if (!user) {
          console.log("User not found"); // Debug log
          throw new Error("User not found");
        }

        if (password !== user.password) {
          // Note: In production, use bcrypt.compare
          console.log("Invalid password"); // Debug log
          throw new Error("Invalid password");
        }

        const token = jwt.sign(
          { userId: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        console.log("Login successful for user:", user.username); // Debug log

        return {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        };
      } catch (error) {
        console.error("Login error:", error); // Debug log
        throw error;
      }
    },

    // Merchant-only mutations
    createUser: async (_, { username, password, role }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");

      const hashedPassword = await bcrypt.hash(password, 10);
      return await User.create({
        username,
        password: hashedPassword,
        role,
      });
    },

    updateUser: async (_, { id, username, password }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");

      const updates = {};
      if (username) updates.username = username;
      if (password) updates.password = await bcrypt.hash(password, 10);

      return await User.findByIdAndUpdate(id, updates, { new: true });
    },

    deleteUser: async (_, { id }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      await User.findByIdAndDelete(id);
      await Expense.deleteMany({ userId: id });
      return true;
    },

    createExpense: async (_, { userId, description, amount }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");

      const expense = await Expense.create({ userId, description, amount });
      await User.findByIdAndUpdate(
        userId,
        { $inc: { totalExpenses: amount } },
        { new: true }
      );
      return expense;
    },

    createExpenseFromInventory: async (
      _,
      { userId, inventoryItemId },
      { user }
    ) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");

      const inventoryItem = await Inventory.findById(inventoryItemId);
      if (!inventoryItem) throw new Error("Inventory item not found");

      const expense = await Expense.create({
        userId,
        description: inventoryItem.name,
        amount: inventoryItem.price,
        inventoryItem: inventoryItemId,
      });

      await User.findByIdAndUpdate(
        userId,
        { $inc: { totalExpenses: inventoryItem.price } },
        { new: true }
      );

      return expense;
    },

    startTimerExpense: async (_, { description }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      return await Expense.create({
        userId: null,
        description,
        amount: 0,
        isTimerBased: true,
        timerStart: new Date(),
      });
    },

    stopTimerExpense: async (_, { expenseId, userId }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");

      const expense = await Expense.findById(expenseId);
      if (!expense || !expense.isTimerBased) {
        throw new Error("Invalid timer expense");
      }

      const endTime = new Date();
      const minutes = Math.ceil((endTime - expense.timerStart) / (1000 * 60));
      const amount = minutes * 5; // 5 rs per minute

      // Update the expense with user and end time
      const updatedExpense = await Expense.findByIdAndUpdate(
        expenseId,
        {
          userId,
          timerEnd: endTime,
          amount,
        },
        { new: true }
      );

      // Update user's total expenses
      await User.findByIdAndUpdate(
        userId,
        { $inc: { totalExpenses: amount } },
        { new: true }
      );

      return updatedExpense;
    },

    // Inventory management (merchant-only)
    createInventoryItem: async (_, { name, description, price }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      return await Inventory.create({ name, description, price });
    },

    updateInventoryItem: async (
      _,
      { id, name, description, price },
      { user }
    ) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");

      const updates = {};
      if (name) updates.name = name;
      if (description) updates.description = description;
      if (price !== undefined) updates.price = price;

      return await Inventory.findByIdAndUpdate(id, updates, { new: true });
    },

    deleteInventoryItem: async (_, { id }, { user }) => {
      if (!user || user.role !== "merchant") throw new Error("Not authorized");
      await Inventory.findByIdAndDelete(id);
      return true;
    },
  },
};

module.exports = resolvers;
