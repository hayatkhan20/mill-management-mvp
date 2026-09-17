import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { num, today } from '../utils';

const initial=()=>({date:today(),wheat_consumed:'',flour_produced:'',suji_produced:'',remarks:''});
export default function Production(){
 const [form,setForm]=useState(initial()); const [rows,setRows]=useState([]); const [error,setError]=useState(''); const [success,setSuccess]=useState('');
 const load=()=>api.get('/production').then(setRows).catch(e=>setError(e.message)); useEffect(() => { load(); }, []);
 const submit=async e=>{e.preventDefault();setError('');setSuccess('');try{await api.post('/production',form);setForm(initial());setSuccess('Production record saved and stock updated.');load();}catch(e){setError(e.message)}};
 return <><PageHeader title="Production Record" text="Manual record only. Enter what was consumed and what was actually produced."/>
 <div className="two-col"><Card><h3>New Production Entry</h3><ErrorBox error={error}/><SuccessBox text={success}/><form onSubmit={submit} className="form-grid">
 <label className="span-2">Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
 <label>Wheat Consumed (KG)<input type="number" min="0" step="0.01" value={form.wheat_consumed} onChange={e=>setForm({...form,wheat_consumed:e.target.value})}/></label>
 <label>Flour Produced (KG)<input type="number" min="0" step="0.01" value={form.flour_produced} onChange={e=>setForm({...form,flour_produced:e.target.value})}/></label>
 <label>Suji Produced (KG)<input type="number" min="0" step="0.01" value={form.suji_produced} onChange={e=>setForm({...form,suji_produced:e.target.value})}/></label>
 <label className="span-2">Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label><div className="span-2"><button className="primary">Save Production</button></div>
 </form></Card><Card><h3>Recent Production</h3>{rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Wheat Used</th><th>Flour</th><th>Suji</th></tr></thead><tbody>{rows.slice(0,12).map(r=><tr key={r.id}><td>{r.date}</td><td>{num(r.wheat_consumed)} KG</td><td>{num(r.flour_produced)} KG</td><td>{num(r.suji_produced)} KG</td></tr>)}</tbody></table></div>:<Empty/>}</Card></div></>;
}
