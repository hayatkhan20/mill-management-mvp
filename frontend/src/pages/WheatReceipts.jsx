import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blank=()=>({purchase_id:'',date:today(),bags:'',total_kg:'',car_no:'',remarks:''});

export default function WheatReceipts(){
  const [purchases,setPurchases]=useState([]);
  const [rows,setRows]=useState([]);
  const [form,setForm]=useState(blank());
  const [editing,setEditing]=useState(null);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  const load=async()=>{
    try{
      const [p,r]=await Promise.all([api.get('/wheat-in'),api.get('/wheat-receipts')]);
      setPurchases(p);
      setRows(r);
    }catch(e){setError(e.message)}
  };

  useEffect(()=>{load()},[]);

  const selected=useMemo(
    ()=>purchases.find(p=>String(p.id)===String(form.purchase_id)),
    [purchases,form.purchase_id]
  );

  const submit=async e=>{
    e.preventDefault();
    setError('');setSuccess('');
    try{
      if(editing) await api.post(`/wheat-receipts/${editing.id}/update`,form);
      else await api.post('/wheat-receipts',form);
      setSuccess(editing?'Wheat receipt updated.':'Wheat receipt saved and stock updated.');
      setEditing(null);setForm(blank());await load();
    }catch(e){setError(e.message)}
  };

  const edit=row=>{
    setEditing(row);
    setForm({
      purchase_id:String(row.purchase_id),
      date:row.date,
      bags:row.bags??'',
      total_kg:row.total_kg??'',
      car_no:row.car_no||'',
      remarks:row.remarks||'',
    });
    window.scrollTo({top:0,behavior:'smooth'});
  };

  return <>
    <Card>
      <h3>{editing?'Edit Wheat Incoming':'Record Wheat Incoming'}</h3>
      <ErrorBox error={error}/><SuccessBox text={success}/>
      <form className="form-grid" onSubmit={submit}>
        <label>Purchase
          <select required disabled={!!editing} value={form.purchase_id} onChange={e=>setForm({...form,purchase_id:e.target.value})}>
            <option value="">Select wheat purchase</option>
            {purchases.map(p=><option key={p.id} value={p.id}>
              #{p.id} — {p.source_name} — {num(p.total_kg)} KG / {num(p.bags)} Bags
            </option>)}
          </select>
        </label>
        <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
        <label>Wheat In (Bags)<input required type="number" min="0" step="1" value={form.bags} onChange={e=>setForm({...form,bags:e.target.value})}/></label>
        <label>Wheat In (KG)<input required type="number" min="0.01" step="0.01" value={form.total_kg} onChange={e=>setForm({...form,total_kg:e.target.value})}/></label>
        <label>Car No.<input value={form.car_no} onChange={e=>setForm({...form,car_no:e.target.value})}/></label>
        <label>Remarks<input value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
        {selected&&<div className="span-2 quantities">
          <span>Purchased: <strong>{num(selected.total_kg)} KG</strong></span>
          <span>Received: <strong>{num(selected.received_kg)} KG</strong></span>
          <span>Remaining: <strong>{num(selected.remaining_kg)} KG</strong></span>
          <span>Advance Wheat: <strong>{num(selected.advance_wheat_kg)} KG</strong></span>
        </div>}
        <div className="span-2">
          <button className="primary">{editing?'Save Changes':'Save Wheat Incoming'}</button>{' '}
          {editing&&<button type="button" className="secondary" onClick={()=>{setEditing(null);setForm(blank())}}>Cancel</button>}
        </div>
      </form>
    </Card>

    <Card className="section-card-below">
      <h3>Wheat Incoming Register</h3>
      {rows.length?<div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Purchase</th><th>Source</th><th>Bags</th><th>KG</th><th>Car No.</th><th>Advance Wheat</th><th>Remaining</th><th></th></tr></thead>
        <tbody>{rows.map(r=><tr key={r.id}>
          <td>{formatDateDMY(r.date)}</td>
          <td>#{r.purchase_id}</td>
          <td><strong>{r.source_name}</strong></td>
          <td>{num(r.bags)}</td>
          <td>{num(r.total_kg)} KG</td>
          <td>{r.car_no||'—'}</td>
          <td>{num(r.advance_wheat_kg)} KG</td>
          <td>{num(r.remaining_kg)} KG</td>
          <td><button className="link-btn" onClick={()=>edit(r)}>Edit</button></td>
        </tr>)}</tbody>
      </table></div>:<Empty/>}
    </Card>
  </>;
}
