# Mill Management MVP

A lightweight, practical flour mill management application built around the client's real daily workflow.

The project started with a simple requirement: manage what **comes into the mill**, what is **produced**, what **goes out**, and the related **customer/source balances** without turning the system into a large ERP.

The application is intentionally kept simple, local-first, and easy for mill staff to use.

---

## Core Workflow

```text
Sources
   ↓
Purchases (Wheat / Bardana)
   ↓
Stock
   ↓
Production
   ↓
Finished Products
   ↓
Sales / Consumption
   ↓
Customer Accounts / Stock / Appendix / Expenses
```

---

## Technology Stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite using `better-sqlite3`
- **Icons:** Lucide React
- **Deployment style:** Local web application running in the browser

The application currently runs locally using:

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

Node.js 20+ is supported.

---

# Current Application Modules

## 1. Dashboard

Provides a quick operational overview of the mill, including current stock, sales-related information, pending customer balances, and recent activity.

The dashboard is intentionally kept simple instead of adding unnecessary charts or analytics.

---

## 2. Purchases

Wheat and Bardana purchases are grouped under one **Purchases** section.

### Wheat Purchase

Records:

- Date
- Source
- Source type: Government / Private
- Number of bags / Bardana
- Total Wheat in KG
- Wheat rate per KG
- Wheat cost
- Bardana rate per bag
- Bardana cost
- Total purchase cost
- Remarks

### Important Wheat Purchase Rules

- Wheat stock is increased by the entered KG.
- Bags received with wheat are also counted as **Bardana received**.
- Wheat and Bardana costs are stored separately.
- Purchase amount is added to the selected source account.
- A source can be added directly from the Wheat Purchase screen.

### Bardana Purchase

Bardana can also be purchased separately without Wheat.

Records:

- Date
- Source
- Quantity in bags
- Rate per bag
- Total cost
- Remarks

This increases Bardana stock and updates the source account.

---

## 3. Source Accounts

Sources can provide:

- Wheat
- Bardana
- Both Wheat and Bardana

Each source has its own account and ledger.

Supported source types:

- Government
- Private

Source account supports:

- Purchases
- Later payments
- Advance payments
- Payable balance
- Advance balance
- Complete transaction ledger
- Editable source details

### Source Balance Concept

```text
Opening Payable / Advance
+ Wheat Purchases
+ Bardana Purchases
- Source Payments
= Current Source Balance
```

A positive balance means money is payable to the source.

A negative balance means the mill has paid the source in advance.

---

## 4. Production

Production is currently recorded entirely in **KG**.

The system does **not** automatically convert Wheat into finished products.

The mill operator manually records:

- Date
- Wheat Used / Ground in KG
- Actual KG produced for each product
- Remarks

All active products are shown directly on the Production form.

The operator enters KG only for products actually produced and leaves the others blank.

### Production Rule

Example:

```text
Wheat Used: 100 KG

Fine: 70 KG
Atta: 10 KG
Fine Danedar: 2 KG
Suji: 1 KG
Maida: 2 KG
Chokar: 15 KG
```

The system:

- Reduces Wheat stock
- Adds the entered finished-product KG to stock

No fixed production/conversion percentage is enforced.

---

## 5. Products

Finished product types are managed by the admin.

Initial finished products are:

- Govt Atta
- Atta
- Fine
- Fine Danedar
- Maida
- Suji
- Chokar

Additional product types can be added later from **Settings → Products**.

Products can also be activated or deactivated.

Wheat is treated as a system stock item.

---

## 6. Sales / Billing

Sales are recorded by customer.

### Billing Rules

- Fixed bag sizes:
  - 20 KG
  - 40 KG
- Product rate is entered **per bag**, not per KG.
- Total KG is calculated automatically:

```text
Total KG = Number of Bags × Bag Size
```

- Item amount is calculated as:

```text
Amount = Number of Bags × Rate per Bag
```

- Product stock is reduced when the sale is saved.
- Sale is blocked if available stock is insufficient.
- Old pending balance does not prevent a new sale.

### Customer Selection

The billing screen supports:

