import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, ErrorBox, PageHeader } from '../components/Common';
import { monthNow, num, today } from '../utils';
export default function Stock(){const [date,setDate]=useState(today()),[month,setMonth]=useState(monthNow()),[daily,setDaily]=useState(null),[monthly,setMonthly]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api.get(`/stock/daily?date=${date}`).then(setDaily).catch(e=>setError(e.message))},[date]); useEffect(()=>{api.get(`/stock/monthly?month=${month}`).then(setMonthly).catch(e=>setError(e.message))},[month]);
 const table=rows=><div className="table-wrap"><table><thead><tr><th>Product</th><th>Opening</th><th>IN</th><th>OUT</th><th>Closing</th></tr></thead><tbody>{rows?.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{num(r.opening)} KG</td><td>{num(r.in_qty)} KG</td><td>{num(r.out_qty)} KG</td><td><strong>{num(r.closing)} KG</strong></td></tr>)}</tbody></table></div>;
 return <><PageHeader title="Stock" text="Closing = Opening + IN − OUT. Daily and monthly figures come directly from the same movement records."/><ErrorBox error={error}/><div className="two-col"><Card><div className="section-title"><h3>Daily Stock</h3><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>{table(daily?.rows)}</Card><Card><div className="section-title"><h3>Monthly Stock</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>{table(monthly?.rows)}</Card></div></>}
