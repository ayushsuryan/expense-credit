const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = async (req) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
};

module.exports = authMiddleware;
