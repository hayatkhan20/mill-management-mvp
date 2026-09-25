import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, ErrorBox, PageHeader } from '../components/Common';
import { monthNow, num, today } from '../utils';
import DateField from '../components/DateField';

export default function Stock(){
 const {t}=useUiPreferences();
 const [date,setDate]=useState(today()),[month,setMonth]=useState(monthNow()),[daily,setDaily]=useState(null),[monthly,setMonthly]=useState(null),[bardana,setBardana]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api.get(`/stock/daily?date=${date}`).then(setDaily).catch(e=>setError(e.message))},[date]);
 useEffect(()=>{api.get(`/stock/monthly?month=${month}`).then(setMonthly).catch(e=>setError(e.message))},[month]);
 useEffect(()=>{api.get('/bardana/stock').then(setBardana).catch(e=>setError(e.message))},[]);

 const table=rows=><div className="table-wrap"><table><thead><tr><th>{t('product','Product')}</th><th>{t('opening','Opening')}</th><th>{t('in','IN')}</th><th>{t('out','OUT')}</th><th>{t('closing','Closing')}</th></tr></thead><tbody>{rows?.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{num(r.opening)} KG</td><td>{num(r.in_qty)} KG</td><td>{num(r.out_qty)} KG</td><td><strong>{num(r.closing)} KG</strong></td></tr>)}</tbody></table></div>;
 const wheat=monthly?.rows?.find(r=>r.name==='Wheat');

 return <>
  <ErrorBox error={error}/>
  <div className="two-col">
   <Card><div className="section-title"><h3>{t('monthlyWheatSummary','Monthly Wheat Summary')}</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
    <div className="table-wrap"><table><thead><tr><th>{t('opening','Opening')} {t('wheat','Wheat')}</th><th>{t('todaysWheatIn','Total Wheat In')}</th><th>{t('wheatUsed','Used / Ground')}</th><th>{t('currentWheat','Current Wheat')}</th></tr></thead><tbody><tr><td>{num(wheat?.opening)} KG</td><td>{num(wheat?.in_qty)} KG</td><td>{num(wheat?.out_qty)} KG</td><td><strong>{num(wheat?.closing)} KG</strong></td></tr></tbody></table></div>
   </Card>
   <Card><h3>{t('bardanaStock','Bardana Stock')}</h3><div className="table-wrap"><table><thead><tr><th>{t('totalReceived','Total Received')}</th><th>{t('used','Used')}</th><th>{t('current','Current')}</th></tr></thead><tbody><tr><td>{num(bardana?.total_received)} Bags</td><td>{num(bardana?.used)} Bags</td><td><strong>{num(bardana?.current)} Bags</strong></td></tr></tbody></table></div></Card>
  </div>

  <div className="two-col" style={{marginTop:18}}>
   <Card><div className="section-title"><h3>{t('dailyStock','Daily Stock')}</h3><DateField value={date} onChange={setDate}/></div>{table(daily?.rows)}</Card>
   <Card><div className="section-title"><h3>{t('monthlyProductStock','Monthly Product Stock')}</h3><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>{table(monthly?.rows)}</Card>
  </div>
 </>;
}
