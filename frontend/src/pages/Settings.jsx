import { useState } from 'react';
import Products from './Products';
import OpeningData from './OpeningData';

export default function Settings(){
  const [tab,setTab]=useState('products');
  return <>
    <div className="section-tabs">
      <button className={tab==='products'?'primary':'secondary'} onClick={()=>setTab('products')}>Products</button>
      <button className={tab==='opening'?'primary':'secondary'} onClick={()=>setTab('opening')}>Opening Data</button>
    </div>

    {tab==='products'?<Products/>:<OpeningData/>}
  </>;
}
