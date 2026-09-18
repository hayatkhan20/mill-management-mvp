import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};
const asNumber = (value, field, { min = 0, allowZero = true } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || (!allowZero && n === 0)) throw new Error(`${field} is invalid`);
  return n;
};
const requiredText = (value, field) => {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
};

const getProduct = (name) => db.prepare('SELECT * FROM products WHERE name = ?').get(name);
const currentProductStock = (productId) => round2(
  db.prepare('SELECT COALESCE(SUM(qty_kg), 0) AS qty FROM stock_movements WHERE product_id = ?').get(productId).qty
);
const customerBalance = (customerId) => {
  const sale = db.prepare('SELECT COALESCE(SUM(pending_amount), 0) AS total FROM sales WHERE customer_id = ?').get(customerId).total;
  const payment = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE customer_id = ?').get(customerId).total;
  return round2(sale - payment);
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/products', (req, res) => {
  const includeInactive = String(req.query.all || '') === '1';
  const sql = includeInactive
    ? 'SELECT * FROM products ORDER BY CASE WHEN name="Wheat" THEN 0 ELSE 1 END, name COLLATE NOCASE'
    : 'SELECT * FROM products WHERE is_active=1 ORDER BY CASE WHEN name="Wheat" THEN 0 ELSE 1 END, name COLLATE NOCASE';
  res.json(db.prepare(sql).all());
});

