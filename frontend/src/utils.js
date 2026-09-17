export const money = (n) => `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
export const num = (n) => Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
export const today = () => new Date().toISOString().slice(0, 10);
export const monthNow = () => new Date().toISOString().slice(0, 7);
