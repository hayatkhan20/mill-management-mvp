import { useState } from 'react';
import WheatIn from './WheatIn';
import BardanaIn from './BardanaIn';

export default function Purchases(){
  const [tab,setTab]=useState('wheat');
  return <>
    <div className="page-header">
      <div>
        <h2>Purchases</h2>
      </div>
    </div>

    <div className="section-tabs">
      <button className={tab==='wheat'?'primary':'secondary'} onClick={()=>setTab('wheat')}>Wheat Purchase</button>
      <button className={tab==='bardana'?'primary':'secondary'} onClick={()=>setTab('bardana')}>Bardana Purchase</button>
    </div>

    {tab==='wheat'?<WheatIn/>:<BardanaIn/>}
  </>;
}
