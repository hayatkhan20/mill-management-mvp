import { Boxes, ClipboardList, Factory, LayoutDashboard, PackageMinus, ReceiptText, Settings as SettingsIcon, ShoppingBasket, UsersRound, WalletCards } from 'lucide-react';

const items = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['purchases', 'Purchases', ShoppingBasket],
  ['production', 'Production', Factory],
  ['sales', 'Sales / Billing', ReceiptText],
  ['consumption', 'Consumption', PackageMinus],
  ['accounts', 'Accounts', UsersRound],
  ['stock', 'Stock', Boxes],
  ['appendix', 'Appendix', ClipboardList],
  ['expenses', 'Expenses', WalletCards],
  ['settings', 'Settings', SettingsIcon],
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
          <div><h1>{items.find(x => x[0] === page)?.[1]}</h1></div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
