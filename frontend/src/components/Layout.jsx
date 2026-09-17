import { BarChart3, Boxes, Factory, LayoutDashboard, ReceiptText, ShoppingBasket, Users, Wheat } from 'lucide-react';

const items = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['wheat', 'Wheat In', Wheat],
  ['production', 'Production', Factory],
  ['sales', 'Sales / Billing', ReceiptText],
  ['customers', 'Customers', Users],
  ['stock', 'Stock', Boxes],
  ['reports', 'Reports', BarChart3],
];

export default function Layout({ page, setPage, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ShoppingBasket size={20} /></div>
          <div><strong>Mill Manager</strong><span>Simple Mill Records</span></div>
        </div>
        <nav>
          {items.map(([key, label, Icon]) => (
            <button key={key} className={page === key ? 'nav-active' : ''} onClick={() => setPage(key)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><h1>{items.find(x => x[0] === page)?.[1]}</h1><p>Mill stock, sales and customer records</p></div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
