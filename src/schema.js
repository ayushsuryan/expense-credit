const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    role: String!
    totalExpenses: Float!
  }

  type Expense {
    id: ID!
    userId: ID!
    description: String!
    amount: Float!
    date: String!
    isTimerBased: Boolean!
    timerStart: String
    timerEnd: String
    inventoryItem: Inventory
  }

  type Inventory {
    id: ID!
    name: String!
    description: String!
    price: Float!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    myExpenses: [Expense]!
    myTotalExpenses: Float!
    users: [User]!
    expenses(userId: ID!): [Expense]!
    userExpenseTotal(userId: ID!): Float!
    inventoryItems: [Inventory]!
    inventoryItem(id: ID!): Inventory
    activeTimers: [Expense!]!
    userExpenses(userId: ID!): [Expense]!
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    createUser(username: String!, password: String!, role: String!): User!
    updateUser(id: ID!, username: String, password: String): User!
    deleteUser(id: ID!): Boolean!
    createExpense(userId: ID!, description: String!, amount: Float!): Expense!
    createExpenseFromInventory(userId: ID!, inventoryItemId: ID!): Expense!
    startTimerExpense(description: String!): Expense!
    stopTimerExpense(expenseId: ID!, userId: ID!): Expense!
    createInventoryItem(
      name: String!
      description: String!
      price: Float!
    ): Inventory!
    updateInventoryItem(
      id: ID!
      name: String
      description: String
      price: Float
    ): Inventory!
    deleteInventoryItem(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;
