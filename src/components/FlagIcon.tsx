/**
 * Bandeiras em SVG inline.
 *
 * Emoji de bandeira (🇧🇷/🇵🇾) NÃO renderiza no Windows — são pares de "regional
 * indicators" e a Segoe UI Emoji não tem glifos de bandeira, então o sistema
 * mostra as letras (BR/PY) em caixinha. SVG resolve em qualquer plataforma.
 */

export function FlagBR({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-label="Brasil" role="img">
      <rect width="28" height="20" fill="#009B3A" />
      <path d="M14 2.6 25.4 10 14 17.4 2.6 10Z" fill="#FEDF00" />
      <circle cx="14" cy="10" r="4.2" fill="#002776" />
      <path d="M9.9 8.6a10 10 0 0 1 8.2 2.2" stroke="#fff" strokeWidth="1.1" fill="none" />
    </svg>
  );
}

export function FlagPY({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-label="Paraguay" role="img">
      <rect width="28" height="20" fill="#fff" />
      <rect width="28" height="6.67" fill="#D52B1E" />
      <rect y="13.33" width="28" height="6.67" fill="#0038A8" />
      <circle cx="14" cy="10" r="2.6" fill="#FEDF00" stroke="#0038A8" strokeWidth="0.5" />
      <circle cx="14" cy="10" r="1.1" fill="#009B3A" />
    </svg>
  );
}

/** Bandeira do idioma ativo: PT = Brasil, ES = Paraguai. */
export function LanguageFlag({ language, className }: { language: "pt" | "es"; className?: string }) {
  return language === "pt" ? <FlagBR className={className} /> : <FlagPY className={className} />;
}
