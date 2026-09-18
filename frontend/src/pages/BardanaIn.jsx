import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const initial=()=>({date:today(),source_id:'',quantity:'',rate_per_bag:'',remarks:''});

export default function BardanaIn(){
 const [form,setForm]=useState(initial()),[sources,setSources]=useState([]),[rows,setRows]=useState([]),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=async()=>{try{const [s,b]=await Promise.all([api.get('/sources'),api.get('/bardana-purchases')]);setSources(s);setRows(b)}catch(e){setError(e.message)}};
 useEffect(()=>{load()},[]);
 const total=Number(form.quantity||0)*Number(form.rate_per_bag||0);
 const submit=async e=>{e.preventDefault();setError('');setSuccess('');try{await api.post('/bardana-purchases',form);setForm(initial());setSuccess('Bardana purchase saved and Bardana stock updated.');load()}catch(e){setError(e.message)}};

 return <>
  <PageHeader title="Bardana In" text="Use this page when Bardana is purchased separately without wheat."/>
  <div className="two-col">
   <Card><h3>New Bardana Purchase</h3><ErrorBox error={error}/><SuccessBox text={success}/><form className="form-grid" onSubmit={submit}>
    <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
    <label>Source<select required value={form.source_id} onChange={e=>setForm({...form,source_id:e.target.value})}><option value="">Select source</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name} — {s.source_type}</option>)}</select></label>
    <label>Quantity (Bags)<input required type="number" min="1" step="1" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label>
    <label>Rate per Bag<input required type="number" min="0" step="0.01" value={form.rate_per_bag} onChange={e=>setForm({...form,rate_per_bag:e.target.value})}/></label>
    <label className="span-2">Total Cost<input value={money(total)} disabled/></label>
    <label className="span-2">Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
    <div className="span-2"><button className="primary">Save Bardana Purchase</button></div>
   </form>{!sources.length&&<small>Add a source from the Sources tab before recording a purchase.</small>}</Card>

   <Card><h3>Recent Bardana Purchases</h3>{rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Source</th><th>Bags</th><th>Rate/Bag</th><th>Total</th></tr></thead><tbody>
    {rows.slice(0,15).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td><strong>{r.source_name}</strong><small>{r.source_type}</small></td><td>{num(r.quantity)}</td><td>{money(r.rate_per_bag)}</td><td>{money(r.total_cost)}</td></tr>)}
   </tbody></table></div>:<Empty/>}</Card>
  </div>
 </>;
}
