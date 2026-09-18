export const money = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
export const num = (n) => Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
const localIso = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
};
export const today = () => localIso().slice(0, 10);
export const monthNow = () => localIso().slice(0, 7);
