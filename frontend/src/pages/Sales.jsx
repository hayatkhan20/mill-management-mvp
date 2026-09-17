import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, today } from '../utils';
import { Plus, Printer, Search, Trash2, UserPlus } from 'lucide-react';

const blankItem=()=>({product_id:'',bag_size:'',bags:'',total_kg:'',rate:''});
const blankCustomer=()=>({name:'',phone:'',address:''});

export default function Sales(){
 const [customers,setCustomers]=useState([]), [products,setProducts]=useState([]), [sales,setSales]=useState([]), [bill,setBill]=useState('');
 const [customerId,setCustomerId]=useState(''), [customerQuery,setCustomerQuery]=useState(''), [customerOpen,setCustomerOpen]=useState(false);
 const [date,setDate]=useState(today()), [received,setReceived]=useState(''), [remarks,setRemarks]=useState(''), [items,setItems]=useState([blankItem()]);
 const [error,setError]=useState(''), [success,setSuccess]=useState(''), [printSale,setPrintSale]=useState(null);
 const [showAddCustomer,setShowAddCustomer]=useState(false), [newCustomer,setNewCustomer]=useState(blankCustomer());

 const load=async()=>{try{const [c,p,s,b]=await Promise.all([api.get('/customers'),api.get('/products'),api.get('/sales'),api.get('/sales/next-bill')]);setCustomers(c);setProducts(p.filter(x=>x.name!=='Wheat'));setSales(s);setBill(b.bill_no);}catch(e){setError(e.message)}};
 useEffect(()=>{load()},[]);

 const total=useMemo(()=>items.reduce((sum,i)=>sum+(Number(i.total_kg||0)*Number(i.rate||0)),0),[items]);
 const selectedCustomer=customers.find(c=>String(c.id)===String(customerId));
 const filteredCustomers=useMemo(()=>{
   const q=customerQuery.trim().toLowerCase();
   if(!q) return customers.slice(0,10);
   return customers.filter(c=>`${c.name} ${c.phone||''}`.toLowerCase().includes(q)).slice(0,10);
 },[customers,customerQuery]);

 const chooseCustomer=(customer)=>{
   setCustomerId(String(customer.id));
   setCustomerQuery(customer.name);
   setCustomerOpen(false);
 };

 const updateItem=(idx,key,value)=>setItems(prev=>prev.map((it,i)=>{if(i!==idx)return it;const next={...it,[key]:value};if(key==='bag_size'||key==='bags'){const kg=Number(next.bag_size||0)*Number(next.bags||0);if(kg>0)next.total_kg=kg;}return next;}));

 const addCustomer=async e=>{
   e.preventDefault();
   setError('');setSuccess('');
   try{
     const created=await api.post('/customers',newCustomer);
     const refreshed=await api.get('/customers');
     setCustomers(refreshed);
     chooseCustomer({...created,balance:0});
     setNewCustomer(blankCustomer());
     setShowAddCustomer(false);
     setSuccess(`${created.name} added and selected for this bill.`);
   }catch(e){setError(e.message)}
 };

 const submit=async e=>{
   e.preventDefault();setError('');setSuccess('');
   if(!customerId){setError('Please select a customer.');return;}
   try{const result=await api.post('/sales',{bill_no:bill,date,customer_id:customerId,received_amount:received||0,remarks,items});const detail=await api.get(`/sales/${result.id}`);setPrintSale(detail);setItems([blankItem()]);setReceived('');setRemarks('');setSuccess(`Sale saved. Customer total pending is now ${money(result.customer_balance)}.`);await load();}catch(e){setError(e.message)}
 };
 const openSale=async id=>{try{setPrintSale(await api.get(`/sales/${id}`));}catch(e){setError(e.message)}};

 return <><PageHeader title="Sales / Billing" text="Old pending does not block a new sale. Every unpaid amount is added to the customer's running balance."/>
 <Card><ErrorBox error={error}/><SuccessBox text={success}/><form onSubmit={submit}>
 <div className="form-grid sales-head">
   <label>Bill No.<input value={bill} readOnly/></label>
   <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
   <div className="span-2 customer-field">
     <span className="field-label">Customer</span>
     <div className="customer-picker-row">
       <div className="customer-search-wrap">
         <Search size={17} className="customer-search-icon"/>
         <input
           value={customerQuery}
           placeholder="Search customer by name or phone"
           autoComplete="off"
           onFocus={()=>setCustomerOpen(true)}
           onChange={e=>{setCustomerQuery(e.target.value);setCustomerId('');setCustomerOpen(true)}}
           onBlur={()=>setTimeout(()=>setCustomerOpen(false),120)}
         />
         {customerOpen&&<div className="customer-results">
           {filteredCustomers.length?filteredCustomers.map(c=><button type="button" className="customer-option" key={c.id} onMouseDown={e=>e.preventDefault()} onClick={()=>chooseCustomer(c)}>
             <span><strong>{c.name}</strong>{c.phone&&<small>{c.phone}</small>}</span>
             <span className={Number(c.balance)>0?'pending':''}>Pending {money(c.balance)}</span>
           </button>):<div className="customer-no-result">No matching customer.</div>}
         </div>}
       </div>
       <button type="button" className="secondary add-customer-btn" onClick={()=>{setNewCustomer(blankCustomer());setShowAddCustomer(true)}}><UserPlus size={17}/> Add Customer</button>
     </div>
     {selectedCustomer&&<small>Current old balance: <strong>{money(selectedCustomer.balance)}</strong></small>}
   </div>
 </div>
 <div className="sale-items"><div className="sale-row sale-row-head"><span>Product</span><span>Bag Size KG</span><span>Bags</span><span>Total KG</span><span>Rate / KG</span><span>Amount</span><span></span></div>
 {items.map((it,idx)=><div className="sale-row" key={idx}><select required value={it.product_id} onChange={e=>updateItem(idx,'product_id',e.target.value)}><option value="">Product</option>{products.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><input type="number" min="0" step="0.01" value={it.bag_size} onChange={e=>updateItem(idx,'bag_size',e.target.value)}/><input type="number" min="0" step="0.01" value={it.bags} onChange={e=>updateItem(idx,'bags',e.target.value)}/><input required type="number" min="0.01" step="0.01" value={it.total_kg} onChange={e=>updateItem(idx,'total_kg',e.target.value)}/><input required type="number" min="0" step="0.01" value={it.rate} onChange={e=>updateItem(idx,'rate',e.target.value)}/><div className="amount-cell">{money(Number(it.total_kg||0)*Number(it.rate||0))}</div><button type="button" className="icon-btn danger" disabled={items.length===1} onClick={()=>setItems(items.filter((_,i)=>i!==idx))}><Trash2 size={16}/></button></div>)}
 <button type="button" className="secondary small" onClick={()=>setItems([...items,blankItem()])}><Plus size={16}/> Add Item</button></div>
 <div className="sale-summary"><label>Remarks<input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional"/></label><div><span>Total Bill</span><strong>{money(total)}</strong></div><label>Amount Received<input type="number" min="0" max={total||undefined} step="0.01" value={received} onChange={e=>setReceived(e.target.value)}/></label><div><span>Pending on this bill</span><strong>{money(Math.max(0,total-Number(received||0)))}</strong></div></div>
 <div className="actions"><button className="primary">Save Sale</button></div></form></Card>
 <Card><h3>Recent Bills</h3>{sales.length?<div className="table-wrap"><table><thead><tr><th>Bill</th><th>Date</th><th>Customer</th><th>Total</th><th>Received</th><th>Pending</th><th></th></tr></thead><tbody>{sales.slice(0,20).map(s=><tr key={s.id}><td>{s.bill_no}</td><td>{s.date}</td><td>{s.customer_name}</td><td>{money(s.total_amount)}</td><td>{money(s.received_amount)}</td><td>{money(s.pending_amount)}</td><td><button className="link-btn" onClick={()=>openSale(s.id)}><Printer size={15}/> View / Print</button></td></tr>)}</tbody></table></div>:<Empty/>}</Card>
 {showAddCustomer&&<AddCustomerModal customer={newCustomer} setCustomer={setNewCustomer} onClose={()=>setShowAddCustomer(false)} onSave={addCustomer}/>} 
 {printSale&&<Invoice sale={printSale} onClose={()=>setPrintSale(null)}/>}</>;
}

function AddCustomerModal({customer,setCustomer,onClose,onSave}){
 return <div className="modal"><div className="add-customer-modal">
   <div className="modal-title-row"><div><h2>Add Customer</h2><p>Add the customer without leaving the bill.</p></div><button type="button" className="secondary" onClick={onClose}>Cancel</button></div>
   <form className="form-grid" onSubmit={onSave}>
     <label className="span-2">Name<input required autoFocus value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label>
     <label>Phone<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label>
     <label>Address<input value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label>
     <div className="span-2 actions"><button className="primary"><UserPlus size={17}/> Save Customer</button></div>
   </form>
 </div></div>;
}

function Invoice({sale,onClose}){return <div className="modal"><div className="invoice-modal"><div className="no-print modal-actions"><button className="secondary" onClick={onClose}>Close</button><button className="primary" onClick={()=>window.print()}><Printer size={16}/> Print Bill</button></div><div className="invoice" id="invoice"><div className="invoice-head"><div><h2>FLOUR MILL</h2><p>Sales Bill</p></div><div className="invoice-meta"><strong>{sale.bill_no}</strong><span>{sale.date}</span></div></div><div className="bill-to"><span>Customer</span><strong>{sale.customer_name}</strong>{sale.phone&&<small>{sale.phone}</small>}</div><table><thead><tr><th>Product</th><th>Bag Size</th><th>Bags</th><th>KG</th><th>Rate/KG</th><th>Amount</th></tr></thead><tbody>{sale.items.map(i=><tr key={i.id}><td>{i.product_name}</td><td>{num(i.bag_size)}</td><td>{num(i.bags)}</td><td>{num(i.total_kg)}</td><td>{money(i.rate)}</td><td>{money(i.amount)}</td></tr>)}</tbody></table><div className="invoice-totals"><p><span>Total</span><strong>{money(sale.total_amount)}</strong></p><p><span>Received</span><strong>{money(sale.received_amount)}</strong></p><p><span>Pending on this bill</span><strong>{money(sale.pending_amount)}</strong></p></div><div className="invoice-foot">Thank you</div></div></div></div>}
