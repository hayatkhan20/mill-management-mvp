import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, SuccessBox } from '../components/Common';
import { money, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';

const blankEmployee=()=>({name:'',phone:'',address:'',monthly_salary:''});
const balanceLabel=v=>Number(v)<0?`Advance ${money(Math.abs(v))}`:`Payable ${money(v)}`;

export default function Employees(){
  const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[search,setSearch]=useState('');
  const [form,setForm]=useState(blankEmployee()),[editing,setEditing]=useState(false),[editForm,setEditForm]=useState(blankEmployee());
  const [salary,setSalary]=useState({date:today(),amount:'',note:''}),[payment,setPayment]=useState({date:today(),amount:'',note:''});
  const [error,setError]=useState(''),[success,setSuccess]=useState('');

  const load=()=>api.get('/employees').then(setRows).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);

  const add=async e=>{e.preventDefault();setError('');try{await api.post('/employees',form);setForm(blankEmployee());setSuccess('Employee added.');load()}catch(e){setError(e.message)}};
  const open=async id=>{try{const e=await api.get(`/employees/${id}`);setSelected(e);setEditForm({name:e.name||'',phone:e.phone||'',address:e.address||'',monthly_salary:e.monthly_salary||''});setSalary({date:today(),amount:e.monthly_salary||'',note:''});setPayment({date:today(),amount:'',note:''});setEditing(false)}catch(e){setError(e.message)}};
  const save=async e=>{e.preventDefault();setError('');try{await api.post(`/employees/${selected.id}/update`,editForm);setSuccess('Employee updated.');await open(selected.id);load()}catch(e){setError(e.message)}};
  const postSalary=async e=>{e.preventDefault();setError('');try{await api.post('/employee-salary',{employee_id:selected.id,...salary});setSuccess('Salary due added.');await open(selected.id);load()}catch(e){setError(e.message)}};
  const pay=async e=>{e.preventDefault();setError('');try{await api.post('/employee-payments',{employee_id:selected.id,...payment});setSuccess('Employee payment recorded and added to expenses.');await open(selected.id);load()}catch(e){setError(e.message)}};

  const filtered=rows.filter(r=>{const q=search.trim().toLowerCase();if(!q)return true;return [r.name,r.phone,r.address].some(v=>String(v||'').toLowerCase().includes(q))});

  return <>
    <ErrorBox error={error}/><SuccessBox text={success}/>
    <Card>
      <h3>Add Employee</h3>
      <form className="form-grid" onSubmit={add}>
        <label className="span-2">Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Monthly Salary<input type="number" min="0" step="0.01" value={form.monthly_salary} onChange={e=>setForm({...form,monthly_salary:e.target.value})}/></label>
        <label className="span-2">Address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
        <div className="span-2"><button className="primary">Add Employee</button></div>
      </form>
    </Card>

    <Card className="section-card-below">
      <h3>Employee Accounts</h3>
      <input placeholder="Search by name, phone or address" value={search} onChange={e=>setSearch(e.target.value)}/>
      {filtered.length?<div className="table-wrap"><table><thead><tr><th>Employee</th><th>Salary Due</th><th>Paid</th><th>Balance</th></tr></thead><tbody>
        {filtered.map(r=><tr key={r.id} className="clickable" onClick={()=>open(r.id)}><td><strong>{r.name}</strong><small>{r.phone}</small></td><td>{money(r.total_salary)}</td><td>{money(r.total_paid)}</td><td className={Number(r.balance)>0?'pending':Number(r.balance)<0?'advance':''}>{balanceLabel(r.balance)}</td></tr>)}
      </tbody></table></div>:<Empty/>}
    </Card>

    {selected&&<div className="modal"><div className="customer-modal">
      <div className="modal-actions">{!editing&&<button className="secondary" onClick={()=>setEditing(true)}>Edit Employee</button>}<button className="secondary" onClick={()=>setSelected(null)}>Close</button></div>
      {!editing?<><h2>{selected.name}</h2><p>{selected.phone}{selected.address?` • ${selected.address}`:''}</p></>:<Card><h3>Edit Employee</h3><form className="form-grid" onSubmit={save}><label className="span-2">Name<input required value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}/></label><label>Phone<input value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})}/></label><label>Monthly Salary<input type="number" min="0" step="0.01" value={editForm.monthly_salary} onChange={e=>setEditForm({...editForm,monthly_salary:e.target.value})}/></label><label className="span-2">Address<input value={editForm.address} onChange={e=>setEditForm({...editForm,address:e.target.value})}/></label><div className="span-2"><button className="primary">Save Changes</button> <button type="button" className="secondary" onClick={()=>setEditing(false)}>Cancel</button></div></form></Card>}

      <div className="stats-grid mini">
        <Card><div className="stat-label">Total Salary Due</div><div className="stat-value">{money(selected.total_salary)}</div></Card>
        <Card><div className="stat-label">Total Paid</div><div className="stat-value">{money(selected.total_paid)}</div></Card>
        <Card><div className="stat-label">{selected.balance<0?'Advance':'Current Payable'}</div><div className="stat-value">{money(Math.abs(selected.balance))}</div></Card>
      </div>

      <Card className="no-print"><h3>Add Salary Due</h3><form className="form-inline" onSubmit={postSalary}><DateField required value={salary.date} onChange={date=>setSalary({...salary,date})}/><input required type="number" min="0.01" step="0.01" placeholder="Salary amount" value={salary.amount} onChange={e=>setSalary({...salary,amount:e.target.value})}/><input placeholder="Note (optional)" value={salary.note} onChange={e=>setSalary({...salary,note:e.target.value})}/><button className="primary">Add Salary</button></form></Card>
      <Card className="no-print"><h3>Pay Employee / Advance</h3><form className="form-inline" onSubmit={pay}><DateField required value={payment.date} onChange={date=>setPayment({...payment,date})}/><input required type="number" min="0.01" step="0.01" placeholder="Amount" value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/><input placeholder="Note (optional)" value={payment.note} onChange={e=>setPayment({...payment,note:e.target.value})}/><button className="primary">Pay</button></form></Card>

      <Card><h3>Ledger</h3>{selected.ledger.length?<div className="table-wrap"><table><thead><tr><th>Date</th><th>Reference</th><th>Salary Due</th><th>Payment</th><th>Balance</th></tr></thead><tbody>{selected.ledger.map((e,i)=><tr key={i}><td>{formatDateDMY(e.date)}</td><td>{e.reference}</td><td>{Number(e.debit)>0?money(e.debit):'—'}</td><td>{Number(e.credit)>0?money(e.credit):'—'}</td><td>{balanceLabel(e.balance)}</td></tr>)}</tbody></table></div>:<Empty/>}</Card>
    </div></div>}
  </>;
}
