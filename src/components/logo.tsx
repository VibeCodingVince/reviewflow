import { cn } from "@/lib/utils";

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="14" width="5" height="8" rx="1.5" fill="currentColor" opacity="0.6" />
      <rect x="9.5" y="9" width="5" height="13" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="17" y="4" width="5" height="18" rx="1.5" fill="currentColor" />
      <path d="M18.5 9 L20.5 11.5 L24 7" stroke="hsl(var(--gold))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = "default", className }: { size?: "sm" | "default"; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "bg-primary rounded-lg flex items-center justify-center",
        size === "sm" ? "w-7 h-7" : "w-8 h-8"
      )}>
        <LogoIcon className={cn(
          "text-white",
          size === "sm" ? "w-4 h-4" : "w-5 h-5"
        )} />
      </div>
      <span className={cn(
        "font-display text-foreground",
        size === "sm" ? "text-lg" : "text-xl"
      )}>
        RankClerk
      </span>
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("bg-primary rounded-lg flex items-center justify-center", className)}>
      <LogoIcon className="w-5 h-5 text-white" />
    </div>
  );
}
