import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, today } from '../utils';

const initial = () => ({ date: today(), source_type: 'Private', source_name: '', bags: '', total_kg: '', rate_per_kg: '', remarks: '' });
export default function WheatIn() {
  const [form, setForm] = useState(initial()); const [rows, setRows] = useState([]); const [error,setError]=useState(''); const [success,setSuccess]=useState('');
  const load = () => api.get('/wheat-in').then(setRows).catch(e=>setError(e.message)); useEffect(() => { load(); }, []);
  const total = Number(form.total_kg || 0) * Number(form.rate_per_kg || 0);
  const submit = async e => { e.preventDefault(); setError(''); setSuccess(''); try { await api.post('/wheat-in', form); setForm(initial()); setSuccess('Wheat received and stock updated.'); load(); } catch(e){setError(e.message);} };
  return <>
    <PageHeader title="Wheat In" text="Record every wheat delivery. KG is the stock quantity; bags are kept as an additional record."/>
    <div className="two-col">
      <Card><h3>New Wheat Entry</h3><ErrorBox error={error}/><SuccessBox text={success}/><form onSubmit={submit} className="form-grid">
        <label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label>Source Type<select value={form.source_type} onChange={e=>setForm({...form,source_type:e.target.value})}><option>Private</option><option>Government</option></select></label>
        <label className="span-2">Source / Supplier<input required value={form.source_name} onChange={e=>setForm({...form,source_name:e.target.value})} placeholder="Supplier or government source"/></label>
        <label>No. of Bags<input type="number" min="0" step="0.01" value={form.bags} onChange={e=>setForm({...form,bags:e.target.value})}/></label>
        <label>Total Weight (KG)<input required type="number" min="0.01" step="0.01" value={form.total_kg} onChange={e=>setForm({...form,total_kg:e.target.value})}/></label>
        <label>Rate per KG<input required type="number" min="0" step="0.01" value={form.rate_per_kg} onChange={e=>setForm({...form,rate_per_kg:e.target.value})}/></label>
        <label>Total Cost<input value={money(total)} disabled/></label>
        <label className="span-2">Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
        <div className="span-2"><button className="primary" type="submit">Save Wheat Entry</button></div>
      </form></Card>
      <Card><h3>Recent Entries</h3>{rows.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Source</th><th>Bags</th><th>KG</th><th>Rate</th><th>Cost</th></tr></thead><tbody>{rows.slice(0,12).map(r=><tr key={r.id}><td>{r.date}</td><td><strong>{r.source_name}</strong><small>{r.source_type}</small></td><td>{num(r.bags)}</td><td>{num(r.total_kg)}</td><td>{money(r.rate_per_kg)}</td><td>{money(r.total_cost)}</td></tr>)}</tbody></table></div>:<Empty/>}</Card>
    </div>
  </>;
}
