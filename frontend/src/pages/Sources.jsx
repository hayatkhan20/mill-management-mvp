import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, printNamed, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blankSource=()=>({name:'',source_type:'Private',phone:'',address:''});
const balanceLabel=(value)=>{
 const n=Number(value||0);
 if(n>0.005) return `Payable ${money(n)}`;
 if(n<-0.005) return `Advance ${money(Math.abs(n))}`;
 return 'Settled';
};

export default function Sources(){
 const {t}=useUiPreferences();
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[search,setSearch]=useState('');
 const [newSource,setNewSource]=useState(blankSource()),[editing,setEditing]=useState(false),[editSource,setEditSource]=useState(blankSource());
 const [payment,setPayment]=useState({date:today(),amount:'',note:''}),[editingPaymentId,setEditingPaymentId]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState('');

 const load=()=>api.get('/sources').then(setRows).catch(e=>setError(e.message));
 useEffect(()=>{load()},[]);

 const add=async e=>{e.preventDefault();setError('');setSuccess('');try{await api.post('/sources',newSource);setNewSource(blankSource());setSuccess('Source added.');load()}catch(e){setError(e.message)}};
 const open=async id=>{try{const source=await api.get(`/sources/${id}`);setSelected(source);setEditSource({name:source.name||'',source_type:source.source_type||'Private',phone:source.phone||'',address:source.address||''});setEditing(false);setPayment({date:today(),amount:'',note:''})}catch(e){setError(e.message)}};
 const save=async e=>{e.preventDefault();setError('');setSuccess('');try{await api.post(`/sources/${selected.id}/update`,editSource);setSuccess('Source details updated.');await open(selected.id);load()}catch(e){setError(e.message)}};
 const pay=async e=>{e.preventDefault();setError('');setSuccess('');try{if(editingPaymentId)await api.post(`/source-payments/${editingPaymentId}/update`,payment);else await api.post('/source-payments',{source_id:selected.id,...payment});setSuccess(editingPaymentId?'Source payment updated.':'Source payment recorded.');setEditingPaymentId(null);setPayment({date:today(),amount:'',note:''});await open(selected.id);load()}catch(e){setError(e.message)}};
 const editPayment=e=>{setEditingPaymentId(e.id);setPayment({date:e.date,amount:e.credit,note:e.note||''})};

 const filtered=rows.filter(r=>{
  const q=search.trim().toLowerCase();
  if(!q) return true;
  return [r.name,r.source_type,r.phone,r.address].some(v=>String(v||'').toLowerCase().includes(q));
 });

 return <>
  <PageHeader title={t('sources','Sources')}/>
  <ErrorBox error={error}/><SuccessBox text={success}/>
  <div>
   <Card><h3>{t('addSource','Add Source')}</h3><form className="form-grid" onSubmit={add}>
    <label className="span-2">{t('name','Name')}<input required value={newSource.name} onChange={e=>setNewSource({...newSource,name:e.target.value})}/></label>
    <label>{t('type','Type')}<select value={newSource.source_type} onChange={e=>setNewSource({...newSource,source_type:e.target.value})}><option>Private</option><option>Government</option></select></label>
    <label>{t('phone','Phone')}<input value={newSource.phone} onChange={e=>setNewSource({...newSource,phone:e.target.value})}/></label>
    <label className="span-2">{t('address','Address')}<input value={newSource.address} onChange={e=>setNewSource({...newSource,address:e.target.value})}/></label>
    <div className="span-2"><button className="primary">{t('addSource','Add Source')}</button></div>
   </form></Card>

   <Card className="section-card-below"><h3>{t('sourceAccounts','Source Accounts')}</h3><input placeholder={t('searchSources','Search by name, type, phone or address')} value={search} onChange={e=>setSearch(e.target.value)}/>
    {filtered.length?<div className="table-wrap"><table><thead><tr><th>{t('source','Source')}</th><th>{t('purchased','Purchased')}</th><th>{t('paid','Paid')}</th><th>{t('balance','Balance')}</th></tr></thead><tbody>
     {filtered.map(r=><tr className="clickable" key={r.id} onClick={()=>open(r.id)}><td><strong>{r.name}</strong><small>{r.source_type}{r.phone?` • ${r.phone}`:''}</small></td><td>{money(r.total_purchased)}</td><td>{money(r.total_paid)}</td><td className={Number(r.balance)>0?'pending':''}>{balanceLabel(r.balance)}</td></tr>)}
    </tbody></table></div>:<Empty/>}
   </Card>
  </div>

  {selected&&<div className="modal"><div className="customer-modal">
   <div className="modal-actions">{!editing&&<button className="secondary" onClick={()=>setEditing(true)}>Edit Source</button>}<button className="primary" onClick={()=>printNamed(`${selected.name}-Source-Statement-${formatDateDMY(today()).replaceAll('/','-')}`)}>Print Statement / PDF</button><button className="secondary" onClick={()=>{setSelected(null);setEditing(false)}}>Close</button></div>
   {!editing?<><h2>{selected.name}</h2><p>{selected.source_type}{selected.phone?` • ${selected.phone}`:''}{selected.address?` • ${selected.address}`:''}</p></>:<Card><h3>Edit Source Details</h3><form className="form-grid" onSubmit={save}>
    <label className="span-2">Name<input required value={editSource.name} onChange={e=>setEditSource({...editSource,name:e.target.value})}/></label>
    <label>Type<select value={editSource.source_type} onChange={e=>setEditSource({...editSource,source_type:e.target.value})}><option>Private</option><option>Government</option></select></label>
    <label>Phone<input value={editSource.phone} onChange={e=>setEditSource({...editSource,phone:e.target.value})}/></label>
    <label className="span-2">Address<input value={editSource.address} onChange={e=>setEditSource({...editSource,address:e.target.value})}/></label>
    <div className="span-2"><button className="primary">Save Changes</button>{' '}<button type="button" className="secondary" onClick={()=>setEditing(false)}>Cancel</button></div>
   </form></Card>}

   <div className="stats-grid mini">
    <Card><div className="stat-label">Total Purchased</div><div className="stat-value">{money(selected.total_purchased)}</div></Card>
    <Card><div className="stat-label">Total Paid</div><div className="stat-value">{money(selected.total_paid)}</div></Card>
    <Card><div className="stat-label">Current Balance</div><div className="stat-value">{balanceLabel(selected.balance)}</div></Card>
   </div>
   <div className="quantities"><span>Wheat: <strong>{num(selected.wheat_kg)} KG</strong></span><span>Bardana received: <strong>{num(selected.bardana_bags)} Bags</strong></span></div>

   <Card><h3>{editingPaymentId?'Edit Source Payment':'Pay Source'}</h3><form className="form-inline" onSubmit={pay}>
    <DateField required value={payment.date} onChange={date=>setPayment({...payment,date})}/>
    <input required type="number" min="0.01" step="0.01" placeholder="Amount" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/>
    <input placeholder="Note (optional)" value={payment.note} onChange={e=>setPayment({...payment,note:e.target.value})}/>
    <button className="primary">{editingPaymentId?'Save':'Pay'}</button>
    {editingPaymentId&&<button type="button" className="secondary" onClick={()=>{setEditingPaymentId(null);setPayment({date:today(),amount:'',note:''})}}>Cancel</button>}
   </form></Card>

   <Card><h3>Ledger</h3>{selected.ledger.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Reference</th><th>Purchase</th><th>Payment</th><th>Balance</th></tr></thead><tbody>
    {selected.ledger.map((e,i)=><tr key={`${e.type}-${e.id}-${i}`}><td>{formatDateDMY(e.date)}</td><td>{e.reference}</td><td>{Number(e.debit)>0?money(e.debit):'—'}</td><td>{Number(e.credit)>0?money(e.credit):'—'}</td><td>{balanceLabel(e.balance)}{e.type==='payment'&&!e.payment_reference_type&&<button className="link-btn" onClick={()=>editPayment(e)}>Edit</button>}</td></tr>)}
   </tbody></table></div>:<Empty/>}</Card>
  </div></div>}
 </>;
}
