import { Boxes, ClipboardList, Factory, LayoutDashboard, PackageMinus, ReceiptText, Settings as SettingsIcon, ShoppingBasket, UsersRound, WalletCards } from 'lucide-react';
import { useUiPreferences } from '../context/UiPreferences';

const items = [
  ['dashboard', 'dashboard', 'Dashboard', LayoutDashboard],
  ['purchases', 'purchases', 'Purchases', ShoppingBasket],
  ['production', 'production', 'Production', Factory],
  ['sales', 'sales', 'Sales', ReceiptText],
  ['consumption', 'consumption', 'Consumption', PackageMinus],
  ['accounts', 'accounts', 'Accounts', UsersRound],
  ['stock', 'stock', 'Stock', Boxes],
  ['appendix', 'appendix', 'Appendix', ClipboardList],
  ['expenses', 'expenses', 'Expenses', WalletCards],
  ['settings', 'settings', 'Settings', SettingsIcon],
];

export default function Layout({ page, setPage, children }) {
  const {t}=useUiPreferences();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ShoppingBasket size={20} /></div>
          <div><strong>Mill Manager</strong><span>Simple Mill Records</span></div>
        </div>
        <nav>
          {items.map(([key, tKey, fallback, Icon]) => (
            <button key={key} className={page === key ? 'nav-active' : ''} onClick={() => setPage(key)}>
              <Icon size={18} /><span>{t(tKey,fallback)}</span>
            </button>
          ))}
        </nav>

        <div className="developer-footer">
          <span>{t('developedBy','Developed by')}</span>
          <a href="https://hayatkhan20.github.io/hayat" target="_blank" rel="noreferrer">Engineer Hayat Ullah Abid</a>
          <div className="developer-footer-links">
            <a href="https://www.linkedin.com/in/hayat-gis" target="_blank" rel="noreferrer">LinkedIn</a>
            <span>•</span>
            <a href="https://hayatkhan20.github.io/hayat" target="_blank" rel="noreferrer">{t('portfolio','Portfolio')}</a>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><h1>{(()=>{const item=items.find(x=>x[0]===page);return item?t(item[1],item[2]):''})()}</h1></div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
