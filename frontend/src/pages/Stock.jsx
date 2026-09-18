import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, ErrorBox, PageHeader } from '../components/Common';
import { monthNow, num, today } from '../utils';
import DateField from '../components/DateField';

export default function Stock(){
 const [date,setDate]=useState(today()),[month,setMonth]=useState(monthNow()),[daily,setDaily]=useState(null),[monthly,setMonthly]=useState(null),[bardana,setBardana]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api.get(`/stock/daily?date=${date}`).then(setDaily).catch(e=>setError(e.message))},[date]);
 useEffect(()=>{api.get(`/stock/monthly?month=${month}`).then(setMonthly).catch(e=>setError(e.message))},[month]);
 useEffect(()=>{api.get('/bardana/stock').then(setBardana).catch(e=>setError(e.message))},[]);

 const table=rows=><div className="table-wrap"><table><thead><tr><th>Product</th><th>Opening</th><th>IN</th><th>OUT</th><th>Closing</th></tr></thead><tbody>{rows?.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{num(r.opening)} KG</td><td>{num(r.in_qty)} KG</td><td>{num(r.out_qty)} KG</td><td><strong>{num(r.closing)} KG</strong></td></tr>)}</tbody></table></div>;
 const wheat=monthly?.rows?.find(r=>r.name==='Wheat');

 return <>
  <PageHeader title="Stock" text="Wheat/products are tracked in KG. Bardana is tracked separately as number of bags."/><ErrorBox error={error}/>
  <div className="two-col">
   <Card><div className="section-title"><h3>Monthly Wheat Summary</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
    <div className="table-wrap"><table><thead><tr><th>Opening Wheat</th><th>Total Wheat In</th><th>Used / Ground</th><th>Current Wheat</th></tr></thead><tbody><tr><td>{num(wheat?.opening)} KG</td><td>{num(wheat?.in_qty)} KG</td><td>{num(wheat?.out_qty)} KG</td><td><strong>{num(wheat?.closing)} KG</strong></td></tr></tbody></table></div>
   </Card>
   <Card><h3>Bardana Stock</h3><div className="table-wrap"><table><thead><tr><th>Total Received</th><th>Used</th><th>Current</th></tr></thead><tbody><tr><td>{num(bardana?.total_received)} Bags</td><td>{num(bardana?.used)} Bags</td><td><strong>{num(bardana?.current)} Bags</strong></td></tr></tbody></table></div><small>Bardana used will start decreasing automatically once the product packing rule is confirmed and added.</small></Card>
  </div>

  <div className="two-col" style={{marginTop:18}}>
   <Card><div className="section-title"><h3>Daily Stock</h3><DateField value={date} onChange={setDate}/></div>{table(daily?.rows)}</Card>
   <Card><div className="section-title"><h3>Monthly Product Stock</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>{table(monthly?.rows)}</Card>
  </div>
 </>;
}
