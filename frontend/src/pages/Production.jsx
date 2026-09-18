import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import { Plus, Trash2 } from 'lucide-react';
import DateField, { formatDateDMY } from '../components/DateField';

const blankItem=()=>({product_id:'',qty_kg:''});
const initial=()=>({date:today(),wheat_consumed:'',remarks:'',items:[blankItem()]});

export default function Production(){
  const [form,setForm]=useState(initial()),[products,setProducts]=useState([]),[rows,setRows]=useState([]),[error,setError]=useState(''),[success,setSuccess]=useState('');

  const load=async()=>{
    try{
      const [production,productRows]=await Promise.all([api.get('/production'),api.get('/products')]);
      setRows(production);
      setProducts(productRows.filter(p=>p.name!=='Wheat'));
    }catch(e){setError(e.message)}
  };
  useEffect(()=>{load()},[]);

  const updateItem=(idx,key,value)=>setForm(prev=>({...prev,items:prev.items.map((item,i)=>i===idx?{...item,[key]:value}:item)}));
  const submit=async e=>{
    e.preventDefault();setError('');setSuccess('');
    try{
      await api.post('/production',form);
      setForm(initial());setSuccess('Production record saved and stock updated.');load();
    }catch(e){setError(e.message)}
  };

  return <>
    <PageHeader title="Production Record" text="Keep production in KG. Enter wheat used and the actual KG produced for each product."/>
    <div className="two-col production-layout">
      <Card>
        <h3>New Production Entry</h3><ErrorBox error={error}/><SuccessBox text={success}/>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
            <label>Wheat Used / Ground (KG)<input type="number" min="0" step="0.01" value={form.wheat_consumed} onChange={e=>setForm({...form,wheat_consumed:e.target.value})}/></label>
          </div>

          <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid #edf1ef'}}>
            <div className="section-title"><h3>Produced Products</h3><span>Actual output in KG</span></div>
            {form.items.map((item,idx)=><div key={idx} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(140px,.7fr) 40px',gap:8,alignItems:'center',marginBottom:8}}>
              <select required value={item.product_id} onChange={e=>updateItem(idx,'product_id',e.target.value)}>
                <option value="">Select product</option>
                {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input required type="number" min="0.01" step="0.01" placeholder="Produced KG" value={item.qty_kg} onChange={e=>updateItem(idx,'qty_kg',e.target.value)}/>
              <button type="button" className="icon-btn danger" disabled={form.items.length===1} onClick={()=>setForm({...form,items:form.items.filter((_,i)=>i!==idx)})}><Trash2 size={16}/></button>
            </div>)}
            <button type="button" className="secondary small" onClick={()=>setForm({...form,items:[...form.items,blankItem()]})}><Plus size={16}/> Add Product</button>
          </div>

          <label style={{marginTop:16}}>Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
          <div className="actions"><button className="primary">Save Production</button></div>
        </form>
      </Card>

      <Card>
        <h3>Recent Production</h3>
        {rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Wheat Used</th><th>Produced</th></tr></thead><tbody>
          {rows.slice(0,15).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td>{num(r.wheat_consumed)} KG</td><td>{r.items?.length?r.items.map(i=><div key={i.id}>{i.product_name}: <strong>{num(i.qty_kg)} KG</strong></div>):'—'}</td></tr>)}
        </tbody></table></div>:<Empty/>}
      </Card>
    </div>
  </>;
}