app.post('/api/products', (req, res) => {
  try {
    const name = requiredText(req.body.name, 'Product name');
    if (name.toLowerCase() === 'wheat') throw new Error('Wheat is a system stock item and already exists');
    const existing = db.prepare('SELECT * FROM products WHERE LOWER(name)=LOWER(?)').get(name);
    if (existing) {
      if (!existing.is_active) {
        db.prepare('UPDATE products SET is_active=1 WHERE id=?').run(existing.id);
        return res.json(db.prepare('SELECT * FROM products WHERE id=?').get(existing.id));
      }
      throw new Error('Product already exists');
    }
    const result = db.prepare('INSERT INTO products (name,is_active) VALUES (?,1)').run(name);
    res.status(201).json(db.prepare('SELECT * FROM products WHERE id=?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/products/:id/toggle', (req, res) => {
  try {
    const id = asNumber(req.params.id, 'Product', { min: 1, allowZero: false });
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.name === 'Wheat') throw new Error('Wheat cannot be deactivated');
    db.prepare('UPDATE products SET is_active=? WHERE id=?').run(product.is_active ? 0 : 1, id);
    res.json(db.prepare('SELECT * FROM products WHERE id=?').get(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/dashboard', (_req, res) => {
  const date = today();
  const products = db.prepare(`
    SELECT p.id, p.name, ROUND(COALESCE(SUM(sm.qty_kg),0),2) AS stock_kg
    FROM products p
    LEFT JOIN stock_movements sm ON sm.product_id = p.id
    WHERE p.is_active=1
    GROUP BY p.id, p.name
    ORDER BY CASE WHEN p.name='Wheat' THEN 0 ELSE 1 END, p.name COLLATE NOCASE
  `).all();

  const wheatToday = db.prepare('SELECT COALESCE(SUM(total_kg),0) AS kg FROM wheat_in WHERE date = ?').get(date).kg;
  const salesToday = db.prepare('SELECT COALESCE(SUM(total_amount),0) AS amount FROM sales WHERE date = ?').get(date).amount;
  const receivedOnSales = db.prepare('SELECT COALESCE(SUM(received_amount),0) AS amount FROM sales WHERE date = ?').get(date).amount;
  const receivedPayments = db.prepare('SELECT COALESCE(SUM(amount),0) AS amount FROM payments WHERE date = ?').get(date).amount;
  const customerIds = db.prepare('SELECT id FROM customers').all();
  const pending = customerIds.reduce((sum, c) => sum + Math.max(0, customerBalance(c.id)), 0);
  const recentSales = db.prepare(`
    SELECT s.id, s.bill_no, s.date, s.total_amount, s.received_amount, s.pending_amount, c.name AS customer_name
    FROM sales s JOIN customers c ON c.id=s.customer_id
    ORDER BY s.id DESC LIMIT 8
  `).all();

  res.json({
    date,
    stocks: products,
    wheat_received_today: round2(wheatToday),
    sales_today: round2(salesToday),
    received_today: round2(receivedOnSales + receivedPayments),
    total_pending: round2(pending),
    active_products: products.filter((p) => p.name !== 'Wheat').length,
    recent_sales: recentSales,
  });
});

app.get('/api/customers', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
      ROUND(COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.customer_id=c.id),0),2) AS total_purchased,
      ROUND(COALESCE((SELECT SUM(s.received_amount) FROM sales s WHERE s.customer_id=c.id),0)
          + COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id=c.id),0),2) AS total_paid,
      ROUND(COALESCE((SELECT SUM(s.pending_amount) FROM sales s WHERE s.customer_id=c.id),0)
          - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id=c.id),0),2) AS balance
    FROM customers c
    ORDER BY c.name COLLATE NOCASE
  `).all();
  res.json(rows);
});

app.post('/api/customers', (req, res) => {
  try {
    const name = requiredText(req.body.name, 'Customer name');
    const result = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?,?,?)')
      .run(name, String(req.body.phone ?? '').trim(), String(req.body.address ?? '').trim());
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id=?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/customers/:id/update', (req, res) => {
  try {
    const id = asNumber(req.params.id, 'Customer', { min: 1, allowZero: false });
    const existing = db.prepare('SELECT id FROM customers WHERE id=?').get(id);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });
    const name = requiredText(req.body.name, 'Customer name');
    const phone = String(req.body.phone ?? '').trim();
    const address = String(req.body.address ?? '').trim();
    db.prepare('UPDATE customers SET name=?, phone=?, address=? WHERE id=?').run(name, phone, address, id);
    res.json(db.prepare('SELECT * FROM customers WHERE id=?').get(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/customers/:id', (req, res) => {
  const id = Number(req.params.id);
  const customer = db.prepare('SELECT * FROM customers WHERE id=?').get(id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const totals = db.prepare(`
    SELECT ROUND(COALESCE(SUM(total_amount),0),2) AS total_purchased,
           ROUND(COALESCE(SUM(received_amount),0),2) AS paid_on_bills
    FROM sales WHERE customer_id=?
  `).get(id);
  const laterPayments = db.prepare('SELECT ROUND(COALESCE(SUM(amount),0),2) AS total FROM payments WHERE customer_id=?').get(id).total;
  const quantities = db.prepare(`
    SELECT p.name AS product, ROUND(COALESCE(SUM(si.total_kg),0),2) AS kg
    FROM sale_items si
    JOIN sales s ON s.id=si.sale_id
    JOIN products p ON p.id=si.product_id
    WHERE s.customer_id=?
    GROUP BY p.id,p.name
  `).all(id);

  const events = db.prepare(`
    SELECT 'sale' AS type, s.id, s.date, s.created_at, s.bill_no AS reference,
           s.total_amount AS debit, s.received_amount AS credit,
           s.pending_amount AS pending_on_sale, s.remarks AS note
    FROM sales s WHERE s.customer_id=?
    UNION ALL
    SELECT 'payment' AS type, p.id, p.date, p.created_at, 'Payment' AS reference,
           0 AS debit, p.amount AS credit, 0 AS pending_on_sale, p.note AS note
    FROM payments p WHERE p.customer_id=?
    ORDER BY date ASC, created_at ASC, id ASC
  `).all(id, id);

  let running = 0;
  const ledger = events.map((e) => {
    if (e.type === 'sale') running += Number(e.pending_on_sale || 0);
    else running -= Number(e.credit || 0);
    return { ...e, balance: round2(running) };
  }).reverse();

  res.json({
    ...customer,
    total_purchased: round2(totals.total_purchased),
    total_paid: round2(totals.paid_on_bills + laterPayments),
    balance: customerBalance(id),
    quantities,
    ledger,
  });
});

app.post('/api/payments', (req, res) => {
  try {
    const customerId = asNumber(req.body.customer_id, 'Customer', { min: 1, allowZero: false });
    const customer = db.prepare('SELECT id FROM customers WHERE id=?').get(customerId);
    if (!customer) throw new Error('Customer not found');
    const amount = asNumber(req.body.amount, 'Amount', { min: 0, allowZero: false });
    const date = req.body.date || today();
    const result = db.prepare('INSERT INTO payments (customer_id,date,amount,note) VALUES (?,?,?,?)')
      .run(customerId, date, round2(amount), String(req.body.note ?? '').trim());
    res.status(201).json({ id: result.lastInsertRowid, balance: customerBalance(customerId) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/wheat-in', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json(db.prepare('SELECT * FROM wheat_in ORDER BY date DESC, id DESC LIMIT ?').all(limit));
});

app.post('/api/wheat-in', (req, res) => {
  try {
    const date = req.body.date || today();
    const sourceType = requiredText(req.body.source_type, 'Source type');
    if (!['Government', 'Private'].includes(sourceType)) throw new Error('Source type must be Government or Private');
    const sourceName = requiredText(req.body.source_name, 'Source / supplier');
    const bags = asNumber(req.body.bags ?? 0, 'Bags');
    const totalKg = asNumber(req.body.total_kg, 'Total KG', { min: 0, allowZero: false });
    const rate = asNumber(req.body.rate_per_kg, 'Rate per KG');
    const totalCost = round2(totalKg * rate);
    const wheat = getProduct('Wheat');

    const tx = db.transaction(() => {
      const r = db.prepare(`INSERT INTO wheat_in (date,source_type,source_name,bags,total_kg,rate_per_kg,total_cost,remarks)
        VALUES (?,?,?,?,?,?,?,?)`).run(date, sourceType, sourceName, bags, totalKg, rate, totalCost, String(req.body.remarks ?? '').trim());
      db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks)
        VALUES (?,?,?,?,?,?,?)`).run(date, wheat.id, totalKg, 'IN', 'wheat_in', r.lastInsertRowid, `Wheat received from ${sourceName}`);
      return r.lastInsertRowid;
    });
    const id = tx();
    res.status(201).json(db.prepare('SELECT * FROM wheat_in WHERE id=?').get(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/production', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = db.prepare('SELECT id,date,wheat_consumed,remarks,created_at FROM production ORDER BY date DESC, id DESC LIMIT ?').all(limit);
  const getItems = db.prepare(`
    SELECT pi.id, pi.product_id, p.name AS product_name, pi.qty_kg
    FROM production_items pi JOIN products p ON p.id=pi.product_id
    WHERE pi.production_id=? ORDER BY p.name COLLATE NOCASE
  `);
  res.json(rows.map((row) => ({ ...row, items: getItems.all(row.id) })));
});

