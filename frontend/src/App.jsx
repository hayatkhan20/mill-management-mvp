import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Consumption from './pages/Consumption';
import Accounts from './pages/Accounts';
import Stock from './pages/Stock';
import Appendix from './pages/Appendix';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import { UiPreferencesProvider } from './context/UiPreferences';
import LicenseActivation from './pages/LicenseActivation';
import { api } from './api';

const pages={
  dashboard:Dashboard,
  purchases:Purchases,
  production:Production,
  sales:Sales,
  consumption:Consumption,
  accounts:Accounts,
  stock:Stock,
  appendix:Appendix,
  expenses:Expenses,
  settings:Settings,
};

export default function App(){
  const [page,setPage]=useState('dashboard');
  const [license,setLicense]=useState(null);
  const [licenseLoading,setLicenseLoading]=useState(true);
  const Page=pages[page];

  useEffect(()=>{
    if(import.meta.env.DEV){
      setLicense({licensed:true,development:true});
      setLicenseLoading(false);
      return;
    }

    api.get('/license/status')
      .then(setLicense)
      .catch(()=>setLicense({licensed:false,installation_id:'Unavailable'}))
      .finally(()=>setLicenseLoading(false));
  },[]);

  if(licenseLoading) return <div className="app-loading">Starting Mill Manager...</div>;

  return <UiPreferencesProvider>
    {license?.licensed
      ? <Layout page={page} setPage={setPage}><Page key={page}/></Layout>
      : <LicenseActivation status={license||{}} onActivated={setLicense}/>}
  </UiPreferencesProvider>;
}
