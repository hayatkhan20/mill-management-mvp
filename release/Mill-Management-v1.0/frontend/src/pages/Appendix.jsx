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
    <div className="table-wrap"><table><thead><tr><th>{t('product','Product')}</th><th>{t('producedKg','Produced KG')}</th><th>{t('productionPercent','Production %')}</th><th>{t('closingStockKg','Closing Stock KG')}</th><th>{t('closingBags','Closing Bags')}</th></tr></thead><tbody>
     {data.rows.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{num(r.produced_kg)} KG</td><td>{num(r.percentage)}%</td><td>{num(r.closing_kg)} KG</td><td>—</td></tr>)}
     <tr><td><strong>{t('total','Total')}</strong></td><td><strong>{num(data.total_produced_kg)} KG</strong></td><td><strong>{num(data.total_yield_percent)}%</strong></td><td></td><td></td></tr>
    </tbody></table></div>
   </>}
  </Card>
 </>;
}
