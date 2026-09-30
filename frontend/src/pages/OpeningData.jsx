import { useEffect, useState } from 'react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';
import { Card, ErrorBox, PageHeader, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import DateField from '../components/DateField';

const totalKg=x=>(Number(x.bags_20||0)*20)+(Number(x.bags_40||0)*40)+Number(x.loose_kg||0);

export default function OpeningData(){
  const {t}=useUiPreferences();
  const [products,setProducts]=useState([]),[customers,setCustomers]=useState([]),[sources,setSources]=useState([]),[employees,setEmployees]=useState([]);
  const [error,setError]=useState(''),[success,setSuccess]=useState('');
  const [stock,setStock]=useState({date:today(),product_id:'',bags_20:'',bags_40:'',loose_kg:''});
  const [bardana,setBardana]=useState({date:today(),bags:''});
  const [customer,setCustomer]=useState({date:today(),customer_id:'',balance_type:'Due',amount:''});
  const [source,setSource]=useState({date:today(),source_id:'',balance_type:'Payable',amount:''});
  const [employee,setEmployee]=useState({date:today(),employee_id:'',balance_type:'Payable',amount:''});

  useEffect(()=>{Promise.all([api.get('/products?all=1'),api.get('/customers'),api.get('/sources'),api.get('/employees')]).then(([p,c,s,e])=>{setProducts(p.filter(x=>x.name!=='Bardana'));setCustomers(c);setSources(s);setEmployees(e)}).catch(e=>setError(e.message))},[]);

  const save=async(path,payload,reset,message)=>{setError('');setSuccess('');try{await api.post(path,payload);reset();setSuccess(message)}catch(e){setError(e.message)}};

  return <>
    <PageHeader title={t('openingData','Opening Data')}/>
    <ErrorBox error={error}/><SuccessBox text={success}/>

    <div className="two-col">
      <Card>
        <h3>Opening Product Stock</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/product-stock',stock,()=>setStock({date:today(),product_id:'',bags_20:'',bags_40:'',loose_kg:''}),'Opening product stock saved.')}}>
          <label>Date (DD/MM/YYYY)<DateField required value={stock.date} onChange={date=>setStock({...stock,date})}/></label>
          <label>Product<select required value={stock.product_id} onChange={e=>setStock({...stock,product_id:e.target.value})}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>20 K Bags<input type="number" min="0" step="1" value={stock.bags_20} onChange={e=>setStock({...stock,bags_20:e.target.value})}/></label>
          <label>40 K Bags<input type="number" min="0" step="1" value={stock.bags_40} onChange={e=>setStock({...stock,bags_40:e.target.value})}/></label>
          <label>Loose KG<input type="number" min="0" step="0.01" value={stock.loose_kg} onChange={e=>setStock({...stock,loose_kg:e.target.value})}/></label>
          <label>Total KG<input readOnly value={num(totalKg(stock))}/></label>
          <div className="span-2"><button className="primary">Save Opening Stock</button></div>
        </form>
      </Card>

      <Card>
        <h3>Opening Bardana</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/bardana',bardana,()=>setBardana({date:today(),bags:''}),'Opening Bardana saved.')}}>
          <label>Date (DD/MM/YYYY)<DateField required value={bardana.date} onChange={date=>setBardana({...bardana,date})}/></label>
          <label>Bardana Bags<input required type="number" min="1" step="1" value={bardana.bags} onChange={e=>setBardana({...bardana,bags:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Opening Bardana</button></div>
        </form>
      </Card>

      <Card>
        <h3>Opening Customer Balance</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/customer-balance',customer,()=>setCustomer({date:today(),customer_id:'',balance_type:'Due',amount:''}),'Customer opening balance saved.')}}>
          <label>Date<DateField required value={customer.date} onChange={date=>setCustomer({...customer,date})}/></label>
          <label>Customer<select required value={customer.customer_id} onChange={e=>setCustomer({...customer,customer_id:e.target.value})}><option value="">Select customer</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Balance Type<select value={customer.balance_type} onChange={e=>setCustomer({...customer,balance_type:e.target.value})}><option>Due</option><option>Advance</option></select></label>
          <label>Amount<input required type="number" min="0" step="0.01" value={customer.amount} onChange={e=>setCustomer({...customer,amount:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Customer Balance</button></div>
        </form>
      </Card>

      <Card>
        <h3>Opening Source Balance</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/source-balance',source,()=>setSource({date:today(),source_id:'',balance_type:'Payable',amount:''}),'Source opening balance saved.')}}>
          <label>Date<DateField required value={source.date} onChange={date=>setSource({...source,date})}/></label>
          <label>Source<select required value={source.source_id} onChange={e=>setSource({...source,source_id:e.target.value})}><option value="">Select source</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Balance Type<select value={source.balance_type} onChange={e=>setSource({...source,balance_type:e.target.value})}><option>Payable</option><option>Advance</option></select></label>
          <label>Amount<input required type="number" min="0" step="0.01" value={source.amount} onChange={e=>setSource({...source,amount:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Source Balance</button></div>
        </form>
      </Card>

      <Card>
        <h3>Opening Employee Balance</h3>
        <form className="form-grid" onSubmit={e=>{e.preventDefault();save('/opening/employee-balance',employee,()=>setEmployee({date:today(),employee_id:'',balance_type:'Payable',amount:''}),'Employee opening balance saved.')}}>
          <label>Date<DateField required value={employee.date} onChange={date=>setEmployee({...employee,date})}/></label>
          <label>Employee<select required value={employee.employee_id} onChange={e=>setEmployee({...employee,employee_id:e.target.value})}><option value="">Select employee</option>{employees.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Balance Type<select value={employee.balance_type} onChange={e=>setEmployee({...employee,balance_type:e.target.value})}><option>Payable</option><option>Advance</option></select></label>
          <label>Amount<input required type="number" min="0" step="0.01" value={employee.amount} onChange={e=>setEmployee({...employee,amount:e.target.value})}/></label>
          <div className="span-2"><button className="primary">Save Employee Balance</button></div>
        </form>
      </Card>
    </div>
  </>;
}
