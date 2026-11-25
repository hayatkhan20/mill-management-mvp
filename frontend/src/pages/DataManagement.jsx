import { useState } from 'react';
import { api } from '../api';
import { Card, ErrorBox, SuccessBox } from '../components/Common';

const CONFIRM='RESET ALL MILL DATA';

export default function DataManagement(){
  const [confirmation,setConfirmation]=useState('');
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');
  const reset=async e=>{
    e.preventDefault();setError('');setResult(null);
    if(confirmation!==CONFIRM){setError('Confirmation text does not match.');return}
    if(!window.confirm('This permanently clears all business records on this computer. A database backup will be created first. Continue?'))return;
    setBusy(true);
    try{
      const r=await api.post('/data/reset',{confirmation});
      setResult(r);setConfirmation('');
    }catch(e){setError(e.message)}finally{setBusy(false)}
  };
  return <Card>
    <h3>Start Fresh</h3>
    <p><strong>Warning:</strong> Reset deletes all business records after saving a database backup. License, products, and backups are preserved.</p>
    <ErrorBox error={error}/>
    <SuccessBox text={result?.ok?`Records reset. Backup saved: ${result.backup_file}. Software activation and product catalog preserved.`:''}/>
    <form className="form-grid" onSubmit={reset}>
      <label className="span-2">Type <strong>{CONFIRM}</strong> to confirm
        <input value={confirmation} autoComplete="off" onChange={e=>setConfirmation(e.target.value)}/>
      </label>
      <div className="span-2">
        <button className="primary" type="submit" disabled={busy||confirmation!==CONFIRM}>
          {busy?'Creating backup and resetting...':'Backup and Reset All Business Data'}
        </button>
      </div>
    </form>
  </Card>;
}
