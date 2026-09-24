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
  const opening = db.prepare('SELECT COALESCE(opening_balance,0) AS amount FROM customers WHERE id=?').get(customerId)?.amount || 0;
  const sale = db.prepare('SELECT COALESCE(SUM(pending_amount), 0) AS total FROM sales WHERE customer_id = ?').get(customerId).total;
  const payment = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE customer_id = ?').get(customerId).total;
  return round2(Number(opening) + Number(sale) - Number(payment));
};

const sourceBalance = (sourceId) => {
  const opening = db.prepare('SELECT COALESCE(opening_balance,0) AS amount FROM sources WHERE id=?').get(sourceId)?.amount || 0;
  const wheat = db.prepare(`
    SELECT COALESCE(SUM(total_cost + COALESCE(bardana_cost,0)),0) AS total
    FROM wheat_in WHERE source_id=?
  `).get(sourceId).total;
  const bardana = db.prepare('SELECT COALESCE(SUM(total_cost),0) AS total FROM bardana_purchases WHERE source_id=?').get(sourceId).total;
  const payment = db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM source_payments WHERE source_id=?').get(sourceId).total;
  return round2(Number(opening) + Number(wheat) + Number(bardana) - Number(payment));
};

const bardanaStock = () => {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN qty_bags>0 THEN qty_bags ELSE 0 END),0) AS total_received,
      ABS(COALESCE(SUM(CASE WHEN qty_bags<0 THEN qty_bags ELSE 0 END),0)) AS used,
      COALESCE(SUM(qty_bags),0) AS current
    FROM bardana_movements
  `).get();
  return {
    total_received: round2(row.total_received),
    used: round2(row.used),
    current: round2(row.current),
  };
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/products', (req, res) => {
  const includeInactive = String(req.query.all || '') === '1';
  const sql = includeInactive
    ? `SELECT * FROM products ORDER BY CASE WHEN name='Wheat' THEN 0 ELSE 1 END, name COLLATE NOCASE`
    : `SELECT * FROM products WHERE is_active=1 ORDER BY CASE WHEN name='Wheat' THEN 0 ELSE 1 END, name COLLATE NOCASE`;
  res.json(db.prepare(sql).all());
});

app.post('/api/products', (req, res) => {
  try {
    const name = requiredText(req.body.name, 'Product name');
    if (['wheat','bardana'].includes(name.toLowerCase())) throw new Error(`${name} is a system stock item and already exists`);
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

app.post('/api/products/:id/update', (req, res) => {
  try {
    const id = asNumber(req.params.id, 'Product', { min: 1, allowZero: false });
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (['Wheat','Bardana'].includes(product.name)) throw new Error(`${product.name} cannot be renamed`);

    const name = requiredText(req.body.name, 'Product name');
    if (['wheat','bardana'].includes(name.toLowerCase())) throw new Error(`${name} is reserved for a system stock item`);

    const duplicate = db.prepare('SELECT id FROM products WHERE LOWER(name)=LOWER(?) AND id<>?').get(name, id);
    if (duplicate) throw new Error('Another product with this name already exists');

    db.prepare('UPDATE products SET name=? WHERE id=?').run(name, id);
    res.json(db.prepare('SELECT * FROM products WHERE id=?').get(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/products/:id/delete', (req, res) => {
  try {
    const id = asNumber(req.params.id, 'Product', { min: 1, allowZero: false });
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (['Wheat','Bardana'].includes(product.name)) throw new Error(`${product.name} cannot be deleted`);

    const usage = {
      stock: db.prepare('SELECT COUNT(*) AS n FROM stock_movements WHERE product_id=?').get(id).n,
      production: db.prepare('SELECT COUNT(*) AS n FROM production_items WHERE product_id=?').get(id).n,
      sales: db.prepare('SELECT COUNT(*) AS n FROM sale_items WHERE product_id=?').get(id).n,
      consumption: db.prepare('SELECT COUNT(*) AS n FROM product_consumption WHERE product_id=?').get(id).n,
    };
    const totalUsage = Object.values(usage).reduce((sum, n) => sum + Number(n || 0), 0);
    if (totalUsage > 0) {
      throw new Error('This product already has historical records. Deactivate it instead of deleting it.');
    }

    db.prepare('DELETE FROM products WHERE id=?').run(id);
    res.json({ id, deleted: true, name: product.name });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/products/:id/toggle', (req, res) => {
  try {
    const id = asNumber(req.params.id, 'Product', { min: 1, allowZero: false });
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (['Wheat','Bardana'].includes(product.name)) throw new Error(`${product.name} cannot be deactivated`);
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
    WHERE p.is_active=1 AND p.name<>'Bardana'
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
    active_products: products.filter((p) => !['Wheat','Bardana'].includes(p.name)).length,
    bardana_stock_current: bardanaStock().current,
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
  `).all().map((row) => ({ ...row, balance: customerBalance(row.id) }));
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
    SELECT p.name AS product,
           ROUND(COALESCE(SUM(CASE WHEN p.name='Bardana' THEN si.bags ELSE si.total_kg END),0),2) AS quantity,
           CASE WHEN p.name='Bardana' THEN 'Bags' ELSE 'KG' END AS unit
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

  if (Number(customer.opening_balance || 0) !== 0) {
    const opening = Number(customer.opening_balance);
    events.unshift({
      type: 'opening', id: 0, date: customer.opening_date || '', created_at: '', reference: 'Opening Balance',
      debit: opening > 0 ? opening : 0, credit: opening < 0 ? Math.abs(opening) : 0,
      pending_on_sale: 0, note: 'Opening balance from manual records',
    });
  }

  let running = 0;
  const ledger = events.map((e) => {
    if (e.type === 'sale') running += Number(e.pending_on_sale || 0);
    else if (e.type === 'opening') running += Number(e.debit || 0) - Number(e.credit || 0);
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

app.post('/api/payments/:id/update', (req,res)=>{
  try{
    const id=asNumber(req.params.id,'Payment',{min:1,allowZero:false});
    const existing=db.prepare('SELECT * FROM payments WHERE id=?').get(id);
    if(!existing) return res.status(404).json({error:'Customer payment not found'});
    const amount=round2(asNumber(req.body.amount,'Amount',{min:0,allowZero:false}));
    const date=req.body.date||existing.date;
    const note=String(req.body.note??'').trim();
    db.prepare('UPDATE payments SET date=?,amount=?,note=? WHERE id=?').run(date,amount,note,id);
    res.json({id,balance:customerBalance(existing.customer_id)});
  }catch(e){res.status(400).json({error:e.message})}
});

app.get('/api/sources', (_req, res) => {
  const rows = db.prepare(`
    SELECT s.*,
      ROUND(COALESCE((SELECT SUM(w.total_cost + COALESCE(w.bardana_cost,0)) FROM wheat_in w WHERE w.source_id=s.id),0)
        + COALESCE((SELECT SUM(b.total_cost) FROM bardana_purchases b WHERE b.source_id=s.id),0),2) AS total_purchased,
      ROUND(COALESCE((SELECT SUM(sp.amount) FROM source_payments sp WHERE sp.source_id=s.id),0),2) AS total_paid
    FROM sources s
    ORDER BY s.name COLLATE NOCASE
  `).all().map((row) => ({ ...row, balance: sourceBalance(row.id) }));
  res.json(rows);
});

app.post('/api/sources', (req, res) => {
  try {
    const name = requiredText(req.body.name, 'Source name');
    const sourceType = requiredText(req.body.source_type, 'Source type');
    if (!['Government', 'Private'].includes(sourceType)) throw new Error('Source type must be Government or Private');
    const existing = db.prepare('SELECT id FROM sources WHERE LOWER(name)=LOWER(?) AND source_type=?').get(name, sourceType);
    if (existing) throw new Error('Source already exists');
    const result = db.prepare('INSERT INTO sources (name,source_type,phone,address) VALUES (?,?,?,?)')
      .run(name, sourceType, String(req.body.phone ?? '').trim(), String(req.body.address ?? '').trim());
    res.status(201).json(db.prepare('SELECT * FROM sources WHERE id=?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/sources/:id/update', (req, res) => {
  try {
    const id = asNumber(req.params.id, 'Source', { min: 1, allowZero: false });
    const existing = db.prepare('SELECT id FROM sources WHERE id=?').get(id);
    if (!existing) return res.status(404).json({ error: 'Source not found' });
    const name = requiredText(req.body.name, 'Source name');
    const sourceType = requiredText(req.body.source_type, 'Source type');
    if (!['Government', 'Private'].includes(sourceType)) throw new Error('Source type must be Government or Private');
    const duplicate = db.prepare('SELECT id FROM sources WHERE LOWER(name)=LOWER(?) AND source_type=? AND id<>?').get(name, sourceType, id);
    if (duplicate) throw new Error('Another source with this name and type already exists');
    db.prepare('UPDATE sources SET name=?,source_type=?,phone=?,address=? WHERE id=?')
      .run(name, sourceType, String(req.body.phone ?? '').trim(), String(req.body.address ?? '').trim(), id);
    // Keep the human-readable snapshot on wheat records aligned for reports.
    db.prepare('UPDATE wheat_in SET source_name=?,source_type=? WHERE source_id=?').run(name, sourceType, id);
    res.json(db.prepare('SELECT * FROM sources WHERE id=?').get(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/sources/:id', (req, res) => {
  const id = Number(req.params.id);
  const source = db.prepare('SELECT * FROM sources WHERE id=?').get(id);
  if (!source) return res.status(404).json({ error: 'Source not found' });

  const wheatTotal = db.prepare(`
    SELECT ROUND(COALESCE(SUM(total_cost + COALESCE(bardana_cost,0)),0),2) AS total,
           ROUND(COALESCE(SUM(total_kg),0),2) AS wheat_kg,
           ROUND(COALESCE(SUM(bags),0),2) AS bardana_with_wheat
    FROM wheat_in WHERE source_id=?
  `).get(id);
  const bardanaTotal = db.prepare(`
    SELECT ROUND(COALESCE(SUM(total_cost),0),2) AS total,
           ROUND(COALESCE(SUM(quantity),0),2) AS bags
    FROM bardana_purchases WHERE source_id=?
  `).get(id);
  const paid = db.prepare('SELECT ROUND(COALESCE(SUM(amount),0),2) AS total FROM source_payments WHERE source_id=?').get(id).total;

  const events = db.prepare(`
    SELECT 'wheat' AS type, w.id, w.date, w.created_at, 'Wheat Purchase #' || w.id AS reference,
           (w.total_cost + COALESCE(w.bardana_cost,0)) AS debit, 0 AS credit,
           w.remarks AS note, NULL AS payment_reference_type
    FROM wheat_in w WHERE w.source_id=?
    UNION ALL
    SELECT 'bardana' AS type, b.id, b.date, b.created_at, 'Bardana Purchase #' || b.id AS reference,
           b.total_cost AS debit, 0 AS credit, b.remarks AS note, NULL AS payment_reference_type
    FROM bardana_purchases b WHERE b.source_id=?
    UNION ALL
    SELECT 'payment' AS type, p.id, p.date, p.created_at, 'Payment' AS reference,
           0 AS debit, p.amount AS credit, p.note AS note, p.reference_type AS payment_reference_type
    FROM source_payments p WHERE p.source_id=?
    ORDER BY date ASC, created_at ASC, type ASC, id ASC
  `).all(id, id, id);

  if (Number(source.opening_balance || 0) !== 0) {
    const opening = Number(source.opening_balance);
    events.unshift({
      type: 'opening', id: 0, date: source.opening_date || '', created_at: '', reference: 'Opening Balance',
      debit: opening > 0 ? opening : 0, credit: opening < 0 ? Math.abs(opening) : 0,
      note: 'Opening balance from manual records',
    });
  }

  let running = 0;
  const ledger = events.map((event) => {
    running += Number(event.debit || 0) - Number(event.credit || 0);
    return { ...event, balance: round2(running) };
  }).reverse();

  res.json({
    ...source,
    total_purchased: round2(Number(wheatTotal.total) + Number(bardanaTotal.total)),
    total_paid: round2(paid),
    balance: sourceBalance(id),
    wheat_kg: round2(wheatTotal.wheat_kg),
    bardana_bags: round2(Number(wheatTotal.bardana_with_wheat) + Number(bardanaTotal.bags)),
    ledger,
  });
});

app.post('/api/source-payments', (req, res) => {
  try {
    const sourceId = asNumber(req.body.source_id, 'Source', { min: 1, allowZero: false });
    const source = db.prepare('SELECT id FROM sources WHERE id=?').get(sourceId);
    if (!source) throw new Error('Source not found');
    const amount = asNumber(req.body.amount, 'Amount', { min: 0, allowZero: false });
    const date = req.body.date || today();
    const result = db.prepare('INSERT INTO source_payments (source_id,date,amount,note) VALUES (?,?,?,?)')
      .run(sourceId, date, round2(amount), String(req.body.note ?? '').trim());
    res.status(201).json({ id: result.lastInsertRowid, balance: sourceBalance(sourceId) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/source-payments/:id/update', (req,res)=>{
  try{
    const id=asNumber(req.params.id,'Payment',{min:1,allowZero:false});
    const existing=db.prepare('SELECT * FROM source_payments WHERE id=?').get(id);
    if(!existing) return res.status(404).json({error:'Source payment not found'});
    if(existing.reference_type) throw new Error('Purchase-linked payment must be edited from the purchase record');
    const amount=round2(asNumber(req.body.amount,'Amount',{min:0,allowZero:false}));
    const date=req.body.date||existing.date;
    const note=String(req.body.note??'').trim();
    db.prepare('UPDATE source_payments SET date=?,amount=?,note=? WHERE id=?').run(date,amount,note,id);
    res.json({id,balance:sourceBalance(existing.source_id)});
  }catch(e){res.status(400).json({error:e.message})}
});

app.get('/api/wheat-in', (req, res) => {
  const date = String(req.query.date || '').trim();
  const baseSql = `
    SELECT w.*, COALESCE(s.name,w.source_name) AS source_name,
           COALESCE(s.source_type,w.source_type) AS source_type,
           ROUND(w.total_cost + COALESCE(w.bardana_cost,0),2) AS purchase_total
    FROM wheat_in w
    LEFT JOIN sources s ON s.id=w.source_id
  `;
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
    return res.json(db.prepare(`${baseSql} WHERE w.date=? ORDER BY w.id DESC`).all(date));
  }
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json(db.prepare(`${baseSql} ORDER BY w.date DESC, w.id DESC LIMIT ?`).all(limit));
});

app.post('/api/wheat-in', (req, res) => {
  try {
    const date = req.body.date || today();
    const sourceId = asNumber(req.body.source_id, 'Source', { min: 1, allowZero: false });
    const source = db.prepare('SELECT * FROM sources WHERE id=?').get(sourceId);
    if (!source) throw new Error('Source not found');
    const bags = asNumber(req.body.bags ?? 0, 'Bags');
    if (!Number.isInteger(bags)) throw new Error('Number of bags must be a whole number');
    const totalKg = asNumber(req.body.total_kg, 'Total KG', { min: 0, allowZero: false });
    const rate = asNumber(req.body.rate_per_kg, 'Wheat rate per KG');
    const bardanaRate = asNumber(req.body.bardana_rate_per_bag ?? 0, 'Bardana rate per bag');
    const totalCost = round2(totalKg * rate);
    const bardanaCost = round2(bags * bardanaRate);
    const purchaseTotal = round2(totalCost + bardanaCost);
    const paidAmount = round2(asNumber(req.body.paid_amount ?? 0, 'Amount paid'));
    if (paidAmount > purchaseTotal + 0.001) throw new Error('Amount paid cannot exceed purchase total. Record extra as source advance payment.');
    const wheat = getProduct('Wheat');
    const remarks = String(req.body.remarks ?? '').trim();

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO wheat_in
          (date,source_id,source_type,source_name,bags,total_kg,rate_per_kg,total_cost,bardana_rate_per_bag,bardana_cost,paid_amount,remarks)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(date, sourceId, source.source_type, source.name, bags, totalKg, rate, totalCost, bardanaRate, bardanaCost, paidAmount, remarks);
      const id = result.lastInsertRowid;
      db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks)
        VALUES (?,?,?,?,?,?,?)`).run(date, wheat.id, totalKg, 'IN', 'wheat_in', id, `Wheat received from ${source.name}`);
      if (bags > 0) {
        db.prepare(`INSERT INTO bardana_movements (date,qty_bags,movement_type,reference_type,reference_id,remarks)
          VALUES (?,?,?,?,?,?)`).run(date, bags, 'IN', 'wheat_in', id, `Bardana received with wheat from ${source.name}`);
      }
      if (paidAmount > 0) {
        db.prepare(`INSERT INTO source_payments (source_id,date,amount,note,reference_type,reference_id)
          VALUES (?,?,?,?,?,?)`).run(sourceId,date,paidAmount,`Paid with Wheat Purchase #${id}`,'wheat_in',id);
      }
      return id;
    });
    const id = tx();
    res.status(201).json({ id, wheat_cost: totalCost, bardana_cost: bardanaCost, total_purchase: purchaseTotal, paid_amount: paidAmount, source_balance: sourceBalance(sourceId) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/wheat-in/:id/update', (req, res) => {
  try {
    const id = asNumber(req.params.id,'Purchase',{min:1,allowZero:false});
    const existing = db.prepare('SELECT * FROM wheat_in WHERE id=?').get(id);
    if (!existing) return res.status(404).json({error:'Wheat purchase not found'});
    const date=req.body.date||existing.date;
    const sourceId=asNumber(req.body.source_id,'Source',{min:1,allowZero:false});
    const source=db.prepare('SELECT * FROM sources WHERE id=?').get(sourceId);
    if(!source) throw new Error('Source not found');
    const bags=asNumber(req.body.bags??0,'Bags'); if(!Number.isInteger(bags)) throw new Error('Number of bags must be a whole number');
    const totalKg=asNumber(req.body.total_kg,'Total KG',{min:0,allowZero:false});
    const rate=asNumber(req.body.rate_per_kg,'Wheat rate per KG');
    const bardanaRate=asNumber(req.body.bardana_rate_per_bag??0,'Bardana rate per bag');
    const totalCost=round2(totalKg*rate), bardanaCost=round2(bags*bardanaRate), purchaseTotal=round2(totalCost+bardanaCost);
    const paidAmount=round2(asNumber(req.body.paid_amount??0,'Amount paid'));
    if(paidAmount>purchaseTotal+0.001) throw new Error('Amount paid cannot exceed purchase total.');
    const remarks=String(req.body.remarks??'').trim();
    const wheat=getProduct('Wheat');

    db.transaction(()=>{
      db.prepare("DELETE FROM source_payments WHERE reference_type='wheat_in' AND reference_id=?").run(id);
      db.prepare("DELETE FROM stock_movements WHERE reference_type='wheat_in' AND reference_id=?").run(id);
      db.prepare("DELETE FROM bardana_movements WHERE reference_type='wheat_in' AND reference_id=?").run(id);
      if(currentProductStock(wheat.id)+totalKg < -0.001) throw new Error('Cannot reduce this purchase below Wheat already used or sold later.');
      if(bardanaStock().current+bags < -0.001) throw new Error('Cannot reduce Bardana below bags already used or sold later.');
      db.prepare(`UPDATE wheat_in SET date=?,source_id=?,source_type=?,source_name=?,bags=?,total_kg=?,rate_per_kg=?,total_cost=?,bardana_rate_per_bag=?,bardana_cost=?,paid_amount=?,remarks=? WHERE id=?`)
        .run(date,sourceId,source.source_type,source.name,bags,totalKg,rate,totalCost,bardanaRate,bardanaCost,paidAmount,remarks,id);
      db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?,?)`)
        .run(date,wheat.id,totalKg,'IN','wheat_in',id,`Wheat received from ${source.name}`);
      if(bags>0) db.prepare(`INSERT INTO bardana_movements (date,qty_bags,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?)`)
        .run(date,bags,'IN','wheat_in',id,`Bardana received with wheat from ${source.name}`);
      if(paidAmount>0) db.prepare(`INSERT INTO source_payments (source_id,date,amount,note,reference_type,reference_id) VALUES (?,?,?,?,?,?)`)
        .run(sourceId,date,paidAmount,`Paid with Wheat Purchase #${id}`,'wheat_in',id);
    })();
    res.json({id,total_purchase:purchaseTotal,paid_amount:paidAmount,source_balance:sourceBalance(sourceId)});
  } catch(e){ res.status(400).json({error:e.message}); }
});

app.get('/api/bardana-purchases', (req, res) => {
  const date = String(req.query.date || '').trim();
  const baseSql = `
    SELECT b.*, s.name AS source_name, s.source_type
    FROM bardana_purchases b JOIN sources s ON s.id=b.source_id
  `;
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
    return res.json(db.prepare(`${baseSql} WHERE b.date=? ORDER BY b.id DESC`).all(date));
  }
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json(db.prepare(`${baseSql} ORDER BY b.date DESC, b.id DESC LIMIT ?`).all(limit));
});

app.post('/api/bardana-purchases', (req, res) => {
  try {
    const date = req.body.date || today();
    const sourceId = asNumber(req.body.source_id, 'Source', { min: 1, allowZero: false });
    const source = db.prepare('SELECT * FROM sources WHERE id=?').get(sourceId);
    if (!source) throw new Error('Source not found');
    const quantity = asNumber(req.body.quantity, 'Bardana quantity', { min: 1, allowZero: false });
    if (!Number.isInteger(quantity)) throw new Error('Bardana quantity must be a whole number');
    const rate = asNumber(req.body.rate_per_bag ?? 0, 'Rate per bag');
    const totalCost = round2(quantity * rate);
    const paidAmount = round2(asNumber(req.body.paid_amount ?? 0, 'Amount paid'));
    if (paidAmount > totalCost + 0.001) throw new Error('Amount paid cannot exceed purchase total. Record extra as source advance payment.');
    const remarks = String(req.body.remarks ?? '').trim();

    const tx = db.transaction(() => {
      const result = db.prepare(`INSERT INTO bardana_purchases (date,source_id,quantity,rate_per_bag,total_cost,paid_amount,remarks)
        VALUES (?,?,?,?,?,?,?)`).run(date, sourceId, quantity, rate, totalCost, paidAmount, remarks);
      const id = result.lastInsertRowid;
      db.prepare(`INSERT INTO bardana_movements (date,qty_bags,movement_type,reference_type,reference_id,remarks)
        VALUES (?,?,?,?,?,?)`).run(date, quantity, 'IN', 'bardana_purchase', id, `Bardana purchased from ${source.name}`);
      if (paidAmount > 0) db.prepare(`INSERT INTO source_payments (source_id,date,amount,note,reference_type,reference_id)
        VALUES (?,?,?,?,?,?)`).run(sourceId,date,paidAmount,`Paid with Bardana Purchase #${id}`,'bardana_purchase',id);
      return id;
    });
    const id = tx();
    res.status(201).json({ id, total_cost: totalCost, paid_amount: paidAmount, source_balance: sourceBalance(sourceId) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/bardana-purchases/:id/update', (req,res)=>{
  try{
    const id=asNumber(req.params.id,'Purchase',{min:1,allowZero:false});
    const existing=db.prepare('SELECT * FROM bardana_purchases WHERE id=?').get(id);
    if(!existing) return res.status(404).json({error:'Bardana purchase not found'});
    const date=req.body.date||existing.date;
    const sourceId=asNumber(req.body.source_id,'Source',{min:1,allowZero:false});
    const source=db.prepare('SELECT * FROM sources WHERE id=?').get(sourceId);
    if(!source) throw new Error('Source not found');
    const quantity=asNumber(req.body.quantity,'Bardana quantity',{min:1,allowZero:false});
    if(!Number.isInteger(quantity)) throw new Error('Bardana quantity must be a whole number');
    const rate=asNumber(req.body.rate_per_bag??0,'Rate per bag');
    const totalCost=round2(quantity*rate);
    const paidAmount=round2(asNumber(req.body.paid_amount??0,'Amount paid'));
    if(paidAmount>totalCost+0.001) throw new Error('Amount paid cannot exceed purchase total.');
    const remarks=String(req.body.remarks??'').trim();

    db.transaction(()=>{
      db.prepare("DELETE FROM source_payments WHERE reference_type='bardana_purchase' AND reference_id=?").run(id);
      db.prepare("DELETE FROM bardana_movements WHERE reference_type='bardana_purchase' AND reference_id=?").run(id);
      if(bardanaStock().current+quantity < -0.001) throw new Error('Cannot reduce this purchase below Bardana already used or sold later.');
      db.prepare('UPDATE bardana_purchases SET date=?,source_id=?,quantity=?,rate_per_bag=?,total_cost=?,paid_amount=?,remarks=? WHERE id=?')
        .run(date,sourceId,quantity,rate,totalCost,paidAmount,remarks,id);
      db.prepare(`INSERT INTO bardana_movements (date,qty_bags,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?)`)
        .run(date,quantity,'IN','bardana_purchase',id,`Bardana purchased from ${source.name}`);
      if(paidAmount>0) db.prepare(`INSERT INTO source_payments (source_id,date,amount,note,reference_type,reference_id) VALUES (?,?,?,?,?,?)`)
        .run(sourceId,date,paidAmount,`Paid with Bardana Purchase #${id}`,'bardana_purchase',id);
    })();
    res.json({id,total_cost:totalCost,paid_amount:paidAmount,source_balance:sourceBalance(sourceId)});
  }catch(e){res.status(400).json({error:e.message})}
});

app.get('/api/bardana/stock', (_req, res) => {
  res.json(bardanaStock());
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

app.post('/api/production/:id/update', (req,res)=>{
  try{
    const id=asNumber(req.params.id,'Production',{min:1,allowZero:false});
    const existing=db.prepare('SELECT * FROM production WHERE id=?').get(id);
    if(!existing) return res.status(404).json({error:'Production record not found'});
    const date=req.body.date||existing.date;
    const wheatConsumed=asNumber(req.body.wheat_consumed??0,'Wheat consumed');
    const rawItems=Array.isArray(req.body.items)?req.body.items:[];
    const normalizedItems=rawItems.map((item,index)=>{
      const productId=asNumber(item.product_id,`Product ${index+1}`,{min:1,allowZero:false});
      const qtyKg=asNumber(item.qty_kg??0,`Product ${index+1} KG`);
      if(qtyKg===0) return null;
      const product=db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(productId);
      if(!product||['Wheat','Bardana'].includes(product.name)) throw new Error(`Product ${index+1} is invalid`);
      return {product,productId,qtyKg:round2(qtyKg)};
    }).filter(Boolean);
    if(wheatConsumed===0&&!normalizedItems.length) throw new Error('Enter wheat consumed or at least one produced product');
    const remarks=String(req.body.remarks??'').trim();
    const wheat=getProduct('Wheat');

    db.transaction(()=>{
      db.prepare("DELETE FROM stock_movements WHERE reference_type='production' AND reference_id=?").run(id);
      if(wheatConsumed>currentProductStock(wheat.id)+0.001) throw new Error('Wheat consumed cannot exceed current wheat stock');
      for(const item of normalizedItems){
        if(currentProductStock(item.productId)+item.qtyKg < -0.001) throw new Error(`Cannot reduce ${item.product.name} production below quantity already sold or consumed later.`);
      }
      const oldProductIds=db.prepare('SELECT product_id FROM production_items WHERE production_id=?').all(id).map(r=>r.product_id);
      for(const productId of oldProductIds){
        if(!normalizedItems.some(i=>i.productId===productId) && currentProductStock(productId) < -0.001){
          const p=db.prepare('SELECT name FROM products WHERE id=?').get(productId);
          throw new Error(`Cannot remove ${p.name} production because later records already use it.`);
        }
      }
      db.prepare('DELETE FROM production_items WHERE production_id=?').run(id);
      db.prepare('UPDATE production SET date=?,wheat_consumed=?,remarks=? WHERE id=?').run(date,wheatConsumed,remarks,id);
      const insertItem=db.prepare('INSERT INTO production_items (production_id,product_id,qty_kg) VALUES (?,?,?)');
      const insertMovement=db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?,?)`);
      if(wheatConsumed) insertMovement.run(date,wheat.id,-wheatConsumed,'OUT','production',id,'Wheat used / ground');
      for(const item of normalizedItems){
        insertItem.run(id,item.productId,item.qtyKg);
        insertMovement.run(date,item.productId,item.qtyKg,'IN','production',id,`${item.product.name} produced`);
      }
    })();
    res.json({id});
  }catch(e){res.status(400).json({error:e.message})}
});

const nextBillNo = () => {
  const row = db.prepare('SELECT id FROM sales ORDER BY id DESC LIMIT 1').get();
  return `B-${String((row?.id || 0) + 1).padStart(5, '0')}`;
};

app.get('/api/sales/next-bill', (_req, res) => res.json({ bill_no: nextBillNo() }));

app.get('/api/sales', (req, res) => {
  const date = String(req.query.date || '').trim();
  const baseSql = `
    SELECT s.*, c.name AS customer_name
    FROM sales s JOIN customers c ON c.id=s.customer_id
  `;
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
    return res.json(db.prepare(`${baseSql} WHERE s.date=? ORDER BY s.id DESC`).all(date));
  }
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json(db.prepare(`${baseSql} ORDER BY s.date DESC, s.id DESC LIMIT ?`).all(limit));
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

    const normalizedItems = req.body.items.map((item,index)=>{
      const productId=asNumber(item.product_id,`Item ${index+1} product`,{min:1,allowZero:false});
      const product=db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(productId);
      if(!product) throw new Error(`Item ${index+1}: select an active product`);

      if(product.name==='Bardana'){
        const bags=asNumber(item.bags,`Item ${index+1} Bardana bags`,{min:1,allowZero:false});
        if(!Number.isInteger(bags)) throw new Error(`Item ${index+1}: Bardana bags must be a whole number`);
        const rate=round2(asNumber(item.rate,`Item ${index+1} rate per bag`,{min:0,allowZero:false}));
        return {product,productId,mode:'bardana',bagSize:0,bags,totalKg:0,rate,amount:round2(bags*rate)};
      }

      const bagSize=round2(asNumber(item.bag_size,`Item ${index+1} KG per bag`,{min:0,allowZero:false}));
      const bags=asNumber(item.bags,`Item ${index+1} bags`,{min:1,allowZero:false});
      if(!Number.isInteger(bags)) throw new Error(`Item ${index+1}: number of bags must be a whole number`);
      const totalKg=round2(bagSize*bags);
      const rate=round2(asNumber(item.rate,`Item ${index+1} rate per bag`,{min:0,allowZero:false}));
      return {product,productId,mode:'bag',bagSize,bags,totalKg,rate,amount:round2(bags*rate)};
    });

    const requestedByProduct=new Map();
    let bardanaRequested=0;
    for(const item of normalizedItems){
      if(item.mode==='bardana') bardanaRequested+=item.bags;
      else requestedByProduct.set(item.productId,(requestedByProduct.get(item.productId)||0)+item.totalKg);
    }
    for(const [productId,qty] of requestedByProduct){
      const stock=currentProductStock(productId);
      if(qty>stock+0.001){
        const product=db.prepare('SELECT name FROM products WHERE id=?').get(productId);
        throw new Error(`${product.name} sale (${qty} KG) exceeds current stock (${stock} KG)`);
      }
    }
    if(bardanaRequested>bardanaStock().current+0.001) throw new Error(`Bardana sale (${bardanaRequested} Bags) exceeds current stock (${bardanaStock().current} Bags)`);

    const totalAmount=round2(normalizedItems.reduce((sum,x)=>sum+x.amount,0));
    const received=round2(asNumber(req.body.received_amount??0,'Amount received'));
    if(received>totalAmount+0.001) throw new Error('Amount received on this bill cannot exceed the bill total. Record extra money as customer advance payment.');
    const pending=round2(totalAmount-received);
    const billNo=String(req.body.bill_no||nextBillNo()).trim();
    const remarks=String(req.body.remarks??'').trim();

    const tx=db.transaction(()=>{
      const r=db.prepare(`INSERT INTO sales (bill_no,date,customer_id,total_amount,received_amount,pending_amount,remarks) VALUES (?,?,?,?,?,?,?)`)
        .run(billNo,date,customerId,totalAmount,received,pending,remarks);
      const saleId=r.lastInsertRowid;
      const insertItem=db.prepare(`INSERT INTO sale_items (sale_id,product_id,bag_size,bags,total_kg,rate,amount) VALUES (?,?,?,?,?,?,?)`);
      const insertStock=db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?,?)`);
      const insertBardana=db.prepare(`INSERT INTO bardana_movements (date,qty_bags,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?)`);
      for(const item of normalizedItems){
        insertItem.run(saleId,item.productId,item.bagSize,item.bags,item.totalKg,item.rate,item.amount);
        if(item.mode==='bardana') insertBardana.run(date,-item.bags,'OUT','sale_bardana',saleId,`Bardana sold on ${billNo}`);
        else insertStock.run(date,item.productId,-item.totalKg,'OUT','sale',saleId,`${item.product.name} sold on ${billNo}`);
      }
      return saleId;
    });

    const saleId=tx();
    res.status(201).json({id:saleId,bill_no:billNo,total_amount:totalAmount,received_amount:received,pending_amount:pending,customer_balance:customerBalance(customerId)});
  }catch(e){
    const status=String(e.message).includes('UNIQUE')?409:400;
    res.status(status).json({error:e.message});
  }
});

app.post('/api/sales/:id/update', (req,res)=>{
  try{
    const saleId=asNumber(req.params.id,'Sale',{min:1,allowZero:false});
    const existing=db.prepare('SELECT * FROM sales WHERE id=?').get(saleId);
    if(!existing) return res.status(404).json({error:'Sale not found'});

    const date=req.body.date||existing.date;
    const customerId=asNumber(req.body.customer_id,'Customer',{min:1,allowZero:false});
    if(!db.prepare('SELECT id FROM customers WHERE id=?').get(customerId)) throw new Error('Customer not found');
    if(!Array.isArray(req.body.items)||!req.body.items.length) throw new Error('Add at least one sale item');

    const normalizedItems=req.body.items.map((item,index)=>{
      const productId=asNumber(item.product_id,`Item ${index+1} product`,{min:1,allowZero:false});
      const product=db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(productId);
      if(!product) throw new Error(`Item ${index+1}: select an active product`);

      if(product.name==='Bardana'){
        const bags=asNumber(item.bags,`Item ${index+1} Bardana bags`,{min:1,allowZero:false});
        if(!Number.isInteger(bags)) throw new Error(`Item ${index+1}: Bardana bags must be a whole number`);
        const rate=round2(asNumber(item.rate,`Item ${index+1} rate per bag`,{min:0,allowZero:false}));
        return {product,productId,mode:'bardana',bagSize:0,bags,totalKg:0,rate,amount:round2(bags*rate)};
      }

      const bagSize=round2(asNumber(item.bag_size,`Item ${index+1} KG per bag`,{min:0,allowZero:false}));
      const bags=asNumber(item.bags,`Item ${index+1} bags`,{min:1,allowZero:false});
      if(!Number.isInteger(bags)) throw new Error(`Item ${index+1}: number of bags must be a whole number`);
      const totalKg=round2(bagSize*bags);
      const rate=round2(asNumber(item.rate,`Item ${index+1} rate per bag`,{min:0,allowZero:false}));
      return {product,productId,mode:'bag',bagSize,bags,totalKg,rate,amount:round2(bags*rate)};
    });

    const totalAmount=round2(normalizedItems.reduce((sum,item)=>sum+item.amount,0));
    const received=round2(asNumber(req.body.received_amount??0,'Amount received'));
    if(received>totalAmount+0.001) throw new Error('Amount received cannot exceed bill total.');
    const pending=round2(totalAmount-received);
    const remarks=String(req.body.remarks??'').trim();

    db.transaction(()=>{
      // Remove the old stock effects first so this sale's previous quantity is restored.
      db.prepare("DELETE FROM stock_movements WHERE reference_type='sale' AND reference_id=?").run(saleId);
      db.prepare("DELETE FROM bardana_movements WHERE reference_type='sale_bardana' AND reference_id=?").run(saleId);

      const requestedByProduct=new Map();
      let bardanaRequested=0;
      for(const item of normalizedItems){
        if(item.mode==='bardana') bardanaRequested+=item.bags;
        else requestedByProduct.set(item.productId,(requestedByProduct.get(item.productId)||0)+item.totalKg);
      }

      for(const [productId,qty] of requestedByProduct){
        const stock=currentProductStock(productId);
        if(qty>stock+0.001){
          const product=db.prepare('SELECT name FROM products WHERE id=?').get(productId);
          throw new Error(`${product.name} sale exceeds current stock`);
        }
      }

      const currentBardana=bardanaStock().current;
      if(bardanaRequested>currentBardana+0.001) throw new Error('Bardana sale exceeds current stock');

      db.prepare('DELETE FROM sale_items WHERE sale_id=?').run(saleId);
      db.prepare('UPDATE sales SET date=?,customer_id=?,total_amount=?,received_amount=?,pending_amount=?,remarks=? WHERE id=?')
        .run(date,customerId,totalAmount,received,pending,remarks,saleId);

      const insertItem=db.prepare(`INSERT INTO sale_items (sale_id,product_id,bag_size,bags,total_kg,rate,amount) VALUES (?,?,?,?,?,?,?)`);
      const insertStock=db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?,?)`);
      const insertBardana=db.prepare(`INSERT INTO bardana_movements (date,qty_bags,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?)`);

      for(const item of normalizedItems){
        insertItem.run(saleId,item.productId,item.bagSize,item.bags,item.totalKg,item.rate,item.amount);
        if(item.mode==='bardana'){
          insertBardana.run(date,-item.bags,'OUT','sale_bardana',saleId,`Bardana sold on ${existing.bill_no}`);
        }else{
          insertStock.run(date,item.productId,-item.totalKg,'OUT','sale',saleId,`${item.product.name} sold on ${existing.bill_no}`);
        }
      }
    })();

    res.json({
      id:saleId,
      bill_no:existing.bill_no,
      total_amount:totalAmount,
      received_amount:received,
      pending_amount:pending,
      customer_balance:customerBalance(customerId)
    });
  }catch(e){
    res.status(400).json({error:e.message});
  }
});

app.get('/api/consumption', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json(db.prepare(`
    SELECT pc.*, p.name AS product_name
    FROM product_consumption pc
    JOIN products p ON p.id=pc.product_id
    ORDER BY pc.date DESC, pc.id DESC
    LIMIT ?
  `).all(limit));
});

app.post('/api/consumption', (req, res) => {
  try {
    const date = req.body.date || today();
    const productId = asNumber(req.body.product_id, 'Product', { min: 1, allowZero: false });
    const product = db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(productId);
    if (!product || product.name === 'Wheat') throw new Error('Select a valid finished product');

    const qtyKg = round2(asNumber(req.body.qty_kg, 'Quantity KG', { min: 0, allowZero: false }));
    const reason = requiredText(req.body.reason, 'Reason');
    if (!['Home', 'Company / Mill Use', 'Donation', 'Other'].includes(reason)) throw new Error('Select a valid consumption reason');

    const stock = currentProductStock(productId);
    if (qtyKg > stock + 0.001) throw new Error(`${product.name} consumption (${qtyKg} KG) exceeds current stock (${stock} KG)`);

    const remarks = String(req.body.remarks ?? '').trim();

    const tx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO product_consumption (date,product_id,qty_kg,reason,remarks)
        VALUES (?,?,?,?,?)
      `).run(date, productId, qtyKg, reason, remarks);

      db.prepare(`
        INSERT INTO stock_movements
          (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks)
        VALUES (?,?,?,?,?,?,?)
      `).run(date, productId, -qtyKg, 'OUT', 'consumption', result.lastInsertRowid, `${reason}: ${remarks || 'Non-sale consumption'}`);

      return result.lastInsertRowid;
    });

    const id = tx();
    res.status(201).json({
      id,
      current_stock_kg: currentProductStock(productId),
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/consumption/:id/update', (req,res)=>{
  try{
    const id=asNumber(req.params.id,'Consumption',{min:1,allowZero:false});
    const existing=db.prepare('SELECT * FROM product_consumption WHERE id=?').get(id);
    if(!existing) return res.status(404).json({error:'Consumption record not found'});
    const date=req.body.date||existing.date;
    const productId=asNumber(req.body.product_id,'Product',{min:1,allowZero:false});
    const product=db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(productId);
    if(!product||['Wheat','Bardana'].includes(product.name)) throw new Error('Select a valid finished product');
    const qtyKg=round2(asNumber(req.body.qty_kg,'Quantity KG',{min:0,allowZero:false}));
    const reason=requiredText(req.body.reason,'Reason');
    if(!['Home','Company / Mill Use','Donation','Other'].includes(reason)) throw new Error('Select a valid consumption reason');
    const remarks=String(req.body.remarks??'').trim();
    db.transaction(()=>{
      db.prepare("DELETE FROM stock_movements WHERE reference_type='consumption' AND reference_id=?").run(id);
      const stock=currentProductStock(productId);
      if(qtyKg>stock+0.001) throw new Error(`${product.name} consumption exceeds current stock`);
      db.prepare('UPDATE product_consumption SET date=?,product_id=?,qty_kg=?,reason=?,remarks=? WHERE id=?').run(date,productId,qtyKg,reason,remarks,id);
      db.prepare(`INSERT INTO stock_movements (date,product_id,qty_kg,movement_type,reference_type,reference_id,remarks) VALUES (?,?,?,?,?,?,?)`)
        .run(date,productId,-qtyKg,'OUT','consumption',id,`${reason}: ${remarks||'Non-sale consumption'}`);
    })();
    res.json({id,current_stock_kg:currentProductStock(productId)});
  }catch(e){res.status(400).json({error:e.message})}
});

app.get('/api/stock/current', (_req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, ROUND(COALESCE(SUM(sm.qty_kg),0),2) AS stock_kg
    FROM products p LEFT JOIN stock_movements sm ON sm.product_id=p.id
    WHERE p.is_active=1 AND p.name<>'Bardana'
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
    WHERE p.is_active=1 AND p.name<>'Bardana'
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
    WHERE p.is_active=1 AND p.name<>'Bardana'
    GROUP BY p.id,p.name ORDER BY CASE WHEN p.name='Wheat' THEN 0 ELSE 1 END, p.name COLLATE NOCASE
  `).all(start, start, endDate, start, endDate, endDate);
  res.json({ month, start, end: endDate, rows });
});




app.get('/api/expenses', (req, res) => {
  const month = String(req.query.month || today().slice(0, 7));
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Month must be YYYY-MM' });
  const start = `${month}-01`;
  const [year, m] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10);

  const wheatRows = db.prepare(`
    SELECT id,date,source_name,total_cost AS amount,remarks AS note
    FROM wheat_in
    WHERE date>=? AND date<=?
    ORDER BY date DESC,id DESC
  `).all(start, end).map((row) => ({ ...row, type: 'Wheat Purchase', source: row.source_name }));

  const wheatBardanaRows = db.prepare(`
    SELECT id,date,source_name,bardana_cost AS amount,remarks AS note
    FROM wheat_in
    WHERE date>=? AND date<=? AND COALESCE(bardana_cost,0)>0
    ORDER BY date DESC,id DESC
  `).all(start, end).map((row) => ({ ...row, type: 'Bardana with Wheat', source: row.source_name }));

  const bardanaRows = db.prepare(`
    SELECT b.id,b.date,s.name AS source,b.total_cost AS amount,b.remarks AS note
    FROM bardana_purchases b
    JOIN sources s ON s.id=b.source_id
    WHERE b.date>=? AND b.date<=?
    ORDER BY b.date DESC,b.id DESC
  `).all(start, end).map((row) => ({ ...row, type: 'Bardana Purchase' }));

  const manual = db.prepare(`
    SELECT id,date,category,amount,note
    FROM other_expenses
    WHERE date>=? AND date<=?
    ORDER BY date DESC,id DESC
  `).all(start, end);

  const wheatTotal = round2(wheatRows.reduce((sum, row) => sum + Number(row.amount || 0), 0));
  const bardanaTotal = round2([...wheatBardanaRows, ...bardanaRows].reduce((sum, row) => sum + Number(row.amount || 0), 0));
  const otherTotal = round2(manual.reduce((sum, row) => sum + Number(row.amount || 0), 0));

  res.json({
    month,
    summary: {
      wheat: wheatTotal,
      bardana: bardanaTotal,
      other: otherTotal,
      total: round2(wheatTotal + bardanaTotal + otherTotal),
    },
    automatic: [...wheatRows, ...wheatBardanaRows, ...bardanaRows].sort((a, b) => b.date.localeCompare(a.date)),
    manual,
  });
});

app.post('/api/expenses', (req, res) => {
  try {
    const date = req.body.date || today();
    const category = requiredText(req.body.category, 'Expense category');
    const amount = round2(asNumber(req.body.amount, 'Amount', { min: 0, allowZero: false }));
    const note = String(req.body.note ?? '').trim();
    const result = db.prepare('INSERT INTO other_expenses (date,category,amount,note) VALUES (?,?,?,?)')
      .run(date, category, amount, note);
    res.status(201).json(db.prepare('SELECT * FROM other_expenses WHERE id=?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/expenses/:id/update', (req, res) => {
  try {
    const id = asNumber(req.params.id, 'Expense', { min: 1, allowZero: false });
    const existing = db.prepare('SELECT id FROM other_expenses WHERE id=?').get(id);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    const date = req.body.date || today();
    const category = requiredText(req.body.category, 'Expense category');
    const amount = round2(asNumber(req.body.amount, 'Amount', { min: 0, allowZero: false }));
    const note = String(req.body.note ?? '').trim();
    db.prepare('UPDATE other_expenses SET date=?,category=?,amount=?,note=? WHERE id=?')
      .run(date, category, amount, note, id);
    res.json(db.prepare('SELECT * FROM other_expenses WHERE id=?').get(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/appendix/daily', (req, res) => {
  const date = String(req.query.date || today());

  const wheatUsed = round2(db.prepare(`
    SELECT COALESCE(SUM(wheat_consumed),0) AS total
    FROM production
    WHERE date=?
  `).get(date).total);

  const wheat = getProduct('Wheat');
  const wheatClosing = wheat ? round2(db.prepare(`
    SELECT COALESCE(SUM(qty_kg),0) AS total
    FROM stock_movements
    WHERE product_id=? AND date<=?
  `).get(wheat.id, date).total) : 0;

  const rows = db.prepare(`
    SELECT p.id, p.name,
      ROUND(COALESCE((
        SELECT SUM(pi.qty_kg)
        FROM production_items pi
        JOIN production pr ON pr.id=pi.production_id
        WHERE pr.date=? AND pi.product_id=p.id
      ),0),2) AS produced_kg,
      ROUND(COALESCE((
        SELECT SUM(sm.qty_kg)
        FROM stock_movements sm
        WHERE sm.product_id=p.id AND sm.date<=?
      ),0),2) AS closing_kg
    FROM products p
    WHERE p.is_active=1 AND p.name<>'Bardana' AND p.name<>'Wheat'
    ORDER BY p.name COLLATE NOCASE
  `).all(date, date).map((row) => ({
    ...row,
    percentage: wheatUsed > 0 ? round2((Number(row.produced_kg) / wheatUsed) * 100) : 0,
  }));

  const totalProduced = round2(rows.reduce((sum, row) => sum + Number(row.produced_kg || 0), 0));

  res.json({
    date,
    wheat_used_kg: wheatUsed,
    wheat_closing_kg: wheatClosing,
    total_produced_kg: totalProduced,
    total_yield_percent: wheatUsed > 0 ? round2((totalProduced / wheatUsed) * 100) : 0,
    rows,
  });
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
