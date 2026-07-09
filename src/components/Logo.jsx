import { Link } from "react-router-dom";

export default function Logo({ compact = false }) {
  return (
    <Link className={`brand ${compact ? "brand--compact" : ""}`} to="/" aria-label="Design Harmony home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        <strong>Design</strong>
        <em>Harmony</em>
      </span>
    </Link>
  );
}
