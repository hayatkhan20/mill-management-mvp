import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, Empty, ErrorBox, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blankItem=(id)=>({product_id:id,bags_20:'',bags_40:'',loose_kg:''});
const totalKg=item=>(Number(item?.bags_20||0)*20)+(Number(item?.bags_40||0)*40)+Number(item?.loose_kg||0);

export default function Production(){
  const {t}=useUiPreferences();
  const [form,setForm]=useState({date:today(),wheat_consumed:'',remarks:'',items:[]});
  const [products,setProducts]=useState([]),[rows,setRows]=useState([]),[editingId,setEditingId]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState('');

  const load=async()=>{
    try{
      const [production,productRows]=await Promise.all([api.get('/production'),api.get('/products')]);
      const active=productRows.filter(p=>!['Wheat','Bardana'].includes(p.name));
      setRows(production);setProducts(active);
      setForm(prev=>({...prev,items:active.map(p=>prev.items.find(i=>String(i.product_id)===String(p.id))||blankItem(p.id))}));
    }catch(e){setError(e.message)}
  };
  useEffect(()=>{load()},[]);

  const update=(productId,field,value)=>setForm(prev=>({...prev,items:prev.items.map(i=>String(i.product_id)===String(productId)?{...i,[field]:value}:i)}));
  const reset=()=>setForm({date:today(),wheat_consumed:'',remarks:'',items:products.map(p=>blankItem(p.id))});

  const submit=async e=>{
    e.preventDefault();setError('');setSuccess('');
    try{
      const result=await api.post(editingId?`/production/${editingId}/update`:'/production',form);
      const wasEdit=!!editingId;setEditingId(null);reset();
      setSuccess(result?.warning || (wasEdit?'Production record updated.':'Production record saved and stock updated.'));
      setRows(await api.get('/production'));
    }catch(e){setError(e.message)}
  };

  return <>
    <Card>
      <h3>{t('newProductionEntry','New Production Entry')}</h3>
      <ErrorBox error={error}/><SuccessBox text={success}/>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>{t('date','Date')} (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
          <label>{t('wheatUsed','Wheat Used / Ground')} (KG)<input type="number" min="0" step="0.01" value={form.wheat_consumed} onChange={e=>setForm({...form,wheat_consumed:e.target.value})}/></label>
        </div>

        <div className="production-products-section">
          <div className="section-title"><h3>{t('producedProducts','Produced Products')}</h3></div>
          <div className="table-wrap"><table className="production-entry-table"><thead><tr><th>Product</th><th>20 KG Bags</th><th>40 KG Bags</th><th>Loose KG</th><th>Total KG</th></tr></thead><tbody>
            {products.map(product=>{
              const item=form.items.find(i=>String(i.product_id)===String(product.id))||blankItem(product.id);
              return <tr key={product.id}><td><strong>{product.name}</strong></td>
                <td><input type="number" min="0" step="1" value={item.bags_20} onChange={e=>update(product.id,'bags_20',e.target.value)}/></td>
                <td><input type="number" min="0" step="1" value={item.bags_40} onChange={e=>update(product.id,'bags_40',e.target.value)}/></td>
                <td><input type="number" min="0" step="0.01" value={item.loose_kg} onChange={e=>update(product.id,'loose_kg',e.target.value)}/></td>
                <td><strong>{num(totalKg(item))} KG</strong></td>
              </tr>;
            })}
          </tbody></table></div>
        </div>

        <label style={{marginTop:16}}>{t('remarks','Remarks')}<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
        <div className="actions">{editingId&&<button type="button" className="secondary" onClick={()=>{setEditingId(null);reset()}}>Cancel Edit</button>}<button className="primary">{editingId?'Save Changes':t('saveProduction','Save Production')}</button></div>
      </form>
    </Card>

    <Card className="section-card-below">
      <h3>{t('recentProduction','Recent Production')}</h3>
      {rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Wheat Used</th><th>Production</th><th></th></tr></thead><tbody>
        {rows.slice(0,20).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td>{num(r.wheat_consumed)} KG</td><td>{r.items?.length?r.items.map(i=><div key={i.id}>{i.product_name}: <strong>{num(i.qty_kg)} KG</strong> <small>{num(i.bags_20)}×20KG + {num(i.bags_40)}×40KG + {num(i.loose_kg)} loose</small></div>):'—'}</td><td><button className="link-btn" onClick={()=>{
          setEditingId(r.id);
          setForm({date:r.date,wheat_consumed:r.wheat_consumed,remarks:r.remarks||'',items:products.map(p=>{const x=r.items?.find(i=>String(i.product_id)===String(p.id));return x?{product_id:p.id,bags_20:x.bags_20||'',bags_40:x.bags_40||'',loose_kg:x.loose_kg||''}:blankItem(p.id)})});
          window.scrollTo({top:0,behavior:'smooth'});
        }}>Edit</button></td></tr>)}
      </tbody></table></div>:<Empty/>}
    </Card>
  </>;
}
