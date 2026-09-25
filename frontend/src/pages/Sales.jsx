import { useEffect, useMemo, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, Empty, ErrorBox, SuccessBox } from '../components/Common';
import { money, num, printNamed, today } from '../utils';
import { MessageCircle, Plus, Printer, Search, Trash2, UserPlus } from 'lucide-react';
import DateField, { formatDateDMY } from '../components/DateField';

const blankItem=()=>({product_id:'',bag_size:'20',custom_bag_size:'',bags:'',total_kg:'',rate:''});
const blankCustomer=()=>({name:'',phone:'',address:''});
const balanceLabel=(balance)=>Number(balance)<0?`Advance ${money(Math.abs(balance))}`:`Pending ${money(balance)}`;

export default function Sales(){
 const {t}=useUiPreferences();
 const [customers,setCustomers]=useState([]),[products,setProducts]=useState([]),[bill,setBill]=useState('');
 const [customerId,setCustomerId]=useState(''),[customerQuery,setCustomerQuery]=useState(''),[customerOpen,setCustomerOpen]=useState(false);
 const [date,setDate]=useState(today()),[received,setReceived]=useState(''),[remarks,setRemarks]=useState(''),[items,setItems]=useState([blankItem()]);
 const [error,setError]=useState(''),[success,setSuccess]=useState(''),[printSale,setPrintSale]=useState(null),[editSaleId,setEditSaleId]=useState(null);
 const [showAddCustomer,setShowAddCustomer]=useState(false),[newCustomer,setNewCustomer]=useState(blankCustomer());
 const [historyDate,setHistoryDate]=useState(today()),[historyRows,setHistoryRows]=useState([]);

 const loadBase=async()=>{try{const [c,p,b]=await Promise.all([api.get('/customers'),api.get('/products'),api.get('/sales/next-bill')]);setCustomers(c);setProducts(p);if(!editSaleId)setBill(b.bill_no);}catch(e){setError(e.message)}};
 const loadHistory=async(value=historyDate)=>{try{setHistoryRows(await api.get(value?`/sales?date=${value}`:'/sales'));}catch(e){setError(e.message)}};
 useEffect(()=>{loadBase();loadHistory(today())},[]);

 const productOf=(item)=>products.find(p=>String(p.id)===String(item.product_id));
 const isBardana=(item)=>productOf(item)?.name==='Bardana';
 const effectiveBagSize=(item)=>item.bag_size==='custom'?Number(item.custom_bag_size||0):Number(item.bag_size||0);
 const itemAmount=(item)=>Number(item.bags||0)*Number(item.rate||0);
 const total=useMemo(()=>items.reduce((sum,i)=>sum+itemAmount(i),0),[items,products]);
 const historySummary=useMemo(()=>({
   total:historyRows.reduce((s,r)=>s+Number(r.total_amount||0),0),
   received:historyRows.reduce((s,r)=>s+Number(r.received_amount||0),0),
   pending:historyRows.reduce((s,r)=>s+Number(r.pending_amount||0),0),
   bills:historyRows.length
 }),[historyRows]);
 const selectedCustomer=customers.find(c=>String(c.id)===String(customerId));
 const filteredCustomers=useMemo(()=>{
   const q=customerQuery.trim().toLowerCase();
   if(!q) return customers.slice(0,10);
   return customers.filter(c=>`${c.name} ${c.phone||''}`.toLowerCase().includes(q)).slice(0,10);
 },[customers,customerQuery]);

 const chooseCustomer=(customer)=>{setCustomerId(String(customer.id));setCustomerQuery(customer.name);setCustomerOpen(false)};
 const updateItem=(idx,key,value)=>setItems(prev=>prev.map((it,i)=>{
   if(i!==idx)return it;
   let next={...it,[key]:value};
   if(key==='product_id') next={...blankItem(),product_id:value};
   if(isBardana(next)){
     next.bag_size='0';
     next.custom_bag_size='';
     next.total_kg='';
   }else{
     const kgPerBag=effectiveBagSize(next);
     next.total_kg=(kgPerBag>0&&Number(next.bags||0)>0)?kgPerBag*Number(next.bags||0):'';
   }
   return next;
 }));

 const resetSale=async()=>{
   setEditSaleId(null);setCustomerId('');setCustomerQuery('');setDate(today());setReceived('');setRemarks('');setItems([blankItem()]);
   const b=await api.get('/sales/next-bill');setBill(b.bill_no);
 };
 const addCustomer=async e=>{
   e.preventDefault();setError('');setSuccess('');
   try{
     const created=await api.post('/customers',newCustomer);
     const refreshed=await api.get('/customers');setCustomers(refreshed);chooseCustomer({...created,balance:0});
     setNewCustomer(blankCustomer());setShowAddCustomer(false);setSuccess(`${created.name} added and selected.`);
   }catch(e){setError(e.message)}
 };
 const submit=async e=>{
   e.preventDefault();setError('');setSuccess('');
   if(!customerId){setError('Please select a customer.');return;}
   try{
     const payload={bill_no:bill,date,customer_id:customerId,received_amount:received||0,remarks,items};
     const result=await api.post(editSaleId?`/sales/${editSaleId}/update`:'/sales',payload);
     const detail=await api.get(`/sales/${result.id}`);setPrintSale(detail);
     setSuccess(editSaleId?'Sale updated.':'Sale saved.');
     const saleDate=date;await resetSale();await loadBase();if(!historyDate||historyDate===saleDate)await loadHistory(historyDate);
   }catch(e){setError(e.message)}
 };
 const openSale=async id=>{try{setPrintSale(await api.get(`/sales/${id}`));}catch(e){setError(e.message)}};
 const editSale=async id=>{
   try{
     const s=await api.get(`/sales/${id}`);
     setEditSaleId(s.id);setBill(s.bill_no);setDate(s.date);setCustomerId(String(s.customer_id));setCustomerQuery(s.customer_name);
     setReceived(s.received_amount);setRemarks(s.remarks||'');
     setItems(s.items.map(i=>{
       const isBardanaItem=i.product_name==='Bardana';
       const size=Number(i.bag_size||0);
       const preset=!isBardanaItem&&(size===20||size===40);
       return {product_id:String(i.product_id),bag_size:isBardanaItem?'0':(preset?String(size):'custom'),custom_bag_size:(!isBardanaItem&&!preset&&size>0)?String(size):'',bags:i.bags||'',total_kg:i.total_kg||'',rate:i.rate||''};
     }));
     window.scrollTo({top:0,behavior:'smooth'});
   }catch(e){setError(e.message)}
 };
 const applyHistoryDate=async next=>{setHistoryDate(next);await loadHistory(next)};
 const showAll=async()=>{setHistoryDate('');await loadHistory('')};

 return <>
 <Card><ErrorBox error={error}/><SuccessBox text={success}/><form onSubmit={submit}>
 <div className="form-grid sales-head">
   <label>{t('billNo','Bill No.')}<input value={bill} readOnly/></label>
   <label>{t('date','Date')} (DD/MM/YYYY)<DateField required value={date} onChange={setDate}/></label>
   <div className="span-2 customer-field">
     <span className="field-label">{t('customer','Customer')}</span>
     <div className="customer-picker-row">
       <div className="customer-search-wrap">
         <Search size={17} className="customer-search-icon"/>
         <input value={customerQuery} placeholder={t('search','Search customer by name or phone')} autoComplete="off" onFocus={()=>setCustomerOpen(true)} onChange={e=>{setCustomerQuery(e.target.value);setCustomerId('');setCustomerOpen(true)}} onBlur={()=>setTimeout(()=>setCustomerOpen(false),120)}/>
         {customerOpen&&<div className="customer-results">
           {filteredCustomers.length?filteredCustomers.map(c=><button type="button" className="customer-option" key={c.id} onMouseDown={e=>e.preventDefault()} onClick={()=>chooseCustomer(c)}>
             <span><strong>{c.name}</strong>{c.phone&&<small>{c.phone}</small>}</span>
             <span className={Number(c.balance)>0?'pending':Number(c.balance)<0?'advance':''}>{balanceLabel(c.balance)}</span>
           </button>):<div className="customer-no-result">No matching customer.</div>}
         </div>}
       </div>
       <button type="button" className="secondary add-customer-btn" onClick={()=>{setNewCustomer(blankCustomer());setShowAddCustomer(true)}}><UserPlus size={17}/> {t('addCustomer','Add Customer')}</button>
     </div>
     {selectedCustomer&&<small>Account: <strong className={Number(selectedCustomer.balance)<0?'advance':''}>{balanceLabel(selectedCustomer.balance)}</strong></small>}
   </div>
 </div>

 <div className="sale-items">
   <div className="sale-row sale-row-head"><span>{t('product','Product')}</span><span>KG per Bag</span><span>{t('bags','Bags')}</span><span>{t('totalKg','Total KG')}</span><span>Rate / Bag</span><span>{t('amount','Amount')}</span><span></span></div>
   {items.map((it,idx)=>{
     const bardana=isBardana(it);
     return <div className="sale-row" key={idx}>
       <select required value={it.product_id} onChange={e=>updateItem(idx,'product_id',e.target.value)}><option value="">Product</option>{products.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select>
       {bardana
         ? <input readOnly value="Count only"/>
         : <div className="bag-size-cell">
             <select required value={it.bag_size} onChange={e=>updateItem(idx,'bag_size',e.target.value)}>
               <option value="20">20 KG</option>
               <option value="40">40 KG</option>
               <option value="custom">Custom</option>
             </select>
             {it.bag_size==='custom'&&<input required type="number" min="0.01" step="0.01" placeholder="Custom KG" value={it.custom_bag_size} onChange={e=>updateItem(idx,'custom_bag_size',e.target.value)}/>}
           </div>}
       <input required type="number" min="1" step="1" value={it.bags} onChange={e=>updateItem(idx,'bags',e.target.value)}/>
       <input readOnly value={bardana?'—':(it.total_kg||'')} placeholder="0"/>
       <input required type="number" min="0.01" step="0.01" value={it.rate} onChange={e=>updateItem(idx,'rate',e.target.value)}/>
       <div className="amount-cell">{money(itemAmount(it))}</div>
       <button type="button" className="icon-btn danger" disabled={items.length===1} onClick={()=>setItems(items.filter((_,i)=>i!==idx))}><Trash2 size={16}/></button>
     </div>
   })}
   <button type="button" className="secondary small" onClick={()=>setItems([...items,blankItem()])}><Plus size={16}/> {t('addItem','Add Item')}</button>
 </div>

 <div className="sale-summary"><label>{t('remarks','Remarks')}<input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Optional"/></label><div><span>{t('total','Total')}</span><strong>{money(total)}</strong></div><label>{t('amountReceived','Amount Received')}<input type="number" min="0" max={total||undefined} step="0.01" value={received} onChange={e=>setReceived(e.target.value)}/></label><div><span>{t('pendingThisBill','Pending on this bill')}</span><strong>{money(Math.max(0,total-Number(received||0)))}</strong></div></div>
 <div className="actions">{editSaleId&&<button type="button" className="secondary" onClick={resetSale}>Cancel Edit</button>}<button className="primary">{editSaleId?'Save Changes':t('saveSale','Save Sale')}</button></div></form></Card>

 <Card className="section-card-below">
   <div className="history-toolbar"><h3>{t('salesHistory','Sales History')}</h3><div className="history-filter"><DateField value={historyDate} onChange={applyHistoryDate}/><button type="button" className="secondary" onClick={showAll}>{t('showAll','Show All')}</button></div></div>
   <div className="history-stats"><div><span>{t('totalSales','Total Sales')}</span><strong>{money(historySummary.total)}</strong></div><div><span>{t('received','Received')}</span><strong>{money(historySummary.received)}</strong></div><div><span>{t('pending','Pending')}</span><strong>{money(historySummary.pending)}</strong></div><div><span>{t('bills','Bills')}</span><strong>{historySummary.bills}</strong></div></div>
   {historyRows.length?<div className="table-wrap"><table><thead><tr><th>{t('billNo','Bill')}</th><th>{t('date','Date')}</th><th>{t('customer','Customer')}</th><th>{t('total','Total')}</th><th>{t('received','Received')}</th><th>{t('pending','Pending')}</th><th></th></tr></thead><tbody>{historyRows.map(s=><tr key={s.id}><td>{s.bill_no}</td><td>{formatDateDMY(s.date)}</td><td>{s.customer_name}</td><td>{money(s.total_amount)}</td><td>{money(s.received_amount)}</td><td>{money(s.pending_amount)}</td><td><button className="link-btn" onClick={()=>editSale(s.id)}>Edit</button><button className="link-btn" onClick={()=>openSale(s.id)}><Printer size={15}/> View / Print</button></td></tr>)}</tbody></table></div>:<Empty/>}
 </Card>

 {showAddCustomer&&<AddCustomerModal customer={newCustomer} setCustomer={setNewCustomer} onClose={()=>setShowAddCustomer(false)} onSave={addCustomer}/>}
 {printSale&&<Invoice sale={printSale} onClose={()=>setPrintSale(null)}/>}</>;
}

function AddCustomerModal({customer,setCustomer,onClose,onSave}){
 return <div className="modal"><div className="add-customer-modal"><div className="modal-title-row"><div><h2>Add Customer</h2></div><button type="button" className="secondary" onClick={onClose}>Cancel</button></div><form className="form-grid" onSubmit={onSave}><label className="span-2">Name<input required autoFocus value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/></label><label>Phone<input value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/></label><label>Address<input value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/></label><div className="span-2 actions"><button className="primary"><UserPlus size={17}/> Save Customer</button></div></form></div></div>;
}

export function Invoice({sale,onClose}){
 const print=()=>printNamed(`${sale.customer_name}-${formatDateDMY(sale.date).replaceAll('/','-')}-${sale.bill_no}`);

 const shareWhatsApp=async()=>{
   const itemLines=(sale.items||[]).map(i=>{
     const bardana=i.product_name==='Bardana';
     const qty=bardana?`${num(i.bags)} bags`:`${num(i.bags)} x ${num(i.bag_size)} KG`;
     return `- ${i.product_name}: ${qty} - ${money(i.amount)}`;
   }).join('\n');

   const message=[
     'FLOUR MILL - Sales Bill',
     `Bill: ${sale.bill_no}`,
     `Date: ${formatDateDMY(sale.date)}`,
     `Customer: ${sale.customer_name}`,
     '',
     itemLines,
     '',
     `Total: ${money(sale.total_amount)}`,
     `Received: ${money(sale.received_amount)}`,
     `Pending: ${money(sale.pending_amount)}`
   ].filter(Boolean).join('\n');

   await navigator.clipboard.writeText(message);
   window.open('https://web.whatsapp.com/','_blank','noopener,noreferrer');
 };

 return <div className="modal"><div className="invoice-modal"><div className="no-print modal-actions"><button className="secondary" onClick={onClose}>Close</button><button className="secondary" onClick={shareWhatsApp}><MessageCircle size={16}/> Copy & Open WhatsApp</button><button className="primary" onClick={print}><Printer size={16}/> Print Bill</button></div><div className="invoice"><div className="invoice-head"><div><h2>FLOUR MILL</h2><p>Sales Bill</p></div><div className="invoice-meta"><strong>{sale.bill_no}</strong><span>{formatDateDMY(sale.date)}</span></div></div><div className="bill-to"><span>Customer</span><strong>{sale.customer_name}</strong>{sale.phone&&<small>{sale.phone}</small>}</div><table><thead><tr><th>Product</th><th>Unit</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{sale.items.map(i=>{const bardana=i.product_name==='Bardana';return <tr key={i.id}><td>{i.product_name}</td><td>{bardana?'Count':`${num(i.bag_size)} KG / Bag`}</td><td>{num(i.bags)} {bardana?'Bags':'Bags'}</td><td>{money(i.rate)}</td><td>{money(i.amount)}</td></tr>})}</tbody></table><div className="invoice-totals"><p><span>Total</span><strong>{money(sale.total_amount)}</strong></p><p><span>Received</span><strong>{money(sale.received_amount)}</strong></p><p><span>Pending</span><strong>{money(sale.pending_amount)}</strong></p></div><div className="invoice-foot">Thank you</div></div></div></div>
}
