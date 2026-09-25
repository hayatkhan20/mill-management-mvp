import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { today } from '../utils';
import DateField from '../components/DateField';

export default function OpeningData(){
  const {t}=useUiPreferences();
  const [products,setProducts]=useState([]),[customers,setCustomers]=useState([]),[sources,setSources]=useState([]);
  const [error,setError]=useState(''),[success,setSuccess]=useState('');
  const [stock,setStock]=useState({date:today(),product_id:'',qty_kg:''});
  const [bardana,setBardana]=useState({date:today(),bags:''});
  const [customer,setCustomer]=useState({date:today(),customer_id:'',balance_type:'Due',amount:''});
  const [source,setSource]=useState({date:today(),source_id:'',balance_type:'Payable',amount:''});

  useEffect(()=>{Promise.all([api.get('/products?all=1'),api.get('/customers'),api.get('/sources')]).then(([p,c,s])=>{setProducts(p);setCustomers(c);setSources(s)}).catch(e=>setError(e.message))},[]);

  const save=async(path,payload,reset,message)=>{
    setError('');setSuccess('');
    try{await api.post(path,payload);reset();setSuccess(message)}catch(e){setError(e.message)}
  };

  return <>
    <PageHeader title={t('openingData','Opening Data')}/>
    <ErrorBox error={error}/><SuccessBox text={success}/>

    <div className="two-col">
      <Card>
        <h3>{t('openingProductStock','Opening Product Stock')}</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/product-stock',stock,()=>setStock({date:today(),product_id:'',qty_kg:''}),'Opening product stock saved.')}}>
          <label>{t('date','Date')} (DD/MM/YYYY)<DateField required value={stock.date} onChange={date=>setStock({...stock,date})}/></label>
          <label>{t('product','Product')}<select required value={stock.product_id} onChange={e=>setStock({...stock,product_id:e.target.value})}><option value="">{t('selectProduct','Select product')}</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="span-2">Opening Stock (KG)<input required type="number" min="0.01" step="0.01" value={stock.qty_kg} onChange={e=>setStock({...stock,qty_kg:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Opening Stock</button></div>
        </form>
      </Card>

      <Card>
        <h3>{t('openingBardana','Opening Bardana')}</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/bardana',bardana,()=>setBardana({date:today(),bags:''}),'Opening Bardana saved.')}}>
          <label>{t('date','Date')} (DD/MM/YYYY)<DateField required value={bardana.date} onChange={date=>setBardana({...bardana,date})}/></label>
          <label>Bardana Bags<input required type="number" min="1" step="1" value={bardana.bags} onChange={e=>setBardana({...bardana,bags:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Opening Bardana</button></div>
        </form>
      </Card>

      <Card>
        <h3>{t('openingCustomerBalance','Opening Customer Balance')}</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/customer-balance',customer,()=>setCustomer({date:today(),customer_id:'',balance_type:'Due',amount:''}),'Customer opening balance saved.')}}>
          <label>{t('date','Date')} (DD/MM/YYYY)<DateField required value={customer.date} onChange={date=>setCustomer({...customer,date})}/></label>
          <label>{t('customer','Customer')}<select required value={customer.customer_id} onChange={e=>setCustomer({...customer,customer_id:e.target.value})}><option value="">{t('selectCustomer','Select customer')}</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Balance Type<select value={customer.balance_type} onChange={e=>setCustomer({...customer,balance_type:e.target.value})}><option>Due</option><option>Advance</option></select></label>
          <label>{t('amount','Amount')}<input required type="number" min="0" step="0.01" value={customer.amount} onChange={e=>setCustomer({...customer,amount:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Customer Balance</button></div>
        </form>
      </Card>

      <Card>
        <h3>{t('openingSourceBalance','Opening Source Balance')}</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/source-balance',source,()=>setSource({date:today(),source_id:'',balance_type:'Payable',amount:''}),'Source opening balance saved.')}}>
          <label>{t('date','Date')} (DD/MM/YYYY)<DateField required value={source.date} onChange={date=>setSource({...source,date})}/></label>
          <label>{t('source','Source')}<select required value={source.source_id} onChange={e=>setSource({...source,source_id:e.target.value})}><option value="">{t('selectSource','Select source')}</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name} — {s.source_type}</option>)}</select></label>
          <label>Balance Type<select value={source.balance_type} onChange={e=>setSource({...source,balance_type:e.target.value})}><option>Payable</option><option>Advance</option></select></label>
          <label>Amount<input required type="number" min="0" step="0.01" value={source.amount} onChange={e=>setSource({...source,amount:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Source Balance</button></div>
        </form>
      </Card>
    </div>
  </>;
}
