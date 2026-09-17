import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'mill.db');
const db = new Database(dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wheat_in (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('Government','Private')),
  source_name TEXT NOT NULL,
  bags REAL NOT NULL DEFAULT 0,
  total_kg REAL NOT NULL,
  rate_per_kg REAL NOT NULL,
  total_cost REAL NOT NULL,
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  wheat_consumed REAL NOT NULL DEFAULT 0,
  flour_produced REAL NOT NULL DEFAULT 0,
  suji_produced REAL NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_no TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  customer_id INTEGER NOT NULL,
  total_amount REAL NOT NULL,
  received_amount REAL NOT NULL DEFAULT 0,
  pending_amount REAL NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  bag_size REAL NOT NULL DEFAULT 0,
  bags REAL NOT NULL DEFAULT 0,
  total_kg REAL NOT NULL,
  rate REAL NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  qty_kg REAL NOT NULL,
  movement_type TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id INTEGER,
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
`);

const seedProduct = db.prepare('INSERT OR IGNORE INTO products (name) VALUES (?)');
['Wheat', 'Flour', 'Suji'].forEach((name) => seedProduct.run(name));

export default db;
