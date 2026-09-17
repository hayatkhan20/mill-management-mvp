export function Card({ children, className = '' }) { return <div className={`card ${className}`}>{children}</div>; }
export function PageHeader({ title, text, action }) {
  return <div className="page-header"><div><h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div>;
}
export function Empty({ text = 'No records yet.' }) { return <div className="empty">{text}</div>; }
export function ErrorBox({ error }) { return error ? <div className="alert error">{error}</div> : null; }
export function SuccessBox({ text }) { return text ? <div className="alert success">{text}</div> : null; }
