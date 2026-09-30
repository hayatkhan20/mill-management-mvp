import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, ErrorBox, SuccessBox } from '../components/Common';
import { monthNow, num, today } from '../utils';
import DateField from '../components/DateField';

const blankCount=()=>({product_id:'',bags_20:'',bags_40:'',loose_kg:'',note:''});
const totalKg=x=>(Number(x.bags_20||0)*20)+(Number(x.bags_40||0)*40)+Number(x.loose_kg||0);

export default function Stock(){
 const [date,setDate]=useState(today()),[month,setMonth]=useState(monthNow());
 const [daily,setDaily]=useState(null),[monthly,setMonthly]=useState(null),[overall,setOverall]=useState(null),[bardana,setBardana]=useState(null);
 const [count,setCount]=useState(blankCount()),[error,setError]=useState(''),[success,setSuccess]=useState('');

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

 const saveCount=async e=>{
   e.preventDefault();setError('');setSuccess('');
   try{
     await api.post('/stock/physical-count',{date,...count});
     setSuccess('Physical closing stock saved. Daily production has been recalculated.');
     setCount(blankCount());
     await Promise.all([loadDaily(),loadMonthly(),loadOverall()]);
   }catch(e){setError(e.message)}
 };

 return <>
  <ErrorBox error={error}/><SuccessBox text={success}/>

  <Card>
    <div className="section-title"><h3>Daily Stock Record</h3><DateField value={date} onChange={setDate}/></div>
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>Previous Stock</th><th>Production</th><th>Total</th><th>Sales</th><th>Other Out</th><th>Current Remaining</th></tr></thead><tbody>
      {finishedDaily.map(r=><tr key={r.id}><td><strong>{r.name}</strong>{r.physical_counted&&<small>Physical count saved</small>}</td><td>{num(r.opening)} KG</td><td><strong>{num(r.production)} KG</strong>{r.physical_counted&&Number(r.production)!==Number(r.recorded_production)&&<small>Recorded: {num(r.recorded_production)} KG</small>}</td><td>{num(r.total_available)} KG</td><td>{num(r.sales)} KG</td><td>{num(r.consumption)} KG</td><td><strong>{num(r.closing)} KG</strong></td></tr>)}
    </tbody></table></div>
  </Card>

  <Card className="section-card-below">
    <h3>End of Day Physical Stock Count</h3>
    <form className="physical-count-grid" onSubmit={saveCount}>
      <label>Product<select required value={count.product_id} onChange={e=>setCount({...count,product_id:e.target.value})}><option value="">Select product</option>{finishedDaily.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <label>20 KG Bags<input type="number" min="0" step="1" value={count.bags_20} onChange={e=>setCount({...count,bags_20:e.target.value})}/></label>
      <label>40 KG Bags<input type="number" min="0" step="1" value={count.bags_40} onChange={e=>setCount({...count,bags_40:e.target.value})}/></label>
      <label>Loose KG<input type="number" min="0" step="0.01" value={count.loose_kg} onChange={e=>setCount({...count,loose_kg:e.target.value})}/></label>
      <label>Total KG<input readOnly value={num(totalKg(count))}/></label>
      <label>Note<input value={count.note} onChange={e=>setCount({...count,note:e.target.value})}/></label>
      <div><button className="primary">Save Physical Count</button></div>
    </form>
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
