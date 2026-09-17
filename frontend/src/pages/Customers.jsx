import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, today } from '../utils';

export default function Customers(){
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [search,setSearch]=useState('');
 const [newCustomer,setNewCustomer]=useState({name:'',phone:'',address:''}); const [payment,setPayment]=useState({date:today(),amount:'',note:''});
 const load=()=>api.get('/customers').then(setRows).catch(e=>setError(e.message)); useEffect(() => { load(); }, []);
 const add=async e=>{e.preventDefault();setError('');try{await api.post('/customers',newCustomer);setNewCustomer({name:'',phone:'',address:''});setSuccess('Customer added.');load();}catch(e){setError(e.message)}};
 const open=async id=>{try{setSelected(await api.get(`/customers/${id}`));setPayment({date:today(),amount:'',note:''});}catch(e){setError(e.message)}};
 const pay=async e=>{e.preventDefault();setError('');try{await api.post('/payments',{customer_id:selected.id,...payment});setSuccess('Payment received and customer balance updated.');await open(selected.id);load();}catch(e){setError(e.message)}};

 const filteredRows=rows.filter(r=>{
  const q=search.trim().toLowerCase();
  if(!q) return true;
  return [r.name,r.phone,r.address].some(value=>String(value||'').toLowerCase().includes(q));
 });

 return <><PageHeader title="Customers" text="Customer balance = all unpaid bill amounts minus later payments."/><ErrorBox error={error}/><SuccessBox text={success}/>
 <div className="two-col customers-layout"><Card><h3>Add Customer</h3><form className="form-grid" onSubmit={add}><label className="span-2">Name<input required value={newCustomer.name} onChange={e=>setNewCustomer({...newCustomer,name:e.target.value})}/></label><label>Phone<input value={newCustomer.phone} onChange={e=>setNewCustomer({...newCustomer,phone:e.target.value})}/></label><label>Address<input value={newCustomer.address} onChange={e=>setNewCustomer({...newCustomer,address:e.target.value})}/></label><div className="span-2"><button className="primary">Add Customer</button></div></form></Card>
 <Card><h3>Customer Accounts</h3><input aria-label="Search customers" placeholder="Search by name, phone or address" value={search} onChange={e=>setSearch(e.target.value)}/>{filteredRows.length?<div className="table-wrap"><table><thead><tr><th>Customer</th><th>Purchased</th><th>Paid</th><th>Pending</th></tr></thead><tbody>{filteredRows.map(r=><tr className="clickable" key={r.id} onClick={()=>open(r.id)}><td><strong>{r.name}</strong><small>{r.phone}</small></td><td>{money(r.total_purchased)}</td><td>{money(r.total_paid)}</td><td className={r.balance>0?'pending':''}>{money(r.balance)}</td></tr>)}</tbody></table></div>:<Empty/>}</Card></div>
 {selected&&<div className="modal"><div className="customer-modal"><div className="modal-actions"><button className="secondary" onClick={()=>setSelected(null)}>Close</button></div><h2>{selected.name}</h2><p>{selected.phone} {selected.address&&`• ${selected.address}`}</p><div className="stats-grid mini"><Card><div className="stat-label">Total Purchased</div><div className="stat-value">{money(selected.total_purchased)}</div></Card><Card><div className="stat-label">Total Paid</div><div className="stat-value">{money(selected.total_paid)}</div></Card><Card><div className="stat-label">Current Pending</div><div className="stat-value">{money(selected.balance)}</div></Card></div>
 <div className="quantities">{selected.quantities.map(q=><span key={q.product}>{q.product}: <strong>{num(q.kg)} KG</strong></span>)}</div>
 {selected.balance>0&&<Card><h3>Receive Payment</h3><form className="form-inline" onSubmit={pay}><input type="date" value={payment.date} onChange={e=>setPayment({...payment,date:e.target.value})}/><input required type="number" min="0.01" max={selected.balance} step="0.01" placeholder="Amount" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/><input placeholder="Note (optional)" value={payment.note} onChange={e=>setPayment({...payment,note:e.target.value})}/><button className="primary">Receive</button></form></Card>}
 <Card><h3>Ledger</h3>{selected.ledger.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Reference</th><th>Purchase</th><th>Payment</th><th>Balance</th></tr></thead><tbody>{selected.ledger.map((e,i)=><tr key={`${e.type}-${e.id}-${i}`}><td>{e.date}</td><td>{e.reference}</td><td>{e.type==='sale'?money(e.debit):'—'}</td><td>{money(e.credit)}</td><td>{money(e.balance)}</td></tr>)}</tbody></table></div>:<Empty/>}</Card></div></div>}</>;
}
