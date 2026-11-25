import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, SuccessBox } from '../components/Common';
import { money, printNamed, today } from '../utils';
import DateField from '../components/DateField';
import MoneyInput from '../components/MoneyInput';

const newEntry=()=>({direction:'IN',person:'',amount:'',note:''});

export default function DailyActivities(){
  const [date,setDate]=useState(today());
  const [data,setData]=useState(null);
  const [entry,setEntry]=useState(newEntry());
  const [editing,setEditing]=useState(null);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  const load=async day=>{
    try{setData(await api.get(`/roznamcha?date=${day}`));setError('')}
    catch(e){setError(e.message)}
  };
  useEffect(()=>{load(date)},[date]);

  const saveEntry=async e=>{
    e.preventDefault();setError('');setSuccess('');
    try{
      const payload={...entry,date};
      await api.post(editing?`/roznamcha/adjustment/${editing}/update`:'/roznamcha/adjustment',payload);
      setSuccess(editing?'Cash adjustment updated.':'Cash adjustment recorded.');
      setEditing(null);setEntry(newEntry());await load(date);
    }catch(e){setError(e.message)}
  };
  const editEntry=r=>{
    setEditing(r.id);setEntry({direction:r.direction,person:r.person,amount:String(r.amount),note:r.note||''});
  };
  const cancelEdit=()=>{setEditing(null);setEntry(newEntry())};

  const table=(rows,empty)=>(rows?.length?<div className="table-wrap"><table>
    <thead><tr><th>Person / Description</th><th>Reference</th><th>Details</th><th>Amount</th><th></th></tr></thead>
    <tbody>{rows.map(r=><tr key={r.type+'-'+r.id}>
      <td><strong>{r.person}</strong></td>
      <td>{r.reference}</td><td>{r.note||'—'}</td>
      <td><strong>{money(r.amount)}</strong></td>
      <td>{r.type==='manual'&&<button className="link-btn no-print" onClick={()=>editEntry(r)}>Edit</button>}</td>
    </tr>)}</tbody>
  </table></div>:<Empty text={empty}/>);

  return <>
    <ErrorBox error={error}/><SuccessBox text={success}/>
    <div className="history-toolbar">
      <DateField value={date} onChange={setDate}/>
      <button className="secondary no-print" onClick={()=>printNamed(`Roznamcha-${date}`)}>Print / PDF</button>
    </div>
    {data&&<>
      <div className="stats-grid mini">
        <Card><div className="stat-label">Amadan (Cash In)</div><div className="stat-value">{money(data.cash_received)}</div></Card>
        <Card><div className="stat-label">Kharch (Cash Out)</div><div className="stat-value">{money(data.cash_paid)}</div></Card>
        <Card><div className="stat-label">Today's Cash Difference</div><div className="stat-value">{money(data.net_cash)}</div></Card>
      </div>
    <div className="two-col" style={{marginTop:18}}>
        <Card><h3>آمدن — Cash Received</h3>{table(data.income,'No cash received on this date.')}</Card>
        <Card><h3>خرچ — Cash Paid</h3>{table(data.expenses,'No cash payments on this date.')}</Card>
      </div>
      <Card className="section-card-below no-print">
        <h3>{editing?'Edit Cash Adjustment':'Other Cash In / Out'}</h3>
        <form className="form-grid" onSubmit={saveEntry}>
          <label>Transaction<select value={entry.direction} onChange={e=>setEntry({...entry,direction:e.target.value})}>
            <option value="IN">Cash In (آمدن)</option><option value="OUT">Cash Out (خرچ)</option>
          </select></label>
          <label>Person / Description<input required value={entry.person} onChange={e=>setEntry({...entry,person:e.target.value})}/></label>
          <label>Amount (Rs)<MoneyInput required value={entry.amount} onChange={amount=>setEntry({...entry,amount})}/></label>
          <label>Reason<input required value={entry.note} onChange={e=>setEntry({...entry,note:e.target.value})}/></label>
          <div className="span-2"><button className="primary">{editing?'Save Adjustment':'Save Adjustment'}</button>
            {editing&&<button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </Card>
    </>}
  </>;
}
