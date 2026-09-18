import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, monthNow, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blank=()=>({date:today(),category:'',amount:'',note:''});
const recurringCategories=['Electricity Bill','Meal','Employee Salaries','Machinery Cost'];

export default function Expenses(){
 const [month,setMonth]=useState(monthNow()),[data,setData]=useState(null),[form,setForm]=useState(blank()),[editingId,setEditingId]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=()=>api.get(`/expenses?month=${month}`).then(setData).catch(e=>setError(e.message));
 useEffect(()=>{setError('');load()},[month]);

 const submit=async e=>{
  e.preventDefault();setError('');setSuccess('');
  try{
   if(editingId) await api.post(`/expenses/${editingId}/update`,form);
   else await api.post('/expenses',form);
   setSuccess(editingId?'Expense updated.':'Expense added.');
   setEditingId(null);setForm(blank());await load();
  }catch(e){setError(e.message)}
 };

 const edit=(row)=>{setEditingId(row.id);setForm({date:row.date,category:row.category,amount:row.amount,note:row.note||''});window.scrollTo({top:0,behavior:'smooth'})};
 const cancel=()=>{setEditingId(null);setForm(blank())};

 return <>
  <PageHeader title="Expenses" text="Wheat and Bardana purchase expenses come automatically from purchase records. Add only other expenses here."/>
  <ErrorBox error={error}/><SuccessBox text={success}/>

  <Card>
   <div className="section-title"><h3>Monthly Expense Summary</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
   {data&&<div className="stats-grid mini">
    <Card><div className="stat-label">Wheat Purchases</div><div className="stat-value">{money(data.summary.wheat)}</div></Card>
    <Card><div className="stat-label">Bardana Purchases</div><div className="stat-value">{money(data.summary.bardana)}</div></Card>
    <Card><div className="stat-label">Other Expenses</div><div className="stat-value">{money(data.summary.other)}</div></Card>
   </div>}
   {data&&<div className="note-card"><strong>Total Expenses: {money(data.summary.total)}</strong></div>}
  </Card>

  <div className="two-col" style={{marginTop:18}}>
   <Card>
    <h3>{editingId?'Edit Other Expense':'Add Other Expense'}</h3>
    <form className="form-grid" onSubmit={submit}>
     <label>Date (DD/MM/YYYY)<DateField required value={form.date} onChange={date=>setForm({...form,date})}/></label>
     <label>Category
      <input required list="expense-categories" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Select or type a one-time category"/>
      <datalist id="expense-categories">{recurringCategories.map(x=><option value={x} key={x}/>)}</datalist>
      <small>Common repeatable categories are suggested; any other category can be typed once.</small>
     </label>
     <label>Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
     <label>Note<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Optional"/></label>
     <div className="span-2"><button className="primary">{editingId?'Save Changes':'Add Expense'}</button>{editingId&&<> <button type="button" className="secondary" onClick={cancel}>Cancel</button></>}</div>
    </form>
   </Card>

   <Card>
    <h3>Other Expenses</h3>
    {data?.manual?.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th><th></th></tr></thead><tbody>
     {data.manual.map(r=><tr key={r.id}><td>{formatDateDMY(r.date)}</td><td><strong>{r.category}</strong></td><td>{money(r.amount)}</td><td>{r.note||'—'}</td><td><button className="link-btn" onClick={()=>edit(r)}>Edit</button></td></tr>)}
    </tbody></table></div>:<Empty/>}
   </Card>
  </div>

  <div style={{marginTop:18}}><Card>
   <h3>Automatic Purchase Expenses</h3>
   {data?.automatic?.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Source</th><th>Amount</th></tr></thead><tbody>
    {data.automatic.map((r,i)=><tr key={`${r.type}-${r.id}-${i}`}><td>{formatDateDMY(r.date)}</td><td>{r.type}</td><td>{r.source||'—'}</td><td>{money(r.amount)}</td></tr>)}
   </tbody></table></div>:<Empty text="No Wheat or Bardana purchase expenses for this month."/>}
  </Card></div>
 </>;
}
