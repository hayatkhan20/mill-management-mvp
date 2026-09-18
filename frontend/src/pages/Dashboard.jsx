import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader } from '../components/Common';
import { money, num } from '../utils';

export default function Dashboard() {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const load = () => api.get('/dashboard').then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  if (!data) return <><ErrorBox error={error}/><div className="loading">Loading dashboard...</div></>;
  const wheat = data.stocks.find(x=>x.name==='Wheat')?.stock_kg || 0;
  const stats = [
    ['Wheat Stock', `${num(wheat)} KG`],
    ["Today's Wheat In", `${num(data.wheat_received_today)} KG`],
    ["Today's Sales", money(data.sales_today)],
    ['Received Today', money(data.received_today)],
    ['Total Customer Pending', money(data.total_pending)],
    ['Active Products', num(data.active_products)],
  ];
  const finished=data.stocks.filter(x=>x.name!=='Wheat');
  return <>
    <PageHeader title="Today at a glance" text={`Date: ${data.date}`} />
    <div className="stats-grid">{stats.map(([k,v]) => <Card key={k}><div className="stat-label">{k}</div><div className="stat-value">{v}</div></Card>)}</div>
    <div className="two-col dashboard-grid">
      <Card><h3>Current Finished Product Stock</h3>{finished.length?<div className="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th></tr></thead><tbody>{finished.map(r=><tr key={r.id}><td>{r.name}</td><td><strong>{num(r.stock_kg)} KG</strong></td></tr>)}</tbody></table></div>:<Empty/>}</Card>
      <Card><div className="section-title"><h3>Recent Sales</h3></div>{data.recent_sales.length ? <div className="table-wrap"><table><thead><tr><th>Bill</th><th>Date</th><th>Customer</th><th>Total</th><th>Pending</th></tr></thead><tbody>{data.recent_sales.map(r => <tr key={r.id}><td>{r.bill_no}</td><td>{r.date}</td><td>{r.customer_name}</td><td>{money(r.total_amount)}</td><td>{money(r.pending_amount)}</td></tr>)}</tbody></table></div> : <Empty/>}</Card>
    </div>
  </>;
}
