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
  is_active INTEGER NOT NULL DEFAULT 1,
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

CREATE TABLE IF NOT EXISTS production_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  production_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty_kg REAL NOT NULL,
  FOREIGN KEY(production_id) REFERENCES production(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id),
  UNIQUE(production_id, product_id)
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
CREATE INDEX IF NOT EXISTS idx_production_items_production ON production_items(production_id);
`);

// Small migration for databases created before product activation was added.
const productColumns = db.prepare('PRAGMA table_info(products)').all();
if (!productColumns.some((column) => column.name === 'is_active')) {
  db.exec('ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;');
}

const seedProduct = db.prepare('INSERT OR IGNORE INTO products (name, is_active) VALUES (?, 1)');
[
  'Wheat',
  'Govt Atta',
  'Atta',
  'Fine',
  'Fine Danedar',
  'Maida',
  'Suji',
  'Chokar',
].forEach((name) => seedProduct.run(name));

// "Flour" belonged to the first prototype. Keep historical records intact but hide it from new entries.
db.prepare("UPDATE products SET is_active=0 WHERE name='Flour'").run();

// Preserve old Flour/Suji production entries in the new flexible production_items table.
const insertLegacyProductionItem = db.prepare(`
  INSERT OR IGNORE INTO production_items (production_id, product_id, qty_kg)
  SELECT p.id, ?, ?
  FROM production p
  WHERE p.id=? AND ?>0
`);
const flour = db.prepare("SELECT id FROM products WHERE name='Flour'").get();
const suji = db.prepare("SELECT id FROM products WHERE name='Suji'").get();
for (const row of db.prepare('SELECT id, flour_produced, suji_produced FROM production').all()) {
  if (flour && Number(row.flour_produced) > 0) {
    insertLegacyProductionItem.run(flour.id, row.flour_produced, row.id, row.flour_produced);
  }
  if (suji && Number(row.suji_produced) > 0) {
    insertLegacyProductionItem.run(suji.id, row.suji_produced, row.id, row.suji_produced);
  }
}

export default db;
