import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, Empty, ErrorBox, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blank=()=>({date:today(),product_id:'',bags_20:'',bags_40:'',loose_kg:'',reason:'Home',remarks:''});
const totalKg=x=>(Number(x.bags_20||0)*20)+(Number(x.bags_40||0)*40)+Number(x.loose_kg||0);

export default function Consumption(){
  const {t}=useUiPreferences();
  const [products,setProducts]=useState([]),[rows,setRows]=useState([]),[form,setForm]=useState(blank()),[editingId,setEditingId]=useState(null);
  const [error,setError]=useState(''),[success,setSuccess]=useState('');

  const load=async()=>{try{const [p,r]=await Promise.all([api.get('/products'),api.get('/consumption')]);setProducts(p.filter(x=>!['Wheat','Bardana'].includes(x.name)));setRows(r)}catch(e){setError(e.message)}};
  useEffect(()=>{load()},[]);

  const submit=async e=>{
    e.preventDefault();setError('');setSuccess('');
    try{
      await api.post(editingId?`/consumption/${editingId}/update`:'/consumption',form);
      const wasEdit=!!editingId;setEditingId(null);setForm(blank());
      setSuccess(wasEdit?'Consumption record updated.':'Consumption saved and stock reduced.');
      await load();
    }catch(e){setError(e.message)}
  };

  return <>
    <Card>
      <h3>{t('newStockOut','New Stock Out Entry')}</h3>
      <ErrorBox error={error}/><SuccessBox text={success}/>
      <form className="form-grid" onSubmit={submit}>
        <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
        <label>Product<select required value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>20 K Bags<input type="number" min="0" step="1" value={form.bags_20} onChange={e=>setForm({...form,bags_20:e.target.value})}/></label>
        <label>40 K Bags<input type="number" min="0" step="1" value={form.bags_40} onChange={e=>setForm({...form,bags_40:e.target.value})}/></label>
        <label>Loose KG<input type="number" min="0" step="0.01" value={form.loose_kg} onChange={e=>setForm({...form,loose_kg:e.target.value})}/></label>
        <label>Total KG<input readOnly value={num(totalKg(form))}/></label>
        <label>Reason<select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}><option>Home</option><option>Company / Mill Use</option><option>Donation</option><option>Other</option></select></label>
        <label>Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
        <div className="span-2">{editingId&&<button type="button" className="secondary" onClick={()=>{setEditingId(null);setForm(blank())}}>Cancel Edit</button>} <button className="primary">{editingId?'Save Changes':'Save Consumption'}</button></div>
      </form>
    </Card>

    <Card className="section-card-below">
      <h3>Recent Consumption</h3>
      {rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>20 KG</th><th>40 KG</th><th>Loose KG</th><th>Total</th><th>Reason</th><th></th></tr></thead><tbody>
        {rows.slice(0,30).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td><strong>{r.product_name}</strong></td><td>{num(r.bags_20)} Bags</td><td>{num(r.bags_40)} Bags</td><td>{num(r.loose_kg)} KG</td><td>{num(r.qty_kg)} KG</td><td>{r.reason}</td><td><button className="link-btn" onClick={()=>{setEditingId(r.id);setForm({date:r.date,product_id:String(r.product_id),bags_20:r.bags_20||'',bags_40:r.bags_40||'',loose_kg:r.loose_kg||'',reason:r.reason,remarks:r.remarks||''});window.scrollTo({top:0,behavior:'smooth'})}}>Edit</button></td></tr>)}
      </tbody></table></div>:<Empty/>}
    </Card>
  </>;
}
