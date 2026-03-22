"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  Star,
  Camera,
  Globe,
  Clock,
  Tag,
  TrendingUp,
  ArrowRight,
  Check,
  Lock,
  Sparkles,
  MapPin,
  Zap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import type { AuditScoreBreakdown, PlaceData } from "@/lib/audit-score";
import type { TranslationKeys } from "@/lib/i18n/translations";

type PageState = "search" | "loading" | "preview" | "full";

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  type: string;
}

// ---------- Animation Variants ----------
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ---------- Score Gauge SVG ----------
function ScoreGauge({
  score,
  grade,
  animated,
  gradeLabel,
}: {
  score: number;
  grade: string;
  animated: boolean;
  gradeLabel: string;
}) {
  const radius = 88;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100;
  const dashOffset = circumference * (1 - progress);

  const gradeColor: Record<string, string> = {
    A: "#059669",
    B: "#0d9488",
    C: "#d97706",
    D: "#ea580c",
    F: "#dc2626",
  };

  const color = gradeColor[grade] || "#059669";

  return (
    <div className="relative w-[220px] h-[220px] mx-auto">
      <svg
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${(radius + stroke) * 2} ${(radius + stroke) * 2}`}
      >
        {/* Background track */}
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="hsl(150 10% 92%)"
          strokeWidth={stroke}
        />
        {/* Score fill */}
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? dashOffset : circumference}
          style={{
            transition: animated
              ? "stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-6xl" style={{ color }}>
          {animated ? <AnimatedCounter target={score} /> : score}
        </span>
        <span
          className="font-body text-sm font-semibold uppercase tracking-widest mt-1"
          style={{ color }}
        >
          {gradeLabel} {grade}
        </span>
      </div>
    </div>
  );
}

// ---------- Animated Counter ----------
function AnimatedCounter({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const duration = 1800;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return <>{current}</>;
}

// ---------- Mini Category Card (preview — score only) ----------
function MiniCategoryCard({
  label,
  score,
  max,
  icon: Icon,
}: {
  label: string;
  score: number;
  max: number;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
}) {
  const pct = (score / max) * 100;
  let barColor = "bg-emerald-500";
  if (pct < 40) barColor = "bg-red-500";
  else if (pct < 60) barColor = "bg-amber-500";
  else if (pct < 80) barColor = "bg-teal-500";

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
      variants={fadeUp}
      transition={{ duration: 0.5, ease }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="font-body font-semibold text-sm text-foreground">
            {label}
          </span>
        </div>
        <span className="font-display text-xl text-foreground">
          {score}
          <span className="text-muted-foreground text-sm font-body">
            /{max}
          </span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </motion.div>
  );
}

// ---------- Full Category Card (after email — with details + recommendations) ----------
function FullCategoryCard({
  label,
  score,
  max,
  details,
  recommendations,
  recommendationsLabel,
  icon: Icon,
}: {
  label: string;
  score: number;
  max: number;
  details: string;
  recommendations: string[];
  recommendationsLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
}) {
  const pct = (score / max) * 100;
  let barColor = "bg-emerald-500";
  if (pct < 40) barColor = "bg-red-500";
  else if (pct < 60) barColor = "bg-amber-500";
  else if (pct < 80) barColor = "bg-teal-500";

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
      variants={fadeUp}
      transition={{ duration: 0.5, ease }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="font-body font-semibold text-sm text-foreground">
            {label}
          </span>
        </div>
        <span className="font-display text-xl text-foreground">
          {score}
          <span className="text-muted-foreground text-sm font-body">
            /{max}
          </span>
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground font-body">{details}</p>

      {recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-body font-semibold text-foreground mb-2">
            {recommendationsLabel}
          </p>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-body leading-relaxed">
                  {rec}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// ---------- Main Page ----------
export default function AuditPage() {
  const { t } = useI18n();
  const [state, setState] = useState<PageState>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<SearchResult | null>(
    null
  );
  const [scoreData, setScoreData] = useState<{
    score: number;
    grade: string;
    breakdown: AuditScoreBreakdown;
    businessData: PlaceData;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchPlaces = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/audit/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (data.places) {
        setResults(data.places);
        setShowDropdown(true);
      }
    } catch {
      console.error("Search failed");
    }
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => searchPlaces(value), 300);
    },
    [searchPlaces]
  );

  const handleSelectBusiness = useCallback(async (place: SearchResult) => {
    setSelectedBusiness(place);
    setShowDropdown(false);
    setQuery(place.name);
    setState("loading");

    // Staged loading animation
    const steps = [
      "Checking review presence...",
      "Evaluating visual content...",
      "Analyzing profile completeness...",
      "Measuring engagement signals...",
      "Computing health score...",
    ];
    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const res = await fetch("/api/audit/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: place.placeId }),
      });
      const data = await res.json();

      if (data.score !== undefined) {
        setScoreData(data);
        setState("preview");
      } else {
        setState("search");
      }
    } catch {
      setState("search");
    }
  }, []);

  const handleEmailCapture = useCallback(async () => {
    if (!email || !email.includes("@")) {
      setEmailError(t.audit.emailError);
      return;
    }
    setEmailError("");
    setIsCapturing(true);

    try {
      await fetch("/api/audit/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          placeId: selectedBusiness?.placeId,
          businessName: selectedBusiness?.name,
          score: scoreData?.score,
          breakdown: scoreData?.breakdown,
        }),
      });
      setState("full");
    } catch {
      setEmailError(t.audit.somethingWrong);
    } finally {
      setIsCapturing(false);
    }
  }, [email, selectedBusiness, scoreData, t]);

  const loadingSteps = [
    t.audit.loadingStep1,
    t.audit.loadingStep2,
    t.audit.loadingStep3,
    t.audit.loadingStep4,
    t.audit.loadingStep5,
  ];

  const trustSignals = [
    t.audit.signal1,
    t.audit.signal2,
    t.audit.signal3,
  ];

  const unlockFeatures = [
    t.audit.unlockF1,
    t.audit.unlockF2,
    t.audit.unlockF3,
    t.audit.unlockF4,
  ];

  const categoryIcons = {
    rating: Star,
    reviewVolume: TrendingUp,
    visualPresence: Camera,
    profileCompleteness: Globe,
    engagement: Clock,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.features}
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.pricing}
            </Link>
            <Link
              href="/login"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.signIn}
            </Link>
            <LanguageToggle />
            <Link href="/signup">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button className="h-9 px-5 rounded-full bg-primary text-white font-body text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20">
                  {t.nav.getStarted}
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------- SEARCH STATE ---------- */}
      {state === "search" && (
        <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-20 left-0 w-96 h-96 bg-primary/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl" />

          <motion.div
            className="max-w-2xl mx-auto px-6 text-center"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8"
              variants={fadeUp}
              transition={{ duration: 0.5, ease }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-body font-medium text-primary uppercase tracking-wider">
                {t.audit.badge}
              </span>
            </motion.div>

            <motion.h1
              className="font-display text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] text-foreground mb-6"
              variants={fadeUp}
              transition={{ duration: 0.6, ease }}
            >
              {t.audit.title1}{" "}
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                {t.audit.title2}
              </span>
              ?
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed mb-10"
              variants={fadeUp}
              transition={{ duration: 0.6, ease }}
            >
              {t.audit.subtitle}
            </motion.p>

            {/* Search input */}
            <motion.div
              className="relative z-10 max-w-lg mx-auto"
              ref={dropdownRef}
              variants={fadeUp}
              transition={{ duration: 0.6, ease }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t.audit.searchPlaceholder}
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  className="h-14 pl-12 pr-4 rounded-2xl border-gray-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-base font-body focus:shadow-[0_8px_30px_rgba(27,67,50,0.12)] focus:border-primary/30 transition-all"
                />
                {/* Subtle pulse ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 animate-pulse pointer-events-none" />
              </div>

              {/* Dropdown */}
              {showDropdown && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.1)] overflow-hidden z-50">
                  {results.map((place) => (
                    <button
                      key={place.placeId}
                      onClick={() => handleSelectBusiness(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-body font-medium text-sm text-foreground">
                          {place.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-body">
                          {place.address}
                        </p>
                      </div>
                      {place.type && (
                        <span className="ml-auto text-xs text-muted-foreground font-body bg-gray-50 px-2 py-0.5 rounded-full flex-shrink-0">
                          {place.type}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Trust signals — relative with lower z so dropdown covers them */}
            <motion.div
              className="relative z-0 flex flex-wrap items-center justify-center gap-6 mt-10"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {trustSignals.map((text) => (
                <motion.div
                  key={text}
                  className="flex items-center gap-1.5"
                  variants={fadeUp}
                  transition={{ duration: 0.5, ease }}
                >
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-body text-muted-foreground">
                    {text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ---------- LOADING STATE ---------- */}
      {state === "loading" && (
        <section className="pt-32 pb-20 md:pt-44 md:pb-32">
          <div className="max-w-md mx-auto px-6 text-center">
            <motion.div
              className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-10"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, ease }}
            >
              <p className="font-body font-semibold text-foreground mb-8">
                {t.audit.analyzing}{" "}
                <span className="text-primary">
                  {selectedBusiness?.name}
                </span>
              </p>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${((loadingStep + 1) / loadingSteps.length) * 100}%`,
                  }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {loadingSteps.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      i <= loadingStep
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-4"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        i < loadingStep
                          ? "bg-primary"
                          : i === loadingStep
                            ? "bg-primary/20 ring-2 ring-primary ring-offset-2"
                            : "bg-gray-100"
                      }`}
                    >
                      {i < loadingStep && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-body ${
                        i <= loadingStep
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ---------- PREVIEW / FULL STATE ---------- */}
      {(state === "preview" || state === "full") && scoreData && (
        <section className="pt-28 pb-20 md:pt-36 md:pb-32">
          <div className="max-w-4xl mx-auto px-6">
            {/* Business header */}
            <motion.div
              className="text-center mb-10"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease }}
            >
              <p className="text-sm font-body text-muted-foreground mb-1">
                {t.audit.healthScoreFor}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-1">
                {scoreData.businessData.name}
              </h1>
              <p className="text-sm font-body text-muted-foreground flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {scoreData.businessData.address}
              </p>
              {scoreData.businessData.category && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-primary/5 text-xs font-body text-primary">
                  <Tag className="w-3 h-3" />
                  {scoreData.businessData.category}
                </span>
              )}
            </motion.div>

            {/* Score gauge */}
            <motion.div
              className="mb-12"
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease, delay: 0.15 }}
            >
              <ScoreGauge
                score={scoreData.score}
                grade={scoreData.grade}
                animated={true}
                gradeLabel={t.audit.grade}
              />
            </motion.div>

            {/* ---------- PREVIEW: Mini category cards (score only) ---------- */}
            {state === "preview" && (
              <>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  {(
                    Object.entries(scoreData.breakdown) as [string, unknown][]
                  )
                    .filter(([key]) => key !== "total" && key !== "grade")
                    .map(([key, cat], index) => {
                      const category = cat as {
                        score: number;
                        max: number;
                        label: string;
                      };
                      const Icon =
                        categoryIcons[key as keyof typeof categoryIcons] || Star;
                      return (
                        <MiniCategoryCard
                          key={key}
                          label={category.label}
                          score={category.score}
                          max={category.max}
                          icon={Icon}
                          index={index}
                        />
                      );
                    })}
                </motion.div>

                {/* GATED SECTION */}
                <div className="relative">
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="filter blur-[8px] pointer-events-none select-none p-8 bg-gray-50 space-y-6">
                      <div>
                        <h3 className="font-display text-2xl text-foreground mb-3">
                          {t.audit.yourProfileSummary}
                        </h3>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-full" />
                          <div className="h-4 bg-gray-200 rounded w-5/6" />
                          <div className="h-4 bg-gray-200 rounded w-4/5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-display text-2xl text-foreground mb-3">
                          {t.audit.quickWins}
                        </h3>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-5/6" />
                          <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-display text-2xl text-foreground mb-3">
                          {t.audit.howYouCompare}
                        </h3>
                        <div className="space-y-3">
                          <div className="h-8 bg-gray-200 rounded w-full" />
                          <div className="h-8 bg-gray-200 rounded w-full" />
                          <div className="h-8 bg-gray-200 rounded w-full" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-display text-2xl text-foreground mb-3">
                          {t.audit.detailedBreakdown} &amp; {t.audit.recommendations}
                        </h3>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-full" />
                          <div className="h-4 bg-gray-200 rounded w-4/5" />
                          <div className="h-4 bg-gray-200 rounded w-5/6" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    </div>

                    {/* Email capture overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                      <motion.div
                        className="bg-white rounded-2xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.1)] p-8 max-w-md w-full mx-4"
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.5, ease, delay: 0.3 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-display text-2xl text-foreground text-center mb-2">
                          {t.audit.unlockTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground font-body text-center mb-6">
                          {t.audit.unlockDesc}{" "}
                          <span className="font-medium text-foreground">
                            {scoreData.businessData.name}
                          </span>
                        </p>

                        <div className="space-y-3">
                          <div>
                            <Input
                              type="email"
                              placeholder={t.audit.emailPlaceholder}
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError("");
                              }}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleEmailCapture()
                              }
                              className="h-12 rounded-xl font-body text-sm"
                            />
                            {emailError && (
                              <p className="text-xs text-red-500 font-body mt-1">
                                {emailError}
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={handleEmailCapture}
                            disabled={isCapturing}
                            className="w-full h-12 rounded-xl bg-primary text-white font-body font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                          >
                            {isCapturing ? t.audit.unlocking : t.audit.unlockButton}
                            {!isCapturing && (
                              <ArrowRight className="w-4 h-4 ml-2" />
                            )}
                          </Button>
                        </div>

                        <div className="mt-4 space-y-2">
                          {unlockFeatures.map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-2"
                            >
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span className="text-xs text-muted-foreground font-body">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="text-[10px] text-muted-foreground font-body text-center mt-4">
                          {t.audit.noSpam}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---------- FULL RESULTS (after email) ---------- */}
            {state === "full" && scoreData && (
              <>
                {/* AI Summary */}
                <motion.div
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-8 mb-8"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease }}
                >
                  <h3 className="font-display text-2xl text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {t.audit.yourProfileSummary}
                  </h3>
                  <p className="text-sm text-foreground/80 font-body leading-relaxed">
                    {generateSummary(scoreData.businessData, scoreData.breakdown)}
                  </p>
                </motion.div>

                {/* Quick Wins */}
                <motion.div
                  className="bg-gradient-to-br from-primary/[0.03] to-emerald-50 rounded-2xl border border-primary/10 p-8 mb-8"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease, delay: 0.1 }}
                >
                  <h3 className="font-display text-2xl text-foreground mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    {t.audit.quickWins}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    {t.audit.quickWinsSubtitle}
                  </p>
                  <div className="space-y-3">
                    {getAllRecommendations(scoreData.breakdown)
                      .slice(0, 3)
                      .map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-white rounded-xl p-4 border border-primary/5"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-body font-bold text-primary">
                              {i + 1}
                            </span>
                          </div>
                          <span className="text-sm font-body text-foreground leading-relaxed">
                            {rec}
                          </span>
                        </div>
                      ))}
                  </div>
                </motion.div>

                {/* How You Compare */}
                <motion.div
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-8 mb-8"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease, delay: 0.2 }}
                >
                  <h3 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {t.audit.howYouCompare}
                  </h3>
                  <div className="space-y-5">
                    {getBenchmarks(scoreData.businessData, t).map((bench, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-body font-medium text-foreground">
                            {bench.label}
                          </span>
                          <div className="flex items-center gap-3 text-xs font-body">
                            <span className="text-muted-foreground">
                              {t.audit.avg}: {bench.benchmark}
                            </span>
                            <span className={bench.isAbove ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                              {t.audit.you}: {bench.yours}
                            </span>
                          </div>
                        </div>
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                          {/* Benchmark marker */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                            style={{ left: `${bench.benchmarkPct}%` }}
                          />
                          {/* Your bar */}
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${bench.isAbove ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${bench.yoursPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground font-body mt-2">
                      {t.audit.benchmarkNote}
                    </p>
                  </div>
                </motion.div>

                {/* Full Category Breakdown */}
                <motion.h3
                  className="font-display text-2xl text-foreground mb-4"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease, delay: 0.3 }}
                >
                  {t.audit.detailedBreakdown}
                </motion.h3>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  {(
                    Object.entries(scoreData.breakdown) as [string, unknown][]
                  )
                    .filter(([key]) => key !== "total" && key !== "grade")
                    .map(([key, cat], index) => {
                      const category = cat as {
                        score: number;
                        max: number;
                        label: string;
                        details: string;
                        recommendations: string[];
                      };
                      const Icon =
                        categoryIcons[key as keyof typeof categoryIcons] || Star;
                      return (
                        <FullCategoryCard
                          key={key}
                          label={category.label}
                          score={category.score}
                          max={category.max}
                          details={category.details}
                          recommendations={category.recommendations}
                          recommendationsLabel={t.audit.recommendations}
                          icon={Icon}
                          index={index}
                        />
                      );
                    })}
                </motion.div>

                {/* CTA Section */}
                <motion.div
                  className="relative rounded-3xl bg-primary p-10 md:p-14 text-center overflow-hidden grain-overlay"
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease }}
                >
                  <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />

                  <div className="relative z-10">
                    <h2 className="font-display text-3xl md:text-4xl text-white mb-3">
                      {t.audit.ctaTitle1}{" "}
                      <span className="italic">{t.audit.ctaTitle2}</span>
                    </h2>
                    <p className="text-base text-white/70 font-body mb-8 max-w-lg mx-auto">
                      {t.audit.ctaDesc}
                    </p>
                    <Link href="/signup?source=audit">
                      <motion.div
                        className="inline-block"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <Button className="h-14 px-10 rounded-xl bg-white text-primary font-body font-semibold text-base hover:bg-white/90 shadow-lg transition-all hover:-translate-y-0.5">
                          {t.audit.ctaButton}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </motion.div>
                    </Link>
                    <p className="text-xs text-white/50 font-body mt-3">
                      {t.audit.noCardRequired}
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <div className="flex items-center gap-8">
              <Link
                href="/#features"
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.features}
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.pricing}
              </Link>
              <Link
                href="/login"
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.signIn}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper: Generate a personalized summary paragraph
function generateSummary(
  business: PlaceData,
  breakdown: AuditScoreBreakdown
): string {
  const name = business.name;
  const score = breakdown.total;
  const grade = breakdown.grade;

  // Find strongest and weakest categories
  const categories = [
    { key: "rating", ...breakdown.rating },
    { key: "reviewVolume", ...breakdown.reviewVolume },
    { key: "visualPresence", ...breakdown.visualPresence },
    { key: "profileCompleteness", ...breakdown.profileCompleteness },
    { key: "engagement", ...breakdown.engagement },
  ];
  const sorted = [...categories].sort(
    (a, b) => b.score / b.max - a.score / a.max
  );
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  let opener: string;
  if (grade === "A") {
    opener = `${name} is in excellent shape with a score of ${score}/100.`;
  } else if (grade === "B") {
    opener = `${name} has a solid foundation with a score of ${score}/100, but there's room to push into the top tier.`;
  } else if (grade === "C") {
    opener = `${name} scored ${score}/100 — an average score that means you're likely losing customers to better-optimized competitors.`;
  } else if (grade === "D") {
    opener = `${name} scored ${score}/100, which puts it below most competitors in your area. Several areas need immediate attention.`;
  } else {
    opener = `${name} scored ${score}/100 — a critical score that suggests your Google Business Profile is seriously underperforming and likely invisible to most searchers.`;
  }

  const strongLine = `Your strongest area is ${strongest.label.toLowerCase()} (${strongest.score}/${strongest.max}).`;
  const weakLine = `The biggest opportunity for improvement is ${weakest.label.toLowerCase()} (${weakest.score}/${weakest.max}) — fixing this could have the most impact on your local visibility.`;

  return `${opener} ${strongLine} ${weakLine}`;
}

