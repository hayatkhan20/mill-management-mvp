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

 return <>
  <ErrorBox error={error}/>
  <Card>
   <div className="section-title"><h3>{t('dailyRecord','Daily Record')}</h3><DateField value={date} onChange={setDate}/></div>
   {data&&<>
    <div className="stats-grid mini">
     <Card><div className="stat-label">{t('wheatUsed','Wheat Used / Ground')}</div><div className="stat-value">{num(data.wheat_used_kg)} KG</div></Card>
     <Card><div className="stat-label">{t('totalProductsProduced','Total Products Produced')}</div><div className="stat-value">{num(data.total_produced_kg)} KG</div></Card>
     <Card><div className="stat-label">{t('currentWheat','Current Wheat / Closing')}</div><div className="stat-value">{num(data.wheat_closing_kg)} KG</div></Card>
    </div>
    <div className="table-wrap"><table><thead><tr><th>{t('product','Product')}</th><th>Produced</th><th>{t('productionPercent','Production %')}</th><th>Closing Stock</th></tr></thead><tbody>
     {data.rows.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{r.produced_breakdown_known?<><strong className="record-bags">{num(r.produced_bags_20)}×20KG + {num(r.produced_bags_40)}×40KG</strong><small className="record-kg">{num(r.produced_kg)} KG{Number(r.produced_loose_kg)>0?` • ${num(r.produced_loose_kg)} loose KG`:''}</small></>:<><strong>{num(r.produced_kg)} KG</strong><small>Bag breakdown not recorded</small></>}</td><td>{num(r.percentage)}%</td><td>{r.closing_breakdown_known?<><strong className="record-bags">{num(r.closing_bags_20)}×20KG + {num(r.closing_bags_40)}×40KG</strong><small className="record-kg">{num(r.closing_kg)} KG{Number(r.closing_loose_kg)>0?` • ${num(r.closing_loose_kg)} loose KG`:''}</small></>:<><strong>{num(r.closing_kg)} KG</strong><small>Bag breakdown not recorded</small></>}</td></tr>)}
     <tr><td><strong>{t('total','Total')}</strong></td><td><strong>{num(data.total_produced_kg)} KG</strong></td><td><strong>{num(data.total_yield_percent)}%</strong></td><td></td></tr>
    </tbody></table></div>
   </>}
  </Card>
 </>;
}
