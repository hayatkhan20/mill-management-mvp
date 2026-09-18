import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blank=()=>({date:today(),product_id:'',qty_kg:'',reason:'Home',remarks:''});

export default function Consumption(){
  const [products,setProducts]=useState([]),[rows,setRows]=useState([]),[form,setForm]=useState(blank());
  const [error,setError]=useState(''),[success,setSuccess]=useState('');

  const load=async()=>{
    try{
      const [p,r]=await Promise.all([api.get('/products'),api.get('/consumption')]);
      setProducts(p.filter(x=>x.name!=='Wheat'));
      setRows(r);
    }catch(e){setError(e.message)}
  };

  useEffect(()=>{load()},[]);

  const submit=async e=>{
    e.preventDefault();
    setError('');setSuccess('');
    try{
      await api.post('/consumption',form);
      setForm(blank());
      setSuccess('Stock out recorded and product stock reduced.');
      await load();
    }catch(e){setError(e.message)}
  };

  return <>
    <PageHeader title="Consumption" text="Record finished products used at home, inside the mill/company, donated, or otherwise taken out without a sale."/>
    <div className="two-col">
      <Card>
        <h3>New Stock Out Entry</h3>
        <ErrorBox error={error}/><SuccessBox text={success}/>
        <form className="form-grid" onSubmit={submit}>
          <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
          <label>Product
            <select required value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}>
              <option value="">Select product</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>Quantity (KG)<input required type="number" min="0.01" step="0.01" value={form.qty_kg} onChange={e=>setForm({...form,qty_kg:e.target.value})}/></label>
          <label>Reason
            <select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}>
              <option>Home</option>
              <option>Company / Mill Use</option>
              <option>Donation</option>
              <option>Other</option>
            </select>
          </label>
          <label className="span-2">Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} placeholder="Optional"/></label>
          <div className="span-2"><button className="primary">Save Stock Out</button></div>
        </form>
      </Card>

      <Card>
        <h3>Recent Stock Out</h3>
        {rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>KG</th><th>Reason</th><th>Remarks</th></tr></thead><tbody>
          {rows.slice(0,30).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td><strong>{r.product_name}</strong></td><td>{num(r.qty_kg)} KG</td><td>{r.reason}</td><td>{r.remarks||'—'}</td></tr>)}
        </tbody></table></div>:<Empty/>}
      </Card>
    </div>
  </>;
}