- Search customer by name
- Search customer by phone
- View current Pending / Advance balance
- Add a new customer directly without leaving Billing

After creating a new customer from Billing, that customer is automatically selected.

### Bill

Each saved sale includes:

- Bill number
- Date
- Customer
- Products
- Bag size
- Number of bags
- Total KG
- Rate per bag
- Amount
- Amount received
- Pending amount

Bills can be viewed and printed.

---

## 7. Customer Accounts

Each customer has a running account.

Customer information includes:

- Name
- Phone
- Address

All three fields are editable.

Customer account shows:

- Total purchased
- Total paid
- Current pending amount
- Current advance
- Product quantities purchased
- Complete ledger

### Customer Payments

Customers can:

- Pay during a sale
- Pay an old balance later
- Pay in advance

If a payment is greater than the customer's current pending amount, the extra amount becomes **customer advance**.

### Customer Balance Concept

```text
Opening Due / Advance
+ Unpaid Sale Amounts
- Later Payments
= Current Customer Balance
```

Positive balance = Pending

Negative balance = Advance

### Customer Statement

Customer account statements can be printed using the browser's print function.

This can also be saved as PDF using:

```text
Print → Save as PDF
```

---

## 8. Stock

Stock is maintained through stock movements rather than manually duplicating closing values.

General rule:

```text
Closing Stock = Opening Stock + IN - OUT
```

The system tracks:

- Wheat
- Finished products
- Bardana

### Wheat Monthly Record

Monthly Wheat information includes:

- Opening Wheat
- Total Wheat In
- Wheat Used / Ground
- Current / Closing Wheat

### Finished Product Stock

Finished product stock changes through:

```text
Opening Stock
+ Production
- Sales
- Non-sale Consumption
= Current Stock
```

### Bardana Stock

Bardana records include:

- Total received
- Used
- Current

Bardana can enter the system through:

1. Bags received with Wheat
2. Separate Bardana purchases

**Bardana usage is not yet automatically deducted because the production-to-20/40 KG bag conversion rule is still awaiting client confirmation.**

---

## 9. Consumption

Produced products can leave the mill without being sold.

This is handled separately from Sales and Expenses because no customer payment is involved.

Supported reasons:

- Home
- Company / Mill Use
- Donation
- Other

Records:

- Date
- Product
- Quantity in KG
- Reason
- Remarks

Saving a Consumption entry:

- Reduces product stock
- Creates no sale
- Creates no customer transaction
- Creates no revenue

Example:

```text
Atta Stock: 100 KG
Home Consumption: 20 KG

Remaining Stock: 80 KG
```

---

## 10. Appendix

The Appendix provides the daily production record.

It uses the actual values entered in Production.

For each product:

```text
Production % = Product Produced KG / Wheat Used KG × 100
```

Example:

```text
Wheat Used = 100 KG
Fine Produced = 70 KG

Fine Production = 70%
```

The Appendix currently shows:

- Wheat Used / Ground
- Total Products Produced
- Current / Closing Wheat
- Product-wise produced KG
- Product-wise production percentage
- Product closing stock in KG
- Total production yield

### Pending Appendix Rule

Closing stock in **20 KG / 40 KG bags** will be added after the client confirms the packing/conversion rule.

Until then, Production and Appendix remain KG-based.

---

## 11. Expenses

Expenses are divided into two types.

### Automatic Purchase Expenses

These come directly from purchase records:

- Wheat purchase expense
- Bardana purchase expense

They do not need to be entered again manually.

### Other Expenses

Common repeatable categories:

- Electricity Bill
- Meal
- Employee Salaries
- Machinery Cost

For any other expense, the user can choose:

```text
One-time / Custom Category
```

and enter any category name, for example:

- Generator Repair
- Fuel
- Office Chair
- Transport
- Guest Expense

Other expenses can be added and edited.

Monthly expense summary includes:

- Wheat expenses
- Bardana expenses
- Other expenses
- Total expenses

---

## 12. Opening Data / Manual Book Migration

The mill currently has historical/manual records.

Instead of recreating every old transaction, the system provides **Opening Data**.

