import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mill-smoke-'));
const dbPath=path.join(dir,'mill.db');
const port=19000+Math.floor(Math.random()*3000);
const origin='http://127.0.0.1:'+port;
const env={...process.env,DB_PATH:dbPath,PORT:String(port),MILL_LICENSE_BYPASS:'1'};
const server=spawn(process.execPath,['src/server.js'],{cwd:path.join(root,'backend'),env,stdio:['ignore','pipe','pipe']});
let logs='';
for(const stream of [server.stdout,server.stderr]) stream.on('data',chunk=>{logs+=chunk.toString()});
const pause=ms=>new Promise(r=>setTimeout(r,ms));

async function request(endpoint,{method='GET',body}={}){
 const res=await fetch(origin+'/api'+endpoint,{
   method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)
 });
 const data=await res.json();
 if(!res.ok) throw Error(method+' '+endpoint+' '+res.status+': '+JSON.stringify(data));
 return data;
}
const post=(endpoint,body)=>request(endpoint,{method:'POST',body});
async function ready(){
 for(let i=0;i<60;i++){
   if(server.exitCode!==null) throw Error('Server exited: '+logs);
   try{if((await request('/health')).ok)return}catch{}
   await pause(500);
 }
 throw Error('Server failed to start: '+logs);
}
function eq(a,b,label){assert.equal(Number(a),Number(b),label)}
try{
 await ready();
 const date='2026-11-25';
 const customer=await post('/customers',{name:'Cashbook Test Customer'});
 const products=await request('/products');
 const atta=products.find(x=>x.name==='Atta');
 assert.ok(atta,'Atta is in catalog');
 await post('/opening/product-stock',{date,product_id:atta.id,bags_20:100,bags_40:0,loose_kg:0});
 const sale=await post('/sales',{
   date,customer_id:customer.id,
   items:[{product_id:atta.id,bag_size:20,bags:10,rate:500}],
   received_amount:1000,payment_method:'Cash',remarks:'Test partial cash'
 });
 assert.ok(sale.id,'sale created');
 let daily=await request('/roznamcha?date='+date);
 eq(daily.cash_received,1000,'Only received cash, not the full sale value');
 eq(daily.cash_paid,0,'No cash paid');
 await post('/payments',{customer_id:customer.id,date,amount:500,note:'Bank payment',payment_method:'Bank'});
 daily=await request('/roznamcha?date='+date);
 eq(daily.cash_received,1000,'Bank payment excluded from cash');
 await post('/payments',{customer_id:customer.id,date,amount:200,note:'Cash payment',payment_method:'Cash'});
 await post('/expenses',{date,category:'Meals',amount:300,note:'Cash expense',payment_method:'Cash'});
 daily=await request('/roznamcha?date='+date);
 eq(daily.cash_received,1200,'Cash paid by customer counted');
 eq(daily.cash_paid,300,'Cash expense counted');
 eq(daily.net_cash,900,'Daily net cash without carryover');
 const next=await request('/roznamcha?date=2026-11-26');
 eq(next.cash_received,0,'No prior-day carryover');
 eq(next.cash_paid,0,'No prior-day cash out');
 eq(next.net_cash,0,'Next day resets to zero');
 const monthly=await request('/sales/monthly-products?month=2026-11');
 const row=monthly.rows.find(r=>r.product==='Atta'&&Number(r.bag_size)===20);
 assert.ok(row,'Monthly Atta 20K row exists');
 eq(row.bags,10,'Monthly product quantity');
 eq(row.amount,5000,'Monthly product amount is full sale value');
 assert.ok(fs.existsSync(dbPath),'Database retained on disk');
 console.log('PASS: daily-only Roznamcha, partial sale cash, cash vs bank, monthly sales, database persistence');
}catch(err){
 console.error(err);
 console.error(logs.slice(-5000));
 process.exitCode=1;
}finally{
 server.kill();
 await pause(100);
 fs.rmSync(dir,{recursive:true,force:true});
}