// Helper: Generate benchmark comparison data
function getBenchmarks(business: PlaceData, t: TranslationKeys) {
  const benchmarks = [];

  // Rating benchmark
  const avgRating = 4.2;
  const yourRating = business.rating || 0;
  benchmarks.push({
    label: t.audit.avgRating,
    yours: yourRating > 0 ? yourRating.toFixed(1) : "N/A",
    benchmark: avgRating.toFixed(1),
    yoursPct: Math.min(100, (yourRating / 5) * 100),
    benchmarkPct: (avgRating / 5) * 100,
    isAbove: yourRating >= avgRating,
  });

  // Review count benchmark
  const avgReviews = 75;
  const yourReviews = business.reviewCount || 0;
  const maxReviews = 300;
  benchmarks.push({
    label: t.audit.reviewCount,
    yours: yourReviews.toString(),
    benchmark: avgReviews.toString(),
    yoursPct: Math.min(100, (yourReviews / maxReviews) * 100),
    benchmarkPct: (avgReviews / maxReviews) * 100,
    isAbove: yourReviews >= avgReviews,
  });

  // Photo count benchmark
  const avgPhotos = 15;
  const yourPhotos = business.photoCount;
  const maxPhotos = 50;
  benchmarks.push({
    label: t.audit.photoCount,
    yours: yourPhotos.toString(),
    benchmark: avgPhotos.toString(),
    yoursPct: Math.min(100, (yourPhotos / maxPhotos) * 100),
    benchmarkPct: (avgPhotos / maxPhotos) * 100,
    isAbove: yourPhotos >= avgPhotos,
  });

  // Profile completeness benchmark
  let yourComplete = 0;
  if (business.hasWebsite) yourComplete++;
  if (business.hasHours) yourComplete++;
  if (business.hasCategory) yourComplete++;
  benchmarks.push({
    label: t.audit.profileCompleteness,
    yours: `${yourComplete}/3 fields`,
    benchmark: "3/3 fields",
    yoursPct: (yourComplete / 3) * 100,
    benchmarkPct: 100,
    isAbove: yourComplete >= 3,
  });

  return benchmarks;
}

// Helper to collect top recommendations from all categories
function getAllRecommendations(breakdown: AuditScoreBreakdown): string[] {
  const recs: Array<{ rec: string; priority: number }> = [];

  const categories = [
    breakdown.rating,
    breakdown.reviewVolume,
    breakdown.visualPresence,
    breakdown.profileCompleteness,
    breakdown.engagement,
  ];

  for (const cat of categories) {
    const deficit = cat.max - cat.score;
    for (const rec of cat.recommendations) {
      recs.push({ rec, priority: deficit });
    }
  }

  // Sort by highest deficit (most room for improvement)
  recs.sort((a, b) => b.priority - a.priority);
  return recs.map((r) => r.rec);
}
