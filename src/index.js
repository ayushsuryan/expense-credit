const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const authMiddleware = require("./middleware/auth");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000; // Use environment variable for port
const MONGOURI = process.env.MONGOURI; // Use environment variable for MongoDB URI

app.use(cors());

// Connect to MongoDB
mongoose
  .connect(MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Create default merchant account if it doesn't exist
async function createDefaultMerchant() {
  try {
    const merchantExists = await User.findOne({ username: "admin" });
    if (!merchantExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        username: "admin",
        password: hashedPassword,
        role: "merchant",
      });
      console.log("Default merchant account created");
    }
  } catch (error) {
    console.error("Error creating default merchant:", error);
  }
}

// Context middleware for authentication
const context = async ({ req }) => {
  const user = await authMiddleware(req);
  return { user };
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  formatError: (err) => {
    console.error(err);
    // Return a more user-friendly error message
    return {
      message: err.message,
      status: err.extensions?.code || "INTERNAL_SERVER_ERROR",
    };
  },
});

async function startServer() {
  await createDefaultMerchant();
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: PORT }, () =>
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    )
  );
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
