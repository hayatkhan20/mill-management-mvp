import { useEffect, useState } from 'react';
import Products from './Products';
import OpeningData from './OpeningData';
import { Card } from '../components/Common';
import { ExternalLink, Globe2, Linkedin, MessageCircle, Moon, Sun } from 'lucide-react';
import { useUiPreferences } from '../context/UiPreferences';
import { api } from '../api';

export default function Settings(){
  const [tab,setTab]=useState('preferences');
  const [license,setLicense]=useState(null);
  const {theme,setTheme,language,setLanguage,t}=useUiPreferences();

  useEffect(()=>{
    api.get('/license/status').then(setLicense).catch(()=>{});
  },[]);

  return <>
    <div className="section-tabs">
      <button className={tab==='preferences'?'primary':'secondary'} onClick={()=>setTab('preferences')}>{t('appearance','Appearance')}</button>
      <button className={tab==='products'?'primary':'secondary'} onClick={()=>setTab('products')}>{t('products','Products')}</button>
      <button className={tab==='opening'?'primary':'secondary'} onClick={()=>setTab('opening')}>{t('openingData','Opening Data')}</button>
      <button className={tab==='about'?'primary':'secondary'} onClick={()=>setTab('about')}>{t('about','About')}</button>
    </div>

    {tab==='preferences'&&<Card>
      <h3>{t('appearance','Appearance')}</h3>
      <div className="preferences-grid">
        <div className="preference-block">
          <span className="field-label">{t('theme','Theme')}</span>
          <div className="preference-options">
            <button type="button" className={theme==='light'?'preference-option active':'preference-option'} onClick={()=>setTheme('light')}><Sun size={18}/>{t('light','Light')}</button>
            <button type="button" className={theme==='dark'?'preference-option active':'preference-option'} onClick={()=>setTheme('dark')}><Moon size={18}/>{t('dark','Dark')}</button>
          </div>
        </div>

        <div className="preference-block">
          <span className="field-label">{t('language','Language')}</span>
          <div className="preference-options">
            <button type="button" className={language==='en'?'preference-option active':'preference-option'} onClick={()=>setLanguage('en')}>{t('english','English')}</button>
            <button type="button" className={language==='ur'?'preference-option active':'preference-option'} onClick={()=>setLanguage('ur')}>{t('urdu','Urdu')}</button>
          </div>
        </div>
      </div>
    </Card>}

    {tab==='products'&&<Products/>}
    {tab==='opening'&&<OpeningData/>}

    {tab==='about'&&<Card className="about-software-card">
      <div className="about-software">
        <div>
          <span className="about-eyebrow">{t('software','Software')}</span>
          <h2>Mill Management System</h2>
          <p>{t('softwareVersion','Version')} 1.0</p>
          {license?.licensed&&<div className="license-summary">
            <span><strong>Licensed for:</strong> {license.client_name}</span>
            <span><strong>License:</strong> Single Computer, Non-transferable</span>
            <span><strong>Installation ID:</strong> {license.installation_id}</span>
          </div>}
        </div>

        <div className="about-divider"/>

        <div className="developer-profile">
          <span className="about-eyebrow">{t('developedMaintainedBy','Developed & Maintained by')}</span>
          <h3>Engineer Hayat Ullah Abid</h3>
          <p>{t('softwareGISEngineer','Software & GIS Engineer')}</p>

          <div className="developer-profile-links">
            <a href="https://www.linkedin.com/in/hayat-gis" target="_blank" rel="noreferrer">
              <Linkedin size={17}/> LinkedIn <ExternalLink size={13}/>
            </a>
            <a href="https://hayatkhan20.github.io/hayat" target="_blank" rel="noreferrer">
              <Globe2 size={17}/> {t('portfolio','Portfolio')} <ExternalLink size={13}/>
            </a>
            <a href="https://wa.me/923065726063" target="_blank" rel="noreferrer">
              <MessageCircle size={17}/> WhatsApp <ExternalLink size={13}/>
            </a>
          </div>
        </div>
      </div>
    </Card>}
  </>;
}
