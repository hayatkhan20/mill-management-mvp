import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';

export default function Products(){
  const {t}=useUiPreferences();
  const [rows,setRows]=useState([]),[name,setName]=useState(''),[editingId,setEditingId]=useState(null);
  const [error,setError]=useState(''),[success,setSuccess]=useState('');

  const load=()=>api.get('/products?all=1').then(setRows).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);

  const submit=async e=>{
    e.preventDefault();setError('');setSuccess('');
    try{
      if(editingId){
        const product=await api.post(`/products/${editingId}/update`,{name});
        setSuccess(`${product.name} updated.`);
      }else{
        const product=await api.post('/products',{name});
        setSuccess(`${product.name} added.`);
      }
      setName('');setEditingId(null);load();
    }catch(e){setError(e.message)}
  };

  const edit=product=>{
    setEditingId(product.id);
    setName(product.name);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const cancelEdit=()=>{
    setEditingId(null);
    setName('');
  };

  const toggle=async product=>{
    setError('');setSuccess('');
    try{
      const updated=await api.post(`/products/${product.id}/toggle`,{});
      setSuccess(`${updated.name} ${updated.is_active?'activated':'deactivated'}.`);load();
    }catch(e){setError(e.message)}
  };

  const remove=async product=>{
    setError('');setSuccess('');
    if(!window.confirm(`Delete "${product.name}"? This is only allowed if it has never been used in any records.`)) return;
    try{
      await api.post(`/products/${product.id}/delete`,{});
      if(editingId===product.id) cancelEdit();
      setSuccess(`${product.name} deleted.`);
      load();
    }catch(e){setError(e.message)}
  };

  const finished=rows.filter(p=>!['Wheat','Bardana'].includes(p.name));

  return <>
    <PageHeader title={t('products','Products')}/>
    <ErrorBox error={error}/><SuccessBox text={success}/>
    <div className="two-col products-layout">
      <Card>
        <h3>{editingId?'Edit Product':t('addProduct','Add Product')}</h3>
        <form onSubmit={submit} className="form-grid">
          <label className="span-2">{t('product','Product')}
            <input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Bran"/>
          </label>
          <div className="span-2">
            <button className="primary">{editingId?'Save Changes':t('addProduct','Add Product')}</button>
            {editingId&&<> <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button></>}
          </div>
        </form>
      </Card>

      <Card>
        <h3>{t('products','Products')}</h3>
        {finished.length?<div className="table-wrap"><table>
          <thead><tr><th>{t('product','Product')}</th><th>{t('status','Status')}</th><th>Actions</th></tr></thead>
          <tbody>
            {finished.map(p=><tr key={p.id}>
              <td><strong>{p.name}</strong></td>
              <td>{p.is_active?t('active','Active'):t('inactive','Inactive')}</td>
              <td>
                <div className="table-actions">
                  <button className="secondary small" onClick={()=>edit(p)}>Edit</button>
                  <button className="secondary small" onClick={()=>toggle(p)}>{p.is_active?'Deactivate':'Activate'}</button>
                  <button className="danger-btn small" onClick={()=>remove(p)}>Delete</button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table></div>:<Empty/>}
      </Card>
    </div>
  </>;
}
