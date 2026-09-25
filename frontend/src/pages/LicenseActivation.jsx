import { useState } from 'react';
import { Check, Copy, KeyRound, MessageCircle } from 'lucide-react';
import { api } from '../api';

export default function LicenseActivation({status,onActivated}){
  const [code,setCode]=useState('');
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);

  const copyId=async()=>{
    try{
      await navigator.clipboard.writeText(status.installation_id||'');
      setCopied(true);
      setTimeout(()=>setCopied(false),1500);
    }catch{}
  };

  const activate=async e=>{
    e.preventDefault();
    setError('');
    try{
      const result=await api.post('/license/activate',{activation_code:code});
      onActivated(result);
    }catch(e){
      setError(e.message);
    }
  };

  const whatsappText=encodeURIComponent(
    `Mill Manager activation request\nInstallation ID: ${status.installation_id||''}`
  );

  return <div className="license-screen">
    <div className="license-card">
      <div className="license-icon"><KeyRound size={28}/></div>
      <h1>Activate Mill Manager</h1>
      <p>This copy is licensed for one Windows computer.</p>

      <div className="installation-box">
        <span>Installation ID</span>
        <strong>{status.installation_id}</strong>
        <button type="button" className="secondary small" onClick={copyId}>
          {copied?<><Check size={15}/> Copied</>:<><Copy size={15}/> Copy ID</>}
        </button>
      </div>

      <a
        className="secondary license-whatsapp"
        href={`https://wa.me/923065726063?text=${whatsappText}`}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={17}/> Send Installation ID on WhatsApp
      </a>

      <form onSubmit={activate} className="license-form">
        <label>Activation Code
          <textarea
            required
            value={code}
            onChange={e=>setCode(e.target.value)}
            placeholder="Paste the activation code provided by the developer"
          />
        </label>
        {error&&<div className="error-box">{error}</div>}
        <button className="primary">Activate Software</button>
      </form>

      <div className="license-support">
        Support: <a href="https://wa.me/923065726063" target="_blank" rel="noreferrer">+92 306 5726063</a>
      </div>
    </div>
  </div>;
}
