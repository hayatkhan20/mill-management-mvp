import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';

export default function Products(){
  const [rows,setRows]=useState([]),[name,setName]=useState(''),[error,setError]=useState(''),[success,setSuccess]=useState('');
  const load=()=>api.get('/products?all=1').then(setRows).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);

  const add=async e=>{
    e.preventDefault();setError('');setSuccess('');
    try{
      const product=await api.post('/products',{name});
      setName('');setSuccess(`${product.name} added.`);load();
    }catch(e){setError(e.message)}
  };

  const toggle=async product=>{
    setError('');setSuccess('');
    try{
      const updated=await api.post(`/products/${product.id}/toggle`,{});
      setSuccess(`${updated.name} ${updated.is_active?'activated':'deactivated'}.`);load();
    }catch(e){setError(e.message)}
  };

  const finished=rows.filter(p=>p.name!=='Wheat');
  return <>
    <PageHeader title="Products" text="Manage the finished-product types used in production and billing."/>
    <ErrorBox error={error}/><SuccessBox text={success}/>
    <div className="two-col products-layout">
      <Card>
        <h3>Add Product Type</h3>
        <form onSubmit={add} className="form-grid">
          <label className="span-2">Product Name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Bran"/></label>
          <div className="span-2"><button className="primary">Add Product</button></div>
        </form>
      </Card>
      <Card>
        <h3>Product Types</h3>
        {finished.length?<div className="table-wrap"><table><thead><tr><th>Product</th><th>Status</th><th></th></tr></thead><tbody>
          {finished.map(p=><tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.is_active?'Active':'Inactive'}</td><td><button className="secondary small" onClick={()=>toggle(p)}>{p.is_active?'Deactivate':'Activate'}</button></td></tr>)}
        </tbody></table></div>:<Empty/>}
      </Card>
    </div>
  </>;
}
