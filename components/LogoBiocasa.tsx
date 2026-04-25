interface LogoBiocasaProps {
  className?: string
}

export default function LogoBiocasa({ className = 'h-10' }: LogoBiocasaProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-dourado-400/20 border border-dourado-400/40">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path
            d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
            fill="#C9A84C"
            fillOpacity="0.3"
            stroke="#C9A84C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V15H15V21"
            stroke="#C9A84C"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-dourado-400 font-bold text-lg tracking-wider">BIOCASA</span>
        <span className="text-escuro-200 text-[10px] uppercase tracking-widest">Portal Imobiliário</span>
      </div>
    </div>
  )
}
