import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader } from '../components/Common';
import { money, num } from '../utils';
import { useUiPreferences } from '../context/UiPreferences';

export default function Dashboard() {
  const {t}=useUiPreferences();
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const load = () => api.get('/dashboard').then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  if (!data) return <><ErrorBox error={error}/><div className="loading">Loading dashboard...</div></>;
  const wheat = data.stocks.find(x=>x.name==='Wheat')?.stock_kg || 0;
  const stats = [
    [t('wheatStock','Wheat Stock'), `${num(wheat)} KG`],
    [t('todaysWheatIn',"Today's Wheat In"), `${num(data.wheat_received_today)} KG`],
    [t('todaysSales',"Today's Sales"), money(data.sales_today)],
    [t('receivedToday','Received Today'), money(data.received_today)],
    [t('bardanaStock','Bardana Stock'), `${num(data.bardana_stock_current)} Bags`],
  ];
  const finished=data.stocks.filter(x=>x.name!=='Wheat');
  return <>
    <PageHeader title={t('todayAtGlance','Today at a glance')} text={`${t('date','Date')}: ${data.date}`} />
    <div className="stats-grid">{stats.map(([k,v]) => <Card key={k}><div className="stat-label">{k}</div><div className="stat-value">{v}</div></Card>)}</div>
    <div className="two-col dashboard-grid">
      <Card><h3>{t('currentFinishedStock','Current Finished Product Stock')}</h3>{finished.length?<div className="table-wrap"><table><thead><tr><th>{t('product','Product')}</th><th>{t('stockLabel','Stock')}</th></tr></thead><tbody>{finished.map(r=><tr key={r.id}><td>{r.name}</td><td><strong>{num(r.stock_kg)} KG</strong></td></tr>)}</tbody></table></div>:<Empty/>}</Card>
      <Card><div className="section-title"><h3>{t('recentSales','Recent Sales')}</h3></div>{data.recent_sales.length ? <div className="table-wrap"><table><thead><tr><th>{t('billNo','Bill')}</th><th>{t('date','Date')}</th><th>{t('customer','Customer')}</th><th>{t('total','Total')}</th><th>{t('pending','Pending')}</th></tr></thead><tbody>{data.recent_sales.map(r => <tr key={r.id}><td>{r.bill_no}</td><td>{r.date}</td><td>{r.customer_name}</td><td>{money(r.total_amount)}</td><td>{money(r.pending_amount)}</td></tr>)}</tbody></table></div> : <Empty/>}</Card>
    </div>
  </>;
}
