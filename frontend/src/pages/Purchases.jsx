import { useEffect, useMemo, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, Empty } from '../components/Common';
import { money, num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';
import WheatIn from './WheatIn';
import BardanaIn from './BardanaIn';

export default function Purchases(){
  const {t}=useUiPreferences();
  const [tab,setTab]=useState('wheat');
  const [historyDate,setHistoryDate]=useState(today());
  const [wheatRows,setWheatRows]=useState([]);
  const [bardanaRows,setBardanaRows]=useState([]);

  const loadHistory=async(value=historyDate)=>{
    const suffix=value?`?date=${value}`:'';
    const [w,b]=await Promise.all([api.get(`/wheat-in${suffix}`),api.get(`/bardana-purchases${suffix}`)]);
    setWheatRows(w);setBardanaRows(b);
  };

  useEffect(()=>{loadHistory(today())},[]);

  const summary=useMemo(()=>{
    const wheatKg=wheatRows.reduce((s,r)=>s+Number(r.total_kg||0),0);
    const wheatBags=wheatRows.reduce((s,r)=>s+Number(r.bags||0),0);
    const separateBardana=bardanaRows.reduce((s,r)=>s+Number(r.quantity||0),0);
    const wheatCost=wheatRows.reduce((s,r)=>s+Number(r.total_cost||0),0);
    const bardanaCost=wheatRows.reduce((s,r)=>s+Number(r.bardana_cost||0),0)+bardanaRows.reduce((s,r)=>s+Number(r.total_cost||0),0);
    return {wheatKg,bardanaBags:wheatBags+separateBardana,wheatCost,bardanaCost,total:wheatCost+bardanaCost};
  },[wheatRows,bardanaRows]);

  const combined=useMemo(()=>[
    ...wheatRows.map(r=>({key:`w-${r.id}`,date:r.date,type:'Wheat',source:r.source_name,quantity:`${num(r.total_kg)} KG / ${num(r.bags)} Bags`,rate:`${money(r.rate_per_kg)} / KG`,amount:r.purchase_total})),
    ...bardanaRows.map(r=>({key:`b-${r.id}`,date:r.date,type:'Bardana',source:r.source_name,quantity:`${num(r.quantity)} Bags`,rate:`${money(r.rate_per_bag)} / Bag`,amount:r.total_cost}))
  ].sort((a,b)=>String(b.date).localeCompare(String(a.date))),[wheatRows,bardanaRows]);

  const applyDate=async value=>{setHistoryDate(value);await loadHistory(value)};
  const showAll=async()=>{setHistoryDate('');await loadHistory('')};

  return <>
    <div className="section-tabs">
      <button className={tab==='wheat'?'primary':'secondary'} onClick={()=>setTab('wheat')}>{t('wheatPurchase','Wheat Purchase')}</button>
      <button className={tab==='bardana'?'primary':'secondary'} onClick={()=>setTab('bardana')}>{t('bardanaPurchase','Bardana Purchase')}</button>
    </div>

    {tab==='wheat'?<WheatIn showHistory={false}/>:<BardanaIn showHistory={false}/>}

    <Card className="section-card-below">
      <div className="history-toolbar"><h3>{t('purchaseHistory','Purchase History')}</h3><div className="history-filter"><DateField value={historyDate} onChange={applyDate}/><button type="button" className="secondary" onClick={showAll}>{t('showAll','Show All')}</button></div></div>
      <div className="history-stats purchase-history-stats">
        <div><span>{t('wheat','Wheat')}</span><strong>{num(summary.wheatKg)} KG</strong></div>
        <div><span>{t('bardana','Bardana')}</span><strong>{num(summary.bardanaBags)} Bags</strong></div>
        <div><span>{t('wheatCost','Wheat Cost')}</span><strong>{money(summary.wheatCost)}</strong></div>
        <div><span>{t('bardanaCost','Bardana Cost')}</span><strong>{money(summary.bardanaCost)}</strong></div>
        <div><span>{t('totalPurchase','Total Purchase')}</span><strong>{money(summary.total)}</strong></div>
      </div>
      {combined.length?<div className="table-wrap"><table><thead><tr><th>{t('date','Date')}</th><th>{t('type','Type')}</th><th>{t('source','Source')}</th><th>{t('quantity','Quantity')}</th><th>{t('rate','Rate')}</th><th>{t('total','Total')}</th></tr></thead><tbody>
        {combined.map(r=><tr key={r.key}><td>{formatDateDMY(r.date)}</td><td><strong>{r.type}</strong></td><td>{r.source}</td><td>{r.quantity}</td><td>{r.rate}</td><td>{money(r.amount)}</td></tr>)}
      </tbody></table></div>:<Empty/>}
    </Card>
  </>;
}
