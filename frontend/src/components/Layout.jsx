import { useEffect, useState } from 'react';
import { Boxes, ClipboardList, Factory, LayoutDashboard, Menu, PackageMinus, PanelLeftClose, PanelLeftOpen, ReceiptText, Settings as SettingsIcon, ShoppingBasket, UsersRound, WalletCards, X } from 'lucide-react';

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
  const [sidebarOpen,setSidebarOpen]=useState(()=>typeof window==='undefined'?true:window.innerWidth>900);

  useEffect(()=>{
    const onResize=()=>{
      if(window.innerWidth>900) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize',onResize);
    return()=>window.removeEventListener('resize',onResize);
  },[]);

  const go=(key)=>{
    setPage(key);
    if(window.innerWidth<=900) setSidebarOpen(false);
  };

  return (
    <div className={`app-shell ${sidebarOpen?'sidebar-open':'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ShoppingBasket size={20}/></div>
          <div className="brand-text"><strong>Mill Manager</strong><span>Simple Mill Records</span></div>
          <button className="sidebar-close-mobile" onClick={()=>setSidebarOpen(false)} aria-label="Close menu"><X size={20}/></button>
        </div>
        <nav>
          {items.map(([key,label,Icon])=>(
            <button key={key} title={label} className={page===key?'nav-active':''} onClick={()=>go(key)}>
              <Icon size={18}/><span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen&&<button className="sidebar-overlay" aria-label="Close menu" onClick={()=>setSidebarOpen(false)}/>}

      <main className="main-area">
        <header className="topbar">
          <button className="sidebar-toggle" onClick={()=>setSidebarOpen(v=>!v)} aria-label="Toggle menu">
            <span className="desktop-toggle">{sidebarOpen?<PanelLeftClose size={20}/>:<PanelLeftOpen size={20}/>}</span>
            <span className="mobile-toggle"><Menu size={21}/></span>
          </button>
          <div><h1>{items.find(x=>x[0]===page)?.[1]}</h1></div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
