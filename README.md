# Mill Management MVP

Lean mill-record application built around the client's actual workflow:

**Wheat IN -> Manual Production Record -> Flour/Suji Stock -> Sales OUT -> Customer Balance -> Reports**

## Stack
- React + Vite
- Node.js + Express
- SQLite using `better-sqlite3`

> Node.js 20+ is supported. The project was adjusted to work with Node.js 20.x.

## Business rules implemented

### Wheat In
- Source can be Government or Private.
- Records bags and total KG.
- Total cost is calculated from `Total KG x Rate/KG`.
- Saving adds wheat KG to stock.

### Production
- No automatic conversion rule.
- User manually enters Wheat Consumed, Flour Produced and Suji Produced.
- Saving deducts wheat and adds actual finished-product quantities.

### Sales
- A customer may buy again even when an old balance is pending.
- New bill pending = Bill Total - Amount Received on this bill.
- The unpaid amount is added to the customer's overall running balance.
- Finished-product stock is reduced when a bill is saved.
- Sale is blocked only if product stock is insufficient.

### Customer payments
- Old balances can be paid later using Receive Payment.
- Payment reduces the overall customer balance without creating another sale.

### Stock
- `Closing = Opening + IN - OUT`.
- Daily and monthly stock are derived from stock movements, not duplicated into separate stock tables.

## Development setup

### 1. Install dependencies
From project root:

```bash
npm run install:all
```

### 2. Start backend

```bash
npm run backend
```

API: `http://localhost:4000`

### 3. Start frontend
In another terminal:

```bash
npm run frontend
```

Frontend: `http://localhost:5173`

## Database
The SQLite database is created automatically at:

```text
backend/data/mill.db
```

The first run automatically creates the tables and products:
- Wheat
- Flour
- Suji

## Current screens
- Dashboard
- Wheat In
- Production Record
- Sales / Billing
- Customers + Ledger + Receive Payment
- Daily / Monthly Stock
- Reports (Outstanding Customers)

This is intentionally an MVP. Extra ERP/accounting features have not been added.
