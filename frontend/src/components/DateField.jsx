import { useEffect, useState } from 'react';

export const formatDateDMY = (iso='') => {
  const match=String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(iso||'');
};

const toIso=(text)=>{
  const match=String(text).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!match) return '';
  const day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
  const d=new Date(Date.UTC(year,month-1,day));
  if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day) return '';
  return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
};

const formatTyping=(value)=>{
  const digits=String(value).replace(/\D/g,'').slice(0,8);
  if(digits.length<=2) return digits;
  if(digits.length<=4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
};

export default function DateField({value,onChange,required=false}){
  const [text,setText]=useState(formatDateDMY(value));
  useEffect(()=>setText(formatDateDMY(value)),[value]);

  const change=(e)=>{
    const next=formatTyping(e.target.value);
    setText(next);
    const iso=toIso(next);
    if(iso) onChange(iso);
  };

  const blur=()=>{
    const iso=toIso(text);
    if(!iso) setText(formatDateDMY(value));
  };

  return <input required={required} inputMode="numeric" placeholder="DD/MM/YYYY" value={text} onChange={change} onBlur={blur}/>;
}
