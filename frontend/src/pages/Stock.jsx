import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, ErrorBox } from '../components/Common';
import { monthNow, num, today } from '../utils';
import DateField from '../components/DateField';

export default function Stock(){
 const [date,setDate]=useState(today()),[month,setMonth]=useState(monthNow());
 const [daily,setDaily]=useState(null),[monthly,setMonthly]=useState(null),[overall,setOverall]=useState(null),[bardana,setBardana]=useState(null);
 const [error,setError]=useState('');

 const loadDaily=()=>api.get(`/stock/daily?date=${date}`).then(setDaily).catch(e=>setError(e.message));
 const loadMonthly=()=>api.get(`/stock/monthly?month=${month}`).then(setMonthly).catch(e=>setError(e.message));
 const loadOverall=()=>api.get('/stock/overall').then(setOverall).catch(e=>setError(e.message));

 useEffect(()=>{setError('');loadDaily()},[date]);
 useEffect(()=>{setError('');loadMonthly()},[month]);
 useEffect(()=>{loadOverall();api.get('/bardana/stock').then(setBardana).catch(e=>setError(e.message))},[]);

 const finishedDaily=(daily?.rows||[]).filter(r=>r.name!=='Wheat');
 const finishedMonthly=(monthly?.rows||[]).filter(r=>r.name!=='Wheat');
 const finishedOverall=(overall?.rows||[]).filter(r=>r.name!=='Wheat');
 const wheat=monthly?.rows?.find(r=>r.name==='Wheat');

 return <>
  <ErrorBox error={error}/>

  <Card>
    <div className="section-title"><h3>Daily Stock Record</h3><DateField value={date} onChange={setDate}/></div>
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Previous Stock</th><th>Production</th><th>Total</th><th>Sales</th><th>Other Out</th><th>Current Remaining</th></tr></thead><tbody>
      {finishedDaily.map(r=><tr key={r.id}>
        <td><strong>{r.name}</strong></td>
        <td>{r.previous_breakdown_known?<><strong className="record-bags">{num(r.previous_bags_20)}×20KG + {num(r.previous_bags_40)}×40KG</strong><small className="record-kg">{num(r.opening)} KG{Number(r.previous_loose_kg)>0?` • ${num(r.previous_loose_kg)} loose KG`:''}</small></>:<><strong>{num(r.opening)} KG</strong><small>Bag breakdown not recorded</small></>}</td>
        <td>{r.production_breakdown_known?<><strong className="record-bags">{num(r.production_bags_20)}×20KG + {num(r.production_bags_40)}×40KG</strong><small className="record-kg">{num(r.production)} KG{Number(r.production_loose_kg)>0?` • ${num(r.production_loose_kg)} loose KG`:''}</small></>:<><strong>{num(r.production)} KG</strong><small>Calculated production</small></>}</td>
        <td><strong className="record-bags">{num(r.total_bags_20)}×20KG + {num(r.total_bags_40)}×40KG</strong><small className="record-kg">{num(r.total_available)} KG{Number(r.total_loose_kg)>0?` • ${num(r.total_loose_kg)} loose KG`:''}</small></td>
        <td><strong className="record-bags">{num(r.sales_bags_20)}×20KG + {num(r.sales_bags_40)}×40KG</strong><small className="record-kg">{num(r.sales)} KG{Number(r.sales_loose_kg)>0?` • ${num(r.sales_loose_kg)} loose KG`:''}</small></td>
        <td><strong className="record-bags">{num(r.consumption_bags_20)}×20KG + {num(r.consumption_bags_40)}×40KG</strong><small className="record-kg">{num(r.consumption)} KG{Number(r.consumption_loose_kg)>0?` • ${num(r.consumption_loose_kg)} loose KG`:''}</small></td>
        <td>{r.bag_breakdown_known?<><strong className="record-bags">{num(r.bags_20)}×20KG + {num(r.bags_40)}×40KG</strong><small className="record-kg">{num(r.closing)} KG{Number(r.loose_kg)>0?` • ${num(r.loose_kg)} loose KG`:''}</small></>:<><strong>{num(r.closing)} KG</strong><small>Bag breakdown not recorded</small></>}</td>
      </tr>)}
    </tbody></table></div>
  </Card>

  <Card className="section-card-below">
    <div className="section-title"><h3>Monthly Wheat Record</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
    <div className="table-wrap"><table><thead><tr><th>Opening Wheat</th><th>Total Wheat In</th><th>Used / Ground</th><th>Closing Wheat</th></tr></thead><tbody><tr><td>{num(wheat?.opening)} KG</td><td>{num(wheat?.in_qty)} KG</td><td>{num(wheat?.out_qty)} KG</td><td><strong>{num(wheat?.closing)} KG</strong></td></tr></tbody></table></div>
  </Card>

  <Card className="section-card-below">
    <div className="section-title"><h3>Monthly Product Record</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Opening</th><th>In / Production</th><th>Out</th><th>Closing</th></tr></thead><tbody>{finishedMonthly.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{num(r.opening)} KG</td><td>{num(r.in_qty)} KG</td><td>{num(r.out_qty)} KG</td><td><strong>{num(r.closing)} KG</strong></td></tr>)}</tbody></table></div>
  </Card>

  <Card className="section-card-below">
    <h3>Overall Product Record</h3>
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Total In</th><th>Total Out</th><th>Current</th></tr></thead><tbody>{finishedOverall.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{num(r.total_in)} KG</td><td>{num(r.total_out)} KG</td><td><strong>{num(r.current)} KG</strong></td></tr>)}</tbody></table></div>
  </Card>

  <Card className="section-card-below">
    <h3>Bardana Stock</h3>
    <div className="table-wrap"><table><thead><tr><th>Total Received</th><th>Used / Sold</th><th>Current</th></tr></thead><tbody><tr><td>{num(bardana?.total_received)} Bags</td><td>{num(bardana?.used)} Bags</td><td><strong>{num(bardana?.current)} Bags</strong></td></tr></tbody></table></div>
  </Card>
 </>;
}
