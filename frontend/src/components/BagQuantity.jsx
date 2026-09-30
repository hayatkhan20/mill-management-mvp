import { num } from '../utils';

export default function BagQuantity({ bags20=0, bags40=0 }) {
  return (
    <span className="record-bags">
      <span className="bag-count">{num(bags20)}</span>
      <span className="bag-type">×20KG</span>
      <span className="bag-separator"> + </span>
      <span className="bag-count">{num(bags40)}</span>
      <span className="bag-type">×40KG</span>
    </span>
  );
}
