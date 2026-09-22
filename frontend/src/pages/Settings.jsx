import { useState } from 'react';
import Products from './Products';
import OpeningData from './OpeningData';
import { Card } from '../components/Common';
import { Moon, Sun } from 'lucide-react';
import { useUiPreferences } from '../context/UiPreferences';

export default function Settings(){
  const [tab,setTab]=useState('preferences');
  const {theme,setTheme,language,setLanguage,t}=useUiPreferences();

  return <>
    <div className="section-tabs">
      <button className={tab==='preferences'?'primary':'secondary'} onClick={()=>setTab('preferences')}>{t('appearance','Appearance')}</button>
      <button className={tab==='products'?'primary':'secondary'} onClick={()=>setTab('products')}>{t('products','Products')}</button>
      <button className={tab==='opening'?'primary':'secondary'} onClick={()=>setTab('opening')}>{t('openingData','Opening Data')}</button>
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
  </>;
}
