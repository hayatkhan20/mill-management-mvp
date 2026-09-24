import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const initial=()=>({date:today(),source_id:'',quantity:'',rate_per_bag:'',paid_amount:'',remarks:''});

export default function BardanaIn({showHistory=true,editRecord=null,onSaved}){
 const {t}=useUiPreferences();
 const [form,setForm]=useState(initial()),[sources,setSources]=useState([]),[rows,setRows]=useState([]),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=async()=>{try{const [s,b]=await Promise.all([api.get('/sources'),api.get('/bardana-purchases')]);setSources(s);setRows(b)}catch(e){setError(e.message)}};
 useEffect(()=>{load()},[]);
 useEffect(()=>{if(editRecord)setForm({date:editRecord.date,source_id:String(editRecord.source_id||''),quantity:editRecord.quantity??'',rate_per_bag:editRecord.rate_per_bag??'',paid_amount:editRecord.paid_amount??'',remarks:editRecord.remarks||''})},[editRecord]);
 const total=Number(form.quantity||0)*Number(form.rate_per_bag||0);
 const submit=async e=>{e.preventDefault();setError('');setSuccess('');try{await api.post(editRecord?`/bardana-purchases/${editRecord.id}/update`:'/bardana-purchases',form);setForm(initial());setSuccess(editRecord?'Purchase updated.':'Bardana purchase saved.');await load();onSaved?.()}catch(e){setError(e.message)}};

 return <>
  <PageHeader title={t('bardanaPurchase','Bardana Purchase')}/>
  <div>
   <Card><h3>{t('newBardanaPurchase','New Bardana Purchase')}</h3><ErrorBox error={error}/><SuccessBox text={success}/><form className="form-grid" onSubmit={submit}>
    <label>{t('date','Date')} (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
    <label>{t('source','Source')}<select required value={form.source_id} onChange={e=>setForm({...form,source_id:e.target.value})}><option value="">{t('selectSource','Select source')}</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name} — {s.source_type}</option>)}</select></label>
    <label>{t('quantity','Quantity')} ({t('bags','Bags')})<input required type="number" min="1" step="1" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label>
    <label>{t('ratePerBagLabel','Rate per Bag')}<input required type="number" min="0" step="0.01" value={form.rate_per_bag} onChange={e=>setForm({...form,rate_per_bag:e.target.value})}/></label>
    <label>{t('totalCost','Total Cost')}<input value={money(total)} disabled/></label><label>Amount Paid<input type="number" min="0" max={total||undefined} step="0.01" value={form.paid_amount} onChange={e=>setForm({...form,paid_amount:e.target.value})}/></label>
    <label className="span-2">{t('remarks','Remarks')}<textarea value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></label>
    <div className="span-2"><button className="primary">{editRecord?'Save Changes':t('saveBardanaPurchase','Save Bardana Purchase')}</button></div>
   </form></Card>

   {showHistory&&<Card className="section-card-below"><h3>Recent Bardana Purchases</h3>{rows.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Source</th><th>Bags</th><th>Rate/Bag</th><th>Total</th></tr></thead><tbody>
    {rows.slice(0,15).map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td><strong>{r.source_name}</strong><small>{r.source_type}</small></td><td>{num(r.quantity)}</td><td>{money(r.rate_per_bag)}</td><td>{money(r.total_cost)}</td></tr>)}
   </tbody></table></div>:<Empty/>}</Card>}
  </div>
 </>;
}
