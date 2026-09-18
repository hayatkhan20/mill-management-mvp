import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const balanceText=(value)=>Number(value)<0?`Advance ${money(Math.abs(value))}`:`${money(value)}`;

export default function Customers(){
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [search,setSearch]=useState('');
 const [editing,setEditing]=useState(false);
 const [editCustomer,setEditCustomer]=useState({name:'',phone:'',address:''});
 const [newCustomer,setNewCustomer]=useState({name:'',phone:'',address:''});
 const [payment,setPayment]=useState({date:today(),amount:'',note:''});

 const load=()=>api.get('/customers').then(setRows).catch(e=>setError(e.message));
 useEffect(() => { load(); }, []);

 const add=async e=>{e.preventDefault();setError('');try{await api.post('/customers',newCustomer);setNewCustomer({name:'',phone:'',address:''});setSuccess('Customer added.');load();}catch(e){setError(e.message)}};
 const open=async id=>{try{const customer=await api.get(`/customers/${id}`);setSelected(customer);setEditCustomer({name:customer.name||'',phone:customer.phone||'',address:customer.address||''});setEditing(false);setPayment({date:today(),amount:'',note:''});}catch(e){setError(e.message)}};
 const saveCustomer=async e=>{e.preventDefault();setError('');try{await api.post(`/customers/${selected.id}/update`,editCustomer);const customer=await api.get(`/customers/${selected.id}`);setSelected(customer);setEditCustomer({name:customer.name||'',phone:customer.phone||'',address:customer.address||''});setEditing(false);setSuccess('Customer details updated.');load();}catch(e){setError(e.message)}};
 const pay=async e=>{e.preventDefault();setError('');try{await api.post('/payments',{customer_id:selected.id,...payment});setSuccess('Payment received. Any excess is kept as customer advance.');await open(selected.id);load();}catch(e){setError(e.message)}};

 const filteredRows=rows.filter(r=>{const q=search.trim().toLowerCase();if(!q)return true;return [r.name,r.phone,r.address].some(value=>String(value||'').toLowerCase().includes(q))});

 return <>
  <PageHeader title="Customers" text="Payments can be received against pending bills or kept as customer advance."/>
  <ErrorBox error={error}/><SuccessBox text={success}/>
  <div className="two-col customers-layout">
   <Card><h3>Add Customer</h3><form className="form-grid" onSubmit={add}><label className="span-2">Name<input required value={newCustomer.name} onChange={e=>setNewCustomer({...newCustomer,name:e.target.value})}/></label><label>Phone<input value={newCustomer.phone} onChange={e=>setNewCustomer({...newCustomer,phone:e.target.value})}/></label><label>Address<input value={newCustomer.address} onChange={e=>setNewCustomer({...newCustomer,address:e.target.value})}/></label><div className="span-2"><button className="primary">Add Customer</button></div></form></Card>
   <Card><h3>Customer Accounts</h3><input aria-label="Search customers" placeholder="Search by name, phone or address" value={search} onChange={e=>setSearch(e.target.value)}/>{filteredRows.length?<div className="table-wrap"><table><thead><tr><th>Customer</th><th>Purchased</th><th>Paid</th><th>Balance</th></tr></thead><tbody>{filteredRows.map(r=><tr className="clickable" key={r.id} onClick={()=>open(r.id)}><td><strong>{r.name}</strong><small>{r.phone}</small></td><td>{money(r.total_purchased)}</td><td>{money(r.total_paid)}</td><td className={r.balance>0?'pending':r.balance<0?'advance':''}>{balanceText(r.balance)}</td></tr>)}</tbody></table></div>:<Empty/>}</Card>
  </div>

  {selected&&<div className="modal"><div className="customer-modal">
   <div className="modal-actions">{!editing&&<button className="secondary" onClick={()=>setEditing(true)}>Edit Customer</button>}<button className="primary" onClick={()=>window.print()}>Print Statement / PDF</button><button className="secondary" onClick={()=>{setSelected(null);setEditing(false)}}>Close</button></div>
   {!editing?<><h2>{selected.name}</h2><p>{selected.phone} {selected.address&&`• ${selected.address}`}</p></>:<Card><h3>Edit Customer Details</h3><form className="form-grid" onSubmit={saveCustomer}><label className="span-2">Name<input required value={editCustomer.name} onChange={e=>setEditCustomer({...editCustomer,name:e.target.value})}/></label><label>Phone<input value={editCustomer.phone} onChange={e=>setEditCustomer({...editCustomer,phone:e.target.value})}/></label><label>Address<input value={editCustomer.address} onChange={e=>setEditCustomer({...editCustomer,address:e.target.value})}/></label><div className="span-2"><button className="primary" type="submit">Save Changes</button>{' '}<button className="secondary" type="button" onClick={()=>{setEditCustomer({name:selected.name||'',phone:selected.phone||'',address:selected.address||''});setEditing(false)}}>Cancel</button></div></form></Card>}

   <div className="stats-grid mini">
    <Card><div className="stat-label">Total Purchased</div><div className="stat-value">{money(selected.total_purchased)}</div></Card>
    <Card><div className="stat-label">Total Paid</div><div className="stat-value">{money(selected.total_paid)}</div></Card>
    <Card><div className="stat-label">{selected.balance<0?'Current Advance':'Current Pending'}</div><div className={`stat-value ${selected.balance<0?'advance':''}`}>{money(Math.abs(selected.balance))}</div></Card>
   </div>

   <div className="quantities">{selected.quantities.map(q=><span key={q.product}>{q.product}: <strong>{num(q.kg)} KG</strong></span>)}</div>

   <Card><h3>Receive Payment / Advance</h3><form className="form-inline" onSubmit={pay}><DateField required value={payment.date} onChange={date=>setPayment({...payment,date})}/><input required type="number" min="0.01" step="0.01" placeholder="Amount" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/><input placeholder="Note (optional)" value={payment.note} onChange={e=>setPayment({...payment,note:e.target.value})}/><button className="primary">Receive</button></form><small>If payment is greater than pending, the extra amount becomes customer advance.</small></Card>

   <Card><h3>Ledger</h3>{selected.ledger.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Reference</th><th>Purchase</th><th>Payment</th><th>Balance</th></tr></thead><tbody>{selected.ledger.map((e,i)=><tr key={`${e.type}-${e.id}-${i}`}><td>{formatDateDMY(e.date)}</td><td>{e.reference}</td><td>{e.type==='sale'?money(e.debit):'—'}</td><td>{money(e.credit)}</td><td className={e.balance<0?'advance':''}>{e.balance<0?`Advance ${money(Math.abs(e.balance))}`:money(e.balance)}</td></tr>)}</tbody></table></div>:<Empty/>}</Card>
  </div></div>}
 </>;
}
