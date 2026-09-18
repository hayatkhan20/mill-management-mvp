import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, ErrorBox, PageHeader } from '../components/Common';
import { num, today } from '../utils';
import DateField from '../components/DateField';

export default function Appendix(){
 const [date,setDate]=useState(today()),[data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  setError('');
  api.get(`/appendix/daily?date=${date}`).then(setData).catch(e=>setError(e.message));
 },[date]);

 return <>
  <PageHeader title="Appendix" text="Daily production percentage is calculated from the actual KG entered in Production."/>
  <ErrorBox error={error}/>
  <Card>
   <div className="section-title"><h3>Daily Record</h3><DateField value={date} onChange={setDate}/></div>
   {data&&<>
    <div className="stats-grid mini">
     <Card><div className="stat-label">Wheat Used / Ground</div><div className="stat-value">{num(data.wheat_used_kg)} KG</div></Card>
     <Card><div className="stat-label">Total Products Produced</div><div className="stat-value">{num(data.total_produced_kg)} KG</div></Card>
     <Card><div className="stat-label">Current Wheat / Closing</div><div className="stat-value">{num(data.wheat_closing_kg)} KG</div></Card>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Produced KG</th><th>Production %</th><th>Closing Stock KG</th><th>Closing Bags</th></tr></thead><tbody>
     {data.rows.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{num(r.produced_kg)} KG</td><td>{num(r.percentage)}%</td><td>{num(r.closing_kg)} KG</td><td>—</td></tr>)}
     <tr><td><strong>Total</strong></td><td><strong>{num(data.total_produced_kg)} KG</strong></td><td><strong>{num(data.total_yield_percent)}%</strong></td><td></td><td></td></tr>
    </tbody></table></div>
    <div className="note-card">Closing Bags will be calculated after the 20 KG / 40 KG packing conversion rule is confirmed. For now, production and closing stock remain in KG.</div>
   </>}
  </Card>
 </>;
}
