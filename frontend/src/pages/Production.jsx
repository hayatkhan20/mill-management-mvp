import { useEffect, useState } from 'react';
import { api } from '../api';
import { Card, Empty, ErrorBox, SuccessBox } from '../components/Common';
import { num, today } from '../utils';
import DateField, { formatDateDMY } from '../components/DateField';
import BagQuantity from '../components/BagQuantity';

const blankItem=(id)=>({product_id:id,bags_20:'',bags_40:'',loose_kg:''});
const totalKg=item=>(Number(item?.bags_20||0)*20)+(Number(item?.bags_40||0)*40)+Number(item?.loose_kg||0);

export default function Production(){
  const [date,setDate]=useState(today());
  const [wheatConsumed,setWheatConsumed]=useState('');
  const [remarks,setRemarks]=useState('');
  const [products,setProducts]=useState([]);
  const [daily,setDaily]=useState(null);
  const [rows,setRows]=useState([]);
  const [items,setItems]=useState([]);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  const load=async(currentDate=date)=>{
    try{
      const [productRows,dailyRow,history]=await Promise.all([
        api.get('/products'),
        api.get(`/stock/daily?date=${currentDate}`),
        api.get('/production')
      ]);
      const active=productRows.filter(p=>!['Wheat','Bardana'].includes(p.name));
      setProducts(active);
      setDaily(dailyRow);
      setRows(history);
      setItems(active.map(p=>{
        const d=dailyRow.rows?.find(r=>String(r.id)===String(p.id));
        return {
          product_id:p.id,
          bags_20:d?.physical_counted?d.bags_20:'',
          bags_40:d?.physical_counted?d.bags_40:'',
          loose_kg:d?.physical_counted?d.loose_kg:''
        };
      }));
    }catch(e){setError(e.message)}
  };

  useEffect(()=>{load(date)},[date]);

  const update=(productId,field,value)=>{
    setItems(prev=>prev.map(i=>String(i.product_id)===String(productId)?{...i,[field]:value}:i));
  };

  const calculatedProduction=(productId)=>{
    const item=items.find(i=>String(i.product_id)===String(productId))||blankItem(productId);
    const hasCount=[item.bags_20,item.bags_40,item.loose_kg].some(v=>String(v??'').trim()!=='');
    if(!hasCount) return null;
    const d=daily?.rows?.find(r=>String(r.id)===String(productId));
    if(!d) return 0;

    const bags20=Math.max(0,
      Number(item.bags_20||0)+Number(d.sales_bags_20||0)+Number(d.consumption_bags_20||0)-Number(d.previous_bags_20||0)
    );
    const bags40=Math.max(0,
      Number(item.bags_40||0)+Number(d.sales_bags_40||0)+Number(d.consumption_bags_40||0)-Number(d.previous_bags_40||0)
    );
    const loose=Math.max(0,
      Number(item.loose_kg||0)+Number(d.sales_loose_kg||0)+Number(d.consumption_loose_kg||0)-Number(d.previous_loose_kg||0)
    );

    return {bags20,bags40,loose,total:(bags20*20)+(bags40*40)+loose};
  };

  const submit=async e=>{
    e.preventDefault();
    setError('');
    setSuccess('');
    try{
      const result=await api.post('/production',{
        date,
        wheat_consumed:wheatConsumed,
        remarks,
        items
      });
      setSuccess(result?.warning || 'Today\'s stock saved and production calculated.');
      setWheatConsumed('');
      setRemarks('');
      await load(date);
    }catch(e){setError(e.message)}
  };

  return <>
    <Card>
      <h3>Today&apos;s Production / Stock Count</h3>
      <ErrorBox error={error}/><SuccessBox text={success}/>

      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Date (DD/MM/YYYY)
            <DateField required value={date} onChange={setDate}/>
          </label>
          <label>Wheat Used / Ground (KG)
            <input type="number" min="0" step="0.01" value={wheatConsumed} onChange={e=>setWheatConsumed(e.target.value)}/>
          </label>
        </div>

        <div className="production-products-section">
          <div className="section-title"><h3>Total Stock Present Today</h3></div>

          <div className="table-wrap">
            <table className="production-entry-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Previous Stock</th>
                  <th>20 KG Bags</th>
                  <th>40 KG Bags</th>
                  <th>Loose KG</th>
                  <th>Total Stock</th>
                  <th>Calculated Production</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product=>{
                  const item=items.find(i=>String(i.product_id)===String(product.id))||blankItem(product.id);
                  const d=daily?.rows?.find(r=>String(r.id)===String(product.id));
                  const produced=calculatedProduction(product.id);
                  return <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td>
                      {d?.previous_breakdown_known?<><BagQuantity bags20={d?.previous_bags_20||0} bags40={d?.previous_bags_40||0}/><small className="record-kg">{num(d?.opening||0)} KG{Number(d?.previous_loose_kg||0)>0?` • ${num(d.previous_loose_kg)} loose KG`:''}</small></>:<><strong>{num(d?.opening||0)} KG</strong><small>Bag breakdown not recorded</small></>}
                    </td>
                    <td><input type="number" min="0" step="1" value={item.bags_20} onChange={e=>update(product.id,'bags_20',e.target.value)}/></td>
                    <td><input type="number" min="0" step="1" value={item.bags_40} onChange={e=>update(product.id,'bags_40',e.target.value)}/></td>
                    <td><input type="number" min="0" step="0.01" value={item.loose_kg} onChange={e=>update(product.id,'loose_kg',e.target.value)}/></td>
                    <td><BagQuantity bags20={item.bags_20||0} bags40={item.bags_40||0}/><small className="record-kg">{num(totalKg(item))} KG{Number(item.loose_kg||0)>0?` • ${num(item.loose_kg)} loose KG`:''}</small></td>
                    <td>{produced===null?'—':<><BagQuantity bags20={produced.bags20} bags40={produced.bags40}/><small className="record-kg">{num(produced.total)} KG{Number(produced.loose)>0?` • ${num(produced.loose)} loose KG`:''}</small></>}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>

        <label style={{marginTop:16}}>Remarks
          <textarea value={remarks} onChange={e=>setRemarks(e.target.value)}/>
        </label>

        <div className="actions">
          <button className="primary">Save Today&apos;s Stock</button>
        </div>
      </form>
    </Card>

    <Card className="section-card-below">
      <h3>Recent Production</h3>
      {rows.length?<div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Wheat Used</th><th>Calculated Production</th><th>Physical Stock</th></tr></thead>
        <tbody>
          {rows.slice(0,20).map(r=><tr key={r.id}>
            <td>{formatDateDMY(r.date)}</td>
            <td>{num(r.wheat_consumed)} KG</td>
            <td>{r.items?.length?r.items.map(i=><div key={i.id}>{i.product_name}: <BagQuantity bags20={i.bags_20||0} bags40={i.bags_40||0}/><small className="record-kg">{num(i.qty_kg)} KG{Number(i.loose_kg||0)>0?` • ${num(i.loose_kg)} loose KG`:''}</small></div>):'—'}</td>
            <td>{r.items?.length?r.items.map(i=><div key={i.id}>{i.product_name}: <BagQuantity bags20={i.stock_bags_20} bags40={i.stock_bags_40}/><small className="record-kg">{num(i.physical_stock_kg)} KG{Number(i.stock_loose_kg)>0?` • ${num(i.stock_loose_kg)} loose KG`:''}</small></div>):'—'}</td>
          </tr>)}
        </tbody>
      </table></div>:<Empty/>}
    </Card>
  </>;
}
