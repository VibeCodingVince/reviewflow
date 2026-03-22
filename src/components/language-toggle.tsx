"use client";

import { useI18n } from "@/lib/i18n/context";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "fr" : "en")}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-gray-200 hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-xs font-body font-medium text-muted-foreground hover:text-foreground"
      aria-label={locale === "en" ? "Switch to French" : "Switch to English"}
    >
      <span className={locale === "en" ? "text-foreground font-semibold" : ""}>
        EN
      </span>
      <span className="text-gray-300">|</span>
      <span className={locale === "fr" ? "text-foreground font-semibold" : ""}>
        FR
      </span>
    </button>
  );
}
