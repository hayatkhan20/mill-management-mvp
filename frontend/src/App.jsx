import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WheatIn from './pages/WheatIn';
import BardanaIn from './pages/BardanaIn';
import Sources from './pages/Sources';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Appendix from './pages/Appendix';
import Expenses from './pages/Expenses';
import OpeningData from './pages/OpeningData';
import Consumption from './pages/Consumption';

const pages={dashboard:Dashboard,wheat:WheatIn,bardana:BardanaIn,sources:Sources,production:Production,sales:Sales,consumption:Consumption,customers:Customers,products:Products,stock:Stock,appendix:Appendix,expenses:Expenses,opening:OpeningData};
export default function App(){const [page,setPage]=useState('dashboard'); const Page=pages[page]; return <Layout page={page} setPage={setPage}><Page key={page}/></Layout>}
