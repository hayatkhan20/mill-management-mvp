import { forwardRef } from 'react';

// Display grouping commas while keeping a plain numeric string in React state.
// Backend continues to receive values like "1000000", not "1,000,000".
export const normalizeAmount = value => {
  const raw=String(value??'').replace(/,/g,'').replace(/[^0-9.]/g,'');
  const dot=raw.indexOf('.');
  if(dot===-1) return raw;
  return raw.slice(0,dot+1)+raw.slice(dot+1).replace(/\./g,'').slice(0,2);
};

export const formatAmountInput = value => {
  const raw=normalizeAmount(value);
  if(!raw) return '';
  const [integer,decimal]=raw.split('.');
  const grouped=(integer||'0').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  return raw.includes('.')?grouped+'.'+(decimal??''):grouped;
};

const MoneyInput=forwardRef(function MoneyInput({value,onChange,...props},ref){
  return <input
    {...props}
    ref={ref}
    type="text"
    inputMode="decimal"
    autoComplete="off"
    value={formatAmountInput(value)}
    onChange={e=>onChange?.(normalizeAmount(e.target.value))}
  />;
});
export default MoneyInput;
