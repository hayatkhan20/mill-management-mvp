import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, ErrorBox, PageHeader } from '../components/Common';
import { num, today } from '../utils';
import DateField from '../components/DateField';

export default function Appendix(){
 const {t}=useUiPreferences();
 const [date,setDate]=useState(today()),[data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  setError('');
  api.get(`/appendix/daily?date=${date}`).then(setData).catch(e=>setError(e.message));
 },[date]);

 const finishedRows=data?.rows?.filter(r=>r.name!=='Waste')||[];
 const wasteRow=data?.rows?.find(r=>r.name==='Waste');
 const produced20=finishedRows.reduce((sum,r)=>sum+Number(r.produced_bags_20||0),0);
 const produced40=finishedRows.reduce((sum,r)=>sum+Number(r.produced_bags_40||0),0);
 const closing20=finishedRows.reduce((sum,r)=>sum+Number(r.closing_bags_20||0),0);
 const closing40=finishedRows.reduce((sum,r)=>sum+Number(r.closing_bags_40||0),0);

 return <>
  <ErrorBox error={error}/>
  <Card>
   <div className="section-title"><h3>{t('dailyRecord','Daily Record')}</h3><DateField value={date} onChange={setDate}/></div>
   {data&&<>
    <div className="stats-grid mini appendix-stats">
     <Card><div className="stat-label">{t('wheatUsed','Wheat Used / Ground')}</div><div className="stat-value">{num(data.wheat_used_kg)} KG</div></Card>
     <Card><div className="stat-label">20K Bags Produced</div><div className="stat-value">{num(produced20)} Bags</div></Card>
     <Card><div className="stat-label">40K Bags Produced</div><div className="stat-value">{num(produced40)} Bags</div></Card>
     <Card><div className="stat-label">{t('currentWheat','Current Wheat / Closing')}</div><div className="stat-value">{num(data.wheat_closing_kg)} KG</div></Card>
    </div>

    <div className="table-wrap"><table>
     <thead><tr><th>{t('product','Product')}</th><th>Size</th><th>Produced</th><th>{t('productionPercent','Production %')}</th><th>Closing Stock</th></tr></thead>
     <tbody>
      {finishedRows.flatMap(r=>[
       <tr key={`${r.id}-20`}>
        <td><strong>{r.name}</strong></td>
        <td><strong>20K</strong></td>
        <td>{r.produced_breakdown_known?<strong>{num(r.produced_bags_20)} Bags</strong>:<span>—</span>}</td>
        <td>{num(r.percentage)}%</td>
        <td>{r.closing_breakdown_known?<strong>{num(r.closing_bags_20)} Bags</strong>:<span>—</span>}</td>
       </tr>,
       <tr key={`${r.id}-40`}>
        <td></td>
        <td><strong>40K</strong></td>
        <td>{r.produced_breakdown_known?<strong>{num(r.produced_bags_40)} Bags</strong>:<span>—</span>}</td>
        <td></td>
        <td>{r.closing_breakdown_known?<strong>{num(r.closing_bags_40)} Bags</strong>:<span>—</span>}</td>
       </tr>
      ])}
      {wasteRow&&<tr>
       <td><strong>Waste</strong></td>
       <td>KG</td>
       <td><strong>{num(wasteRow.produced_kg)} KG</strong></td>
       <td>{num(wasteRow.percentage)}%</td>
       <td><strong>{num(wasteRow.closing_kg)} KG</strong></td>
      </tr>}
      <tr>
       <td><strong>{t('total','Total')}</strong></td>
       <td><strong>20K</strong></td>
       <td><strong>{num(produced20)} Bags</strong></td>
       <td><strong>{num(data.total_yield_percent)}%</strong></td>
       <td><strong>{num(closing20)} Bags</strong></td>
      </tr>
      <tr>
       <td></td>
       <td><strong>40K</strong></td>
       <td><strong>{num(produced40)} Bags</strong></td>
       <td></td>
       <td><strong>{num(closing40)} Bags</strong></td>
      </tr>
     </tbody>
    </table></div>
   </>}
  </Card>
 </>;
}
