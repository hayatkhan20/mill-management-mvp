import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { money, monthNow, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blank=()=>({date:today(),amount:'',note:''});
const recurringCategories=['Electricity Bill','Meal','Employee Salaries','Machinery Cost'];

export default function Expenses(){
 const [month,setMonth]=useState(monthNow()),[data,setData]=useState(null),[form,setForm]=useState(blank()),[editingId,setEditingId]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [categoryChoice,setCategoryChoice]=useState(''),[customCategory,setCustomCategory]=useState('');

 const load=()=>api.get(`/expenses?month=${month}`).then(setData).catch(e=>setError(e.message));
 useEffect(()=>{setError('');load()},[month]);

 const resetForm=()=>{
  setEditingId(null);
  setForm(blank());
  setCategoryChoice('');
  setCustomCategory('');
 };

 const submit=async e=>{
  e.preventDefault();setError('');setSuccess('');
  const category=categoryChoice==='custom'?customCategory.trim():categoryChoice;
  if(!category){setError('Please select or enter an expense category.');return;}
  try{
   const payload={...form,category};
   if(editingId) await api.post(`/expenses/${editingId}/update`,payload);
   else await api.post('/expenses',payload);
   setSuccess(editingId?'Expense updated.':'Expense added.');
   resetForm();
   await load();
  }catch(e){setError(e.message)}
 };

 const edit=(row)=>{
  setEditingId(row.id);
  setForm({date:row.date,amount:row.amount,note:row.note||''});
  if(recurringCategories.includes(row.category)){
   setCategoryChoice(row.category);
   setCustomCategory('');
  }else{
   setCategoryChoice('custom');
   setCustomCategory(row.category);
  }
  window.scrollTo({top:0,behavior:'smooth'});
 };

 return <>
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
      <select required value={categoryChoice} onChange={e=>{setCategoryChoice(e.target.value);if(e.target.value!=='custom')setCustomCategory('')}}>
       <option value="">Select category</option>
       {recurringCategories.map(x=><option value={x} key={x}>{x}</option>)}
       <option value="custom">One-time / Custom Category</option>
      </select>
     </label>

     {categoryChoice==='custom'&&<label className="span-2">Category Name
      <input required autoFocus value={customCategory} onChange={e=>setCustomCategory(e.target.value)} placeholder="e.g. Generator Repair, Office Chair, Fuel"/>
     </label>}

     <label>Amount<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
     <label>Note<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Optional"/></label>

     <div className="span-2">
      <button className="primary">{editingId?'Save Changes':'Add Expense'}</button>
      {editingId&&<> <button type="button" className="secondary" onClick={resetForm}>Cancel</button></>}
     </div>
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
