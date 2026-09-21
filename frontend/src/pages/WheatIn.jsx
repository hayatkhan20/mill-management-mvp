import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, today } from '../utils';
import { UserPlus } from 'lucide-react';
import DateField, { formatDateDMY } from '../components/DateField';

const initial=()=>({date:today(),source_id:'',bags:'',total_kg:'',rate_per_kg:'',bardana_rate_per_bag:'',remarks:''});
const blankSource=()=>({name:'',source_type:'Private',phone:'',address:''});

export default function WheatIn(){
 const [form,setForm]=useState(initial()),[sources,setSources]=useState([]),[rows,setRows]=useState([]),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [showAddSource,setShowAddSource]=useState(false),[newSource,setNewSource]=useState(blankSource());
 const load=async()=>{try{const [s,w]=await Promise.all([api.get('/sources'),api.get('/wheat-in')]);setSources(s);setRows(w)}catch(e){setError(e.message)}};
 useEffect(()=>{load()},[]);
 const wheatCost=Number(form.total_kg||0)*Number(form.rate_per_kg||0);
 const bardanaCost=Number(form.bags||0)*Number(form.bardana_rate_per_bag||0);
 const total=wheatCost+bardanaCost;
 const submit=async e=>{e.preventDefault();setError('');setSuccess('');try{await api.post('/wheat-in',form);setForm(initial());setSuccess('Wheat and Bardana received. Source balance and stock were updated.');load()}catch(e){setError(e.message)}};
 const addSource=async e=>{e.preventDefault();setError('');setSuccess('');try{const created=await api.post('/sources',newSource);const refreshed=await api.get('/sources');setSources(refreshed);setForm(prev=>({...prev,source_id:String(created.id)}));setNewSource(blankSource());setShowAddSource(false);setSuccess(`${created.name} added and selected.`)}catch(e){setError(e.message)}};

 return <>
  <PageHeader title="Wheat In"/>
  <div>
   <Card><h3>New Wheat Purchase</h3><ErrorBox error={error}/><SuccessBox text={success}/><form onSubmit={submit} className="form-grid">
    <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
    <label>Source
     <div className="source-inline-row">
      <select required value={form.source_id} onChange={e=>setForm({...form,source_id:e.target.value})}><option value="">Select source</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name} — {s.source_type}</option>)}</select>
      <button type="button" className="secondary add-customer-btn" onClick={()=>{setNewSource(blankSource());setShowAddSource(true)}}><UserPlus size={17}/> Add Source</button>
     </div>
    </label>
    <label>No. of Bags / Bardana<input type="number" min="0" step="1" value={form.bags} onChange={e=>setForm({...form,bags:e.target.value})}/></label>
    <label>Total Wheat (KG)<input required type="number" min="0.01" step="0.01" value={form.total_kg} onChange={e=>setForm({...form,total_kg:e.target.value})}/></label>
    <label>Wheat Rate per KG<input required type="number" min="0" step="0.01" value={form.rate_per_kg} onChange={e=>setForm({...form,rate_per_kg:e.target.value})}/></label>
    <label>Wheat Cost<input value={money(wheatCost)} disabled/></label>
    <label>Bardana Rate per Bag<input type="number" min="0" step="0.01" value={form.bardana_rate_per_bag} onChange={e=>setForm({...form,bardana_rate_per_bag:e.target.value})} placeholder="0 if included/free"/></label>
    <label>Bardana Cost<input value={money(bardanaCost)} disabled/></label>
    <label className="span-2">Total Purchase Cost<input value={money(total)} disabled/></label>
    <label className="span-2">Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
    <div className="span-2"><button className="primary">Save Wheat Purchase</button></div>
   </form></Card>

   <Card className="section-card-below"><h3>Recent Wheat Purchases</h3>{rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Source</th><th>Bags</th><th>Wheat KG</th><th>Wheat Cost</th><th>Bardana Cost</th><th>Total</th></tr></thead><tbody>
    {rows.slice(0,15).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td><strong>{r.source_name}</strong><small>{r.source_type}</small></td><td>{num(r.bags)}</td><td>{num(r.total_kg)}</td><td>{money(r.total_cost)}</td><td>{money(r.bardana_cost)}</td><td><strong>{money(r.purchase_total)}</strong></td></tr>)}
   </tbody></table></div>:<Empty/>}</Card>
  </div>
  {showAddSource&&<div className="modal"><div className="add-customer-modal">
   <div className="modal-title-row"><div><h2>Add Source</h2></div><button type="button" className="secondary" onClick={()=>setShowAddSource(false)}>Cancel</button></div>
   <form className="form-grid" onSubmit={addSource}>
    <label className="span-2">Name<input required autoFocus value={newSource.name} onChange={e=>setNewSource({...newSource,name:e.target.value})}/></label>
    <label>Type<select value={newSource.source_type} onChange={e=>setNewSource({...newSource,source_type:e.target.value})}><option>Private</option><option>Government</option></select></label>
    <label>Phone<input value={newSource.phone} onChange={e=>setNewSource({...newSource,phone:e.target.value})}/></label>
    <label className="span-2">Address<input value={newSource.address} onChange={e=>setNewSource({...newSource,address:e.target.value})}/></label>
    <div className="span-2 actions"><button className="primary"><UserPlus size={17}/> Save Source</button></div>
   </form>
  </div></div>}
 </>;
}