app.post('/api/production', (req, res) => {
  try {
    const date = req.body.date || today();
    const wheatConsumed = asNumber(req.body.wheat_consumed ?? 0, 'Wheat consumed');
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    const normalizedItems = rawItems
      .map((item, index) => {
        const productId = asNumber(item.product_id, `Product ${index + 1}`, { min: 1, allowZero: false });
        const qtyKg = asNumber(item.qty_kg ?? 0, `Product ${index + 1} KG`);
        if (qtyKg === 0) return null;
        const product = db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(productId);
        if (!product || product.name === 'Wheat') throw new Error(`Product ${index + 1} is invalid`);
        return { product, productId, qtyKg: round2(qtyKg) };
      })
      .filter(Boolean);

    if (wheatConsumed === 0 && normalizedItems.length === 0) throw new Error('Enter wheat consumed or at least one produced product');
    const seen = new Set();
    for (const item of normalizedItems) {
      if (seen.has(item.productId)) throw new Error(`${item.product.name} is entered more than once`);
      seen.add(item.productId);
    }

    const wheat = getProduct('Wheat');
    if (wheatConsumed > currentProductStock(wheat.id) + 0.001) throw new Error('Wheat consumed cannot exceed current wheat stock');
    const remarks = String(req.body.remarks ?? '').trim();

    const tx = db.transaction(() => {
      const r = db.prepare(`INSERT INTO production (date,wheat_consumed,flour_produced,suji_produced,remarks)
        VALUES (?,?,0,0,?)`).run(date, wheatConsumed, remarks);
      const productionId = r.lastInsertRowid;
      const insertItem = db.prepare('INSERT INTO production_items (production_id,product_id,qty_kg) VALUES (?,?,?)');
      const insertMovement = db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks)
        VALUES (?,?,?,?,?,?,?)`);
      if (wheatConsumed) insertMovement.run(date, wheat.id, -wheatConsumed, 'OUT', 'production', productionId, 'Wheat used / ground');
      for (const item of normalizedItems) {
        insertItem.run(productionId, item.productId, item.qtyKg);
        insertMovement.run(date, item.productId, item.qtyKg, 'IN', 'production', productionId, `${item.product.name} produced`);
      }
      return productionId;
    });

    const id = tx();
    res.status(201).json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const nextBillNo = () => {
  const row = db.prepare('SELECT id FROM sales ORDER BY id DESC LIMIT 1').get();
  return `B-${String((row?.id || 0) + 1).padStart(5, '0')}`;
};

app.get('/api/sales/next-bill', (_req, res) => res.json({ bill_no: nextBillNo() }));

app.get('/api/sales', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json(db.prepare(`
    SELECT s.*, c.name AS customer_name
    FROM sales s JOIN customers c ON c.id=s.customer_id
    ORDER BY s.date DESC, s.id DESC LIMIT ?
  `).all(limit));
});

app.get('/api/sales/:id', (req, res) => {
  const sale = db.prepare(`SELECT s.*, c.name AS customer_name, c.phone, c.address
    FROM sales s JOIN customers c ON c.id=s.customer_id WHERE s.id=?`).get(Number(req.params.id));
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  const items = db.prepare(`SELECT si.*, p.name AS product_name FROM sale_items si JOIN products p ON p.id=si.product_id WHERE si.sale_id=?`).all(sale.id);
  res.json({ ...sale, items });
});

app.post('/api/sales', (req, res) => {
  try {
    const date = req.body.date || today();
    const customerId = asNumber(req.body.customer_id, 'Customer', { min: 1, allowZero: false });
    const customer = db.prepare('SELECT * FROM customers WHERE id=?').get(customerId);
    if (!customer) throw new Error('Customer not found');
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) throw new Error('Add at least one sale item');

    const normalizedItems = req.body.items.map((item, index) => {
      const productId = asNumber(item.product_id, `Item ${index + 1} product`, { min: 1, allowZero: false });
      const product = db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(productId);
      if (!product || product.name === 'Wheat') throw new Error(`Item ${index + 1}: select an active finished product`);
      const bagSize = asNumber(item.bag_size, `Item ${index + 1} bag size`, { min: 20, allowZero: false });
      if (![20, 40].includes(bagSize)) throw new Error(`Item ${index + 1}: bag size must be 20 KG or 40 KG`);
      const bags = asNumber(item.bags, `Item ${index + 1} bags`, { min: 1, allowZero: false });
      if (!Number.isInteger(bags)) throw new Error(`Item ${index + 1}: number of bags must be a whole number`);
      const totalKg = round2(bagSize * bags);
      const rate = round2(asNumber(item.rate, `Item ${index + 1} rate per bag`, { min: 0, allowZero: false }));
      const amount = round2(bags * rate);
      return { product, productId, bagSize, bags, totalKg, rate, amount };
    });

    const requestedByProduct = new Map();
    for (const item of normalizedItems) requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) || 0) + item.totalKg);
    for (const [productId, qty] of requestedByProduct) {
      const stock = currentProductStock(productId);
      if (qty > stock + 0.001) {
        const product = db.prepare('SELECT name FROM products WHERE id=?').get(productId);
        throw new Error(`${product.name} sale (${qty} KG) exceeds current stock (${stock} KG)`);
      }
    }

    const totalAmount = round2(normalizedItems.reduce((sum, x) => sum + x.amount, 0));
    const received = round2(asNumber(req.body.received_amount ?? 0, 'Amount received'));
    if (received > totalAmount + 0.001) throw new Error('Amount received on this bill cannot exceed the bill total. Record extra money as customer advance payment.');
    const pending = round2(totalAmount - received);
    const billNo = String(req.body.bill_no || nextBillNo()).trim();
    const remarks = String(req.body.remarks ?? '').trim();

    const tx = db.transaction(() => {
      const r = db.prepare(`INSERT INTO sales (bill_no,date,customer_id,total_amount,received_amount,pending_amount,remarks)
        VALUES (?,?,?,?,?,?,?)`).run(billNo, date, customerId, totalAmount, received, pending, remarks);
      const saleId = r.lastInsertRowid;
      const insertItem = db.prepare(`INSERT INTO sale_items (sale_id,product_id,bag_size,bags,total_kg,rate,amount) VALUES (?,?,?,?,?,?,?)`);
      const insertMovement = db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks)
        VALUES (?,?,?,?,?,?,?)`);
      for (const item of normalizedItems) {
        insertItem.run(saleId, item.productId, item.bagSize, item.bags, item.totalKg, item.rate, item.amount);
        insertMovement.run(date, item.productId, -item.totalKg, 'OUT', 'sale', saleId, `${item.product.name} sold on ${billNo}`);
      }
      return saleId;
    });

    const saleId = tx();
    res.status(201).json({
      id: saleId,
      bill_no: billNo,
      total_amount: totalAmount,
      received_amount: received,
      pending_amount: pending,
      customer_balance: customerBalance(customerId),
    });
  } catch (e) {
    const status = String(e.message).includes('UNIQUE') ? 409 : 400;
    res.status(status).json({ error: e.message });
  }
});

