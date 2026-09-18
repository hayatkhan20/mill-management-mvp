import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Consumption from './pages/Consumption';
import Accounts from './pages/Accounts';
import Stock from './pages/Stock';
import Appendix from './pages/Appendix';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';

const pages={
  dashboard:Dashboard,
  purchases:Purchases,
  production:Production,
  sales:Sales,
  consumption:Consumption,
  accounts:Accounts,
  stock:Stock,
  appendix:Appendix,
  expenses:Expenses,
  settings:Settings,
};

export default function App(){
  const [page,setPage]=useState('dashboard');
  const Page=pages[page];
  return <Layout page={page} setPage={setPage}><Page key={page}/></Layout>;
}
