import { useState } from 'react';
import Customers from './Customers';
import Sources from './Sources';

export default function Accounts(){
  const [tab,setTab]=useState('customers');
  return <>
    <div className="page-header">
      <div>
        <h2>Accounts</h2>
      </div>
    </div>

    <div className="section-tabs">
      <button className={tab==='customers'?'primary':'secondary'} onClick={()=>setTab('customers')}>Customers</button>
      <button className={tab==='sources'?'primary':'secondary'} onClick={()=>setTab('sources')}>Sources</button>
    </div>

    {tab==='customers'?<Customers/>:<Sources/>}
  </>;
}
