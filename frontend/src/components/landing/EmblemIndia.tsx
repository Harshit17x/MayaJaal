export function EmblemIndia({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-800"
      >
        {/* Ashoka Stambh / Lions Silhouette & Abacus */}
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.85">
          {/* Top Center Lion Crown */}
          <path d="M42 12 C42 6, 58 6, 58 12 C62 14, 62 20, 58 24 C58 28, 42 28, 42 24 C38 20, 38 14, 42 12 Z" />
          {/* Left Lion Head */}
          <path d="M28 20 C24 14, 34 10, 40 18 C38 24, 32 28, 28 26 Z" />
          {/* Right Lion Head */}
          <path d="M72 20 C76 14, 66 10, 60 18 C62 24, 68 28, 72 26 Z" />
          {/* Lion Mane and Central Torso */}
          <path d="M35 28 C30 38, 30 52, 38 64 L62 64 C70 52, 70 38, 65 28 C58 32, 42 32, 35 28 Z" />
          {/* Base Capital / Bell */}
          <path d="M26 66 L74 66 C72 74, 66 80, 50 82 C34 80, 28 74, 26 66 Z" />
          {/* Abacus frieze */}
          <rect x="22" y="82" width="56" height="10" rx="2" fill="currentColor" />
          {/* Ashoka Chakra in Abacus */}
          <circle cx="50" cy="87" r="4" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
          {/* Plinth Base */}
          <path d="M18 94 L82 94 L86 104 L14 104 Z" fill="currentColor" />
        </g>
        {/* Satyameva Jayate Banner */}
        <text
          x="50"
          y="114"
          textAnchor="middle"
          fontSize="7.5"
          fontFamily="serif"
          fontWeight="bold"
          fill="currentColor"
          letterSpacing="0.05em"
        >
          सत्यमेव जयते
        </text>
      </svg>
    </div>
  );
}

export default EmblemIndia;