Opening records can be entered for:

### Product Stock

- Date
- Product
- Opening KG

### Bardana

- Date
- Opening number of bags

### Customer Balance

- Date
- Customer
- Due / Advance
- Amount

### Source Balance

- Date
- Source
- Payable / Advance
- Amount

Opening Data is mainly intended for initial migration from the mill's existing manual books.

---

# Current Navigation

The application navigation has intentionally been simplified to:

```text
Dashboard
Purchases
Production
Sales / Billing
Consumption
Accounts
Stock
Appendix
Expenses
Settings
```

### Purchases

Contains:

- Wheat Purchase
- Bardana Purchase

### Accounts

Contains:

- Customers
- Sources

### Settings

Contains:

- Products
- Opening Data

A separate Reports module was removed from the main navigation because the important records are already available in their relevant screens and key records are printable.

---

# Date Handling

Dates are displayed in:

```text
DD/MM/YYYY
```

Date fields support:

- Manual entry
- Calendar picker

Internally, dates are stored in a database-friendly format.

---

# Database

SQLite database location:

```text
backend/data/mill.db
```

The database is created automatically when the backend starts.

The application also performs small schema migrations automatically when new fields are introduced.

### Important

The real database is intentionally ignored by Git.

Before major changes or before importing real client data, make a backup copy of:

```text
backend/data/mill.db
```

---

# Installation

## Windows - Simple Method

From the project root:

1. Run:

```text
install.bat
```

2. After installation completes, run:

```text
start-dev.bat
```

This starts both backend and frontend.

---

## Manual Installation

Install both frontend and backend dependencies:

```bash
npm run install:all
```

Start backend:

```bash
npm run backend
```

Start frontend in another terminal:

```bash
npm run frontend
```

Build frontend:

```bash
npm run build
```

---

# Project Structure

```text
mill-management-mvp/
│
├── backend/
│   ├── data/
│   │   └── mill.db
│   └── src/
│       ├── db.js
│       └── server.js
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── api.js
│       ├── App.jsx
│       └── styles.css
│
├── install.bat
├── start-dev.bat
├── package.json
└── README.md
```

---

# Main Business Principles

This project intentionally avoids over-engineering.

The priorities are:

1. Solve the mill's actual daily problems.
2. Keep data entry simple.
3. Minimize unnecessary navigation.
4. Keep financial and stock records understandable.
5. Avoid duplicate data entry.
6. Keep automatic calculations limited to confirmed business rules.
7. Allow the admin to configure products without changing code.
8. Keep historical/manual data migration simple.
9. Keep the system usable on the mill's local computer.
10. Add new functionality only when the business actually requires it.

---

# Current Status

The main functional workflow is implemented:

```text
Purchases
→ Source Accounts
→ Stock
→ Production
→ Sales / Consumption
→ Customer Accounts
→ Appendix
→ Expenses
```

The application is now mainly in the **UI refinement, testing, and client-validation stage**.

---

# Confirmed Pending Item

The main business rule still awaiting confirmation is:

## Finished Product Packing / Bardana Consumption

The client still needs to define how finished product KG is converted into:

- 20 KG bags
- 40 KG bags

Once this rule is confirmed, it will be used for:

- Bardana Used
- Current Bardana
- Finished-product closing stock in bags
- Appendix Closing Bags
- Any required production-to-packing calculation

Until that rule is confirmed, the system intentionally keeps Production in KG.

---

# Final Testing Before Real Use

Before importing the mill's real manual-book records, the complete workflow should be tested:

```text
Purchase Wheat / Bardana
→ Check Source Balance
→ Record Production
→ Check Stock
→ Create Sale
→ Receive Customer Payment / Advance
→ Record Consumption
→ Check Appendix
→ Add Other Expense
→ Verify Customer / Source Ledgers
→ Verify Closing Stock
```

After successful testing, the current manual records can be entered through Opening Data and normal dated entries.

---

## Project Goal

This is not intended to be a large ERP.

It is a focused **Mill Management System** designed to make the mill's existing operational workflow simpler, more reliable, and easier to track.
