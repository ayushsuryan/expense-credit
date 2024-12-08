# GraphQL API Documentation

## Authentication

### Login

Authenticate and get JWT token.

```graphql
mutation {
  login(username: "admin", password: "admin123") {
    token
    user {
      id
      username
      role
    }
  }
}
```

## User Operations

### View My Expenses

Get currently logged-in user's expenses.

```graphql
query {
  myExpenses {
    id
    description
    amount
    date
    isTimerBased
    timerStart
    timerEnd
  }
}
```

### View My Total Expenses

Get total expenses for logged-in user.

```graphql
query {
  myTotalExpenses
}
```

## Merchant (Admin) Operations

### User Management

#### List All Users

```graphql
query {
  users {
    id
    username
    role
    totalExpenses
  }
}
```

#### Create New User

```graphql
mutation {
  createUser(username: "john_doe", password: "password123", role: "user") {
    id
    username
    role
  }
}
```

#### Update User

```graphql
mutation {
  updateUser(
    id: "user_id_here"
    username: "new_username"
    password: "new_password"
  ) {
    id
    username
  }
}
```

#### Delete User

```graphql
mutation {
  deleteUser(id: "user_id_here")
}
```

### Expense Management

#### Create Regular Expense

```graphql
mutation {
  createExpense(
    userId: "user_id_here"
    description: "Pool Game"
    amount: 100.00
  ) {
    id
    description
    amount
    date
  }
}
```

#### View User's Expenses

```graphql
query {
  expenses(userId: "user_id_here") {
    id
    description
    amount
    date
    isTimerBased
    timerStart
    timerEnd
    inventoryItem {
      name
      price
    }
  }
}
```

#### Get User's Total Expenses

```graphql
query {
  userExpenseTotal(userId: "user_id_here")
}
```

### Timer-Based Expenses

#### Start Timer Expense

```graphql
mutation {
  startTimerExpense(description: "Pool Table 1") {
    id
    description
    timerStart
    isTimerBased
  }
}
```

#### Stop Timer Expense

```graphql
mutation {
  stopTimerExpense(expenseId: "expense_id_here", userId: "user_id_here") {
    id
    description
    amount
    timerStart
    timerEnd
  }
}
```

### Inventory Management

#### List All Inventory Items

```graphql
query {
  inventoryItems {
    id
    name
    description
    price
    createdAt
    updatedAt
  }
}
```

#### Get Single Inventory Item

```graphql
query {
  inventoryItem(id: "item_id_here") {
    id
    name
    description
    price
  }
}
```

#### Create Inventory Item

```graphql
mutation {
  createInventoryItem(
    name: "Pool Game - 30 mins"
    description: "30 minute pool game session"
    price: 150.00
  ) {
    id
    name
    price
  }
}
```

#### Update Inventory Item

```graphql
mutation {
  updateInventoryItem(
    id: "item_id_here"
    name: "Updated Name"
    description: "Updated description"
    price: 200.00
  ) {
    id
    name
    description
    price
  }
}
```

#### Delete Inventory Item

```graphql
mutation {
  deleteInventoryItem(id: "item_id_here")
}
```

#### Create Expense from Inventory

```graphql
mutation {
  createExpenseFromInventory(
    userId: "user_id_here"
    inventoryItemId: "inventory_item_id_here"
  ) {
    id
    description
    amount
    inventoryItem {
      name
      price
    }
  }
}
```

## Headers for Authentication

For all requests except login, include the JWT token in the HTTP headers:

```json
{
  "Authorization": "Bearer your_jwt_token_here"
}
```

## Error Handling

All operations may return the following errors:

- "Not authenticated" - No valid JWT token provided
- "Not authorized" - User doesn't have permission for the operation
- Other specific error messages related to the operation
