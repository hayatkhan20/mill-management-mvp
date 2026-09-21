import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const initial=()=>({date:today(),wheat_consumed:'',remarks:'',items:[]});

export default function Production(){
  const [form,setForm]=useState(initial()),[products,setProducts]=useState([]),[rows,setRows]=useState([]),[error,setError]=useState(''),[success,setSuccess]=useState('');

  const load=async()=>{
    try{
      const [production,productRows]=await Promise.all([api.get('/production'),api.get('/products')]);
      const activeProducts=productRows.filter(p=>p.name!=='Wheat');
      setRows(production);
      setProducts(activeProducts);
      setForm(prev=>({
        ...prev,
        items:activeProducts.map(p=>{
          const old=prev.items.find(i=>String(i.product_id)===String(p.id));
          return {product_id:p.id,qty_kg:old?.qty_kg||''};
        })
      }));
    }catch(e){setError(e.message)}
  };

  useEffect(()=>{load()},[]);

  const updateQty=(productId,value)=>setForm(prev=>({
    ...prev,
    items:prev.items.map(item=>String(item.product_id)===String(productId)?{...item,qty_kg:value}:item)
  }));

  const submit=async e=>{
    e.preventDefault();setError('');setSuccess('');
    try{
      await api.post('/production',form);
      setForm({
        date:today(),
        wheat_consumed:'',
        remarks:'',
        items:products.map(p=>({product_id:p.id,qty_kg:''}))
      });
      setSuccess('Production record saved and stock updated.');
      const production=await api.get('/production');
      setRows(production);
    }catch(e){setError(e.message)}
  };

  return <>
    <PageHeader title="Production Record"/>
    
    <Card>
      <h3>New Production Entry</h3>
      <ErrorBox error={error}/><SuccessBox text={success}/>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
          <label>Wheat Used / Ground (KG)<input type="number" min="0" step="0.01" value={form.wheat_consumed} onChange={e=>setForm({...form,wheat_consumed:e.target.value})}/></label>
        </div>

        <div className="production-products-section">
          <div className="section-title"><h3>Produced Products</h3><span>Optional — enter KG only where applicable</span></div>
          <div className="production-products-grid">
            {products.map(product=>{
              const item=form.items.find(i=>String(i.product_id)===String(product.id));
              return <label key={product.id}>{product.name}
                <input type="number" min="0" step="0.01" placeholder="Produced KG" value={item?.qty_kg||''} onChange={e=>updateQty(product.id,e.target.value)}/>
              </label>;
            })}
          </div>
        </div>

        <label style={{marginTop:16}}>Remarks<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
        <div className="actions"><button className="primary">Save Production</button></div>
      </form>
    </Card>

    <Card className="section-card-below">
      <h3>Recent Production</h3>
      {rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Wheat Used</th><th>Produced</th></tr></thead><tbody>
        {rows.slice(0,15).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td>{num(r.wheat_consumed)} KG</td><td>{r.items?.length?r.items.map(i=><div key={i.id}>{i.product_name}: <strong>{num(i.qty_kg)} KG</strong></div>):'—'}</td></tr>)}
      </tbody></table></div>:<Empty/>}
    </Card>
  </>;
}
