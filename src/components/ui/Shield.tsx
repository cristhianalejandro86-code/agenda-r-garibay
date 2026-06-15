// ════════════════════════════════════════════════════════════════════
//  Escudo RG — emblema ORIGINAL inspirado en la estética de club
//  (azul marino + franjas verticales blancas + banda celeste + estrella).
//  No reproduce el escudo oficial de Alianza Lima; es un diseño propio.
//  Reemplaza a los antiguos logos PNG (alianza-lima.png / shp.png).
// ════════════════════════════════════════════════════════════════════

interface ShieldProps {
  /** Lado del escudo en px (el alto es 1.16× para la forma de crest). */
  size?: number
  className?: string
}

export function Shield({ size = 40, className = '' }: ShieldProps) {
  // ids únicos por tamaño para evitar colisión de <defs> si hay varios en pantalla
  const uid = 'rg' + Math.round(size)
  const crest = 'M50 3 L92 17 V57 C92 84 73 102 50 113 C27 102 8 84 8 57 V17 Z'

  return (
    <svg
      width={size}
      height={size * 1.16}
      viewBox="0 0 100 116"
      fill="none"
      className={className}
      role="img"
      aria-label="Escudo RG"
    >
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E5BB8" />
          <stop offset="100%" stopColor="#08214F" />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <path d={crest} />
        </clipPath>
      </defs>

      {/* Cuerpo del escudo */}
      <path d={crest} fill={`url(#${uid}g)`} />

      {/* Franjas verticales + banda celeste (recortadas al escudo) */}
      <g clipPath={`url(#${uid}c)`}>
        {[14, 30, 46, 62, 78].map((x) => (
          <rect key={x} x={x} y={0} width={6} height={116} fill="#fff" opacity={0.12} />
        ))}
        <path d="M8 67 L50 81 L92 67 L92 79 L50 93 L8 79 Z" fill="#5BA4E6" opacity={0.92} />
      </g>

      {/* Borde celeste */}
      <path d={crest} fill="none" stroke="#9FCBF2" strokeWidth={2.5} />

      {/* Estrella superior */}
      <path
        d="M50 11 l2.3 5.6 6 .4 -4.6 3.9 1.5 5.9 -5.2-3.2 -5.2 3.2 1.5-5.9 -4.6-3.9 6-.4 Z"
        fill="#fff"
        opacity={0.92}
      />

      {/* Monograma RG */}
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="'Barlow Condensed', sans-serif"
        fontWeight={800}
        fontSize={38}
        fill="#fff"
        letterSpacing="-1"
      >
        RG
      </text>
    </svg>
  )
}
