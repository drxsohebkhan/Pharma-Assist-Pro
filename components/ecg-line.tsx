export function EcgLine({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 80"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
      fill="none"
    >
      <path
        className="ecg-path"
        d="M0,40 L60,40 L80,40 L92,18 L104,62 L116,10 L128,58 L140,40 L200,40 L240,40 L252,22 L264,60 L276,12 L288,56 L300,40 L370,40 L410,40 L422,20 L434,62 L446,8 L458,58 L470,40 L540,40 L600,40"
        stroke="#00d4aa"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
