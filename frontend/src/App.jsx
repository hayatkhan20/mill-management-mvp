import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WheatIn from './pages/WheatIn';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Reports from './pages/Reports';

const pages={dashboard:Dashboard,wheat:WheatIn,production:Production,sales:Sales,customers:Customers,products:Products,stock:Stock,reports:Reports};
export default function App(){const [page,setPage]=useState('dashboard'); const Page=pages[page]; return <Layout page={page} setPage={setPage}><Page key={page}/></Layout>}
