import { useState } from 'react';
import Customers from './Customers';
import Sources from './Sources';
import Employees from './Employees';
import { useUiPreferences } from '../context/UiPreferences';

export default function Accounts(){
  const {t}=useUiPreferences();
  const [tab,setTab]=useState('customers');
  return <>
    <div className="section-tabs">
      <button className={tab==='customers'?'primary':'secondary'} onClick={()=>setTab('customers')}>{t('customers','Customers')}</button>
      <button className={tab==='sources'?'primary':'secondary'} onClick={()=>setTab('sources')}>{t('sources','Sources')}</button>
      <button className={tab==='employees'?'primary':'secondary'} onClick={()=>setTab('employees')}>Employees</button>
    </div>

    {tab==='customers'?<Customers/>:tab==='sources'?<Sources/>:<Employees/>}
  </>;
}
