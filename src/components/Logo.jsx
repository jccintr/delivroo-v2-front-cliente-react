/** marca do Delivroo (mesmo símbolo do painel da loja e da landing page) */
export function LogoMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#FFE7D4" />
      <path d="M18 24C18 20.6863 20.6863 18 24 18H40C43.3137 18 46 20.6863 46 24C46 24.5523 45.5523 25 45 25H19C18.4477 25 18 24.5523 18 24Z" fill="#FF5A1F" />
      <rect x="17" y="29" width="30" height="5" rx="2.5" fill="#FF5A1F" />
      <rect x="17" y="37" width="30" height="5" rx="2.5" fill="#FF5A1F" />
      <rect x="20" y="45" width="24" height="4" rx="2" fill="#E24312" />
    </svg>
  );
}

export default function Logo({ markClassName = 'size-9', textClassName = 'text-2xl', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className={`${textClassName} font-extrabold leading-none tracking-tight text-ink`}>Delivroo</span>
    </span>
  );
}