app.get('/api/stock/current', (_req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, ROUND(COALESCE(SUM(sm.qty_kg),0),2) AS stock_kg
    FROM products p LEFT JOIN stock_movements sm ON sm.product_id=p.id
    WHERE p.is_active=1
    GROUP BY p.id,p.name ORDER BY CASE WHEN p.name='Wheat' THEN 0 ELSE 1 END, p.name COLLATE NOCASE
  `).all();
  res.json(rows);
});

app.get('/api/stock/daily', (req, res) => {
  const date = req.query.date || today();
  const rows = db.prepare(`
    SELECT p.id,p.name,
      ROUND(COALESCE(SUM(CASE WHEN sm.date < ? THEN sm.qty_kg ELSE 0 END),0),2) AS opening,
      ROUND(COALESCE(SUM(CASE WHEN sm.date = ? AND sm.qty_kg > 0 THEN sm.qty_kg ELSE 0 END),0),2) AS in_qty,
      ROUND(ABS(COALESCE(SUM(CASE WHEN sm.date = ? AND sm.qty_kg < 0 THEN sm.qty_kg ELSE 0 END),0)),2) AS out_qty,
      ROUND(COALESCE(SUM(CASE WHEN sm.date <= ? THEN sm.qty_kg ELSE 0 END),0),2) AS closing
    FROM products p LEFT JOIN stock_movements sm ON sm.product_id=p.id
    WHERE p.is_active=1
    GROUP BY p.id,p.name ORDER BY CASE WHEN p.name='Wheat' THEN 0 ELSE 1 END, p.name COLLATE NOCASE
  `).all(date, date, date, date);
  res.json({ date, rows });
});

app.get('/api/stock/monthly', (req, res) => {
  const month = String(req.query.month || today().slice(0,7));
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Month must be YYYY-MM' });
  const start = `${month}-01`;
  const [year, m] = month.split('-').map(Number);
  const endDate = new Date(Date.UTC(year, m, 0)).toISOString().slice(0,10);
  const rows = db.prepare(`
    SELECT p.id,p.name,
      ROUND(COALESCE(SUM(CASE WHEN sm.date < ? THEN sm.qty_kg ELSE 0 END),0),2) AS opening,
      ROUND(COALESCE(SUM(CASE WHEN sm.date >= ? AND sm.date <= ? AND sm.qty_kg > 0 THEN sm.qty_kg ELSE 0 END),0),2) AS in_qty,
      ROUND(ABS(COALESCE(SUM(CASE WHEN sm.date >= ? AND sm.date <= ? AND sm.qty_kg < 0 THEN sm.qty_kg ELSE 0 END),0)),2) AS out_qty,
      ROUND(COALESCE(SUM(CASE WHEN sm.date <= ? THEN sm.qty_kg ELSE 0 END),0),2) AS closing
    FROM products p LEFT JOIN stock_movements sm ON sm.product_id=p.id
    WHERE p.is_active=1
    GROUP BY p.id,p.name ORDER BY CASE WHEN p.name='Wheat' THEN 0 ELSE 1 END, p.name COLLATE NOCASE
  `).all(start, start, endDate, start, endDate, endDate);
  res.json({ month, start, end: endDate, rows });
});

app.get('/api/reports/outstanding', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.id,c.name,c.phone,
      ROUND(COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.customer_id=c.id),0),2) AS total_purchased,
      ROUND(COALESCE((SELECT SUM(s.received_amount) FROM sales s WHERE s.customer_id=c.id),0)
          + COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id=c.id),0),2) AS total_paid,
      ROUND(COALESCE((SELECT SUM(s.pending_amount) FROM sales s WHERE s.customer_id=c.id),0)
          - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id=c.id),0),2) AS balance
    FROM customers c
    WHERE (COALESCE((SELECT SUM(s.pending_amount) FROM sales s WHERE s.customer_id=c.id),0)
          - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id=c.id),0)) > 0.005
    ORDER BY balance DESC
  `).all();
  res.json(rows);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`Mill Management API running at http://localhost:${PORT}`);
});
