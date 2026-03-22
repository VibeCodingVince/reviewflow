"use client";

import Link from "next/link";
import {
  MessageSquareText,
  Mic2,
  MapPin,
  Star,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Shield,
  Activity,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/language-toggle";
import { motion } from "motion/react";

// ---- Animation Variants ----

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeUpSlow = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const staggerContainerFast = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};


// ---- Components ----

// ---- Device Mockup: Dashboard in a MacBook ----

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow behind the device */}
      <div className="absolute -inset-8 bg-gradient-to-br from-primary/10 via-emerald-100/40 to-transparent rounded-[3rem] blur-3xl" />

      {/* MacBook frame */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 50, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        style={{ perspective: 1200 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Screen bezel */}
          <div className="relative bg-[#1a1a1a] rounded-xl p-[3px] shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
            {/* Browser chrome */}
            <div className="bg-[#2a2a2a] rounded-t-lg px-4 py-2.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 bg-[#1a1a1a] rounded-md px-3 py-1 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-gray-600" />
                <span className="text-[10px] text-gray-500 font-body">app.reviewflow.io/dashboard</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-gray-50 rounded-b-lg p-4 space-y-3">
              {/* Dashboard header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                    <MessageSquareText className="w-3 h-3 text-white" />
                  </div>
                  <span className="font-display text-xs text-foreground">ReviewFlow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[8px] font-body font-bold text-primary">VC</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                  <p className="text-[9px] text-muted-foreground font-body">Rating</p>
                  <div className="flex items-center gap-1">
                    <span className="font-display text-lg text-foreground leading-none">4.8</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="text-[8px] text-emerald-600 font-body">+0.3 this month</span>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                  <p className="text-[9px] text-muted-foreground font-body">Reviews</p>
                  <span className="font-display text-lg text-foreground leading-none">247</span>
                  <p className="text-[8px] text-emerald-600 font-body">12 new this week</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                  <p className="text-[9px] text-muted-foreground font-body">Replied</p>
                  <span className="font-display text-lg text-foreground leading-none">100%</span>
                  <p className="text-[8px] text-emerald-600 font-body">All time</p>
                </div>
              </div>

              {/* Recent review */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <span className="text-[7px] text-white font-bold">SK</span>
                  </div>
                  <span className="text-[10px] font-body font-medium text-foreground">Sarah K.</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-2 h-2 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[9px] text-foreground/70 font-body leading-relaxed line-clamp-2">
                  &ldquo;Amazing brunch! The avocado toast was incredible and the service was warm...&rdquo;
                </p>
                {/* AI reply indicator */}
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
                  <div className="w-3.5 h-3.5 rounded bg-primary flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                  <span className="text-[8px] font-body text-primary font-medium">AI reply ready</span>
                  <div className="flex gap-1 ml-auto">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[7px] font-body font-medium text-primary">Approve</span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[7px] font-body font-medium text-gray-500">Edit</span>
                  </div>
                </div>
              </div>

              {/* Mini chart placeholder */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-[9px] text-muted-foreground font-body mb-2">Performance — Last 30 days</p>
                <div className="flex items-end gap-[3px] h-8">
                  {[40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 70, 90, 85, 95, 88, 92].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-emerald-400 rounded-sm"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.5, delay: 1.2 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MacBook base/hinge */}
          <div className="mx-auto w-[60%] h-[6px] bg-gradient-to-b from-[#c0c0c0] to-[#a0a0a0] rounded-b-lg" />
          <div className="mx-auto w-[70%] h-[3px] bg-gradient-to-b from-[#d4d4d4] to-[#e0e0e0] rounded-b-xl" />
        </motion.div>
      </motion.div>

      {/* iPhone overlay — bottom right */}
      <motion.div
        className="absolute -bottom-8 -right-6 md:-right-14 w-[190px]"
        initial={{ opacity: 0, y: 50, x: 30 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          {/* iPhone frame */}
          <div className="bg-[#1a1a1a] rounded-[26px] p-[3px] shadow-[0_25px_70px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
            {/* Dynamic Island */}
            <div className="bg-black rounded-t-[23px] pt-2 pb-1 px-4 relative">
              <div className="mx-auto w-[70px] h-[22px] bg-[#1a1a1a] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#2a2a2a]" />
              </div>
            </div>
            {/* Phone screen */}
            <div className="bg-gray-50 px-3 pb-4 pt-2 rounded-b-[23px] space-y-2.5">
              {/* Status bar */}
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[8px] font-body font-semibold text-foreground">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2 border border-foreground/60 rounded-[2px] relative">
                    <div className="absolute inset-[1px] bg-emerald-500 rounded-[1px]" style={{ width: "70%" }} />
                  </div>
                </div>
              </div>

              {/* App header */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquareText className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <span className="font-display text-[11px] text-foreground leading-none">ReviewFlow</span>
                  <p className="text-[7px] text-muted-foreground font-body">Dashboard</p>
                </div>
              </div>

              {/* Notification card */}
              <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-body font-semibold text-foreground leading-tight">New 5-star review!</p>
                    <p className="text-[7px] font-body text-muted-foreground">AI reply ready to approve</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                </div>
              </div>

              {/* Health score */}
              <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[8px] text-muted-foreground font-body">Health Score</p>
                  <span className="text-[7px] font-body text-emerald-600 font-medium">+4 this week</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-xl text-emerald-600 leading-none">92</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl p-2 border border-gray-100 text-center">
                  <Star className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                  <span className="font-display text-sm text-foreground leading-none">4.8</span>
                  <p className="text-[6px] font-body text-muted-foreground mt-0.5">Rating</p>
                </div>
                <div className="bg-white rounded-xl p-2 border border-gray-100 text-center">
                  <Activity className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
                  <span className="font-display text-sm text-foreground leading-none">100%</span>
                  <p className="text-[6px] font-body text-muted-foreground mt-0.5">Replied</p>
                </div>
              </div>

              {/* Home indicator */}
              <div className="pt-2">
                <div className="mx-auto w-[80px] h-[4px] bg-foreground/20 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  popular,
  tier,
  mostPopularLabel,
  perMonthLabel,
  hireAgentLabel,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  tier: string;
  mostPopularLabel: string;
  perMonthLabel: string;
  hireAgentLabel: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, boxShadow: popular ? "0 30px 80px rgba(27,67,50,0.35)" : "0 20px 50px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-2xl p-8 ${
        popular
          ? "bg-primary text-white shadow-[0_20px_60px_rgba(27,67,50,0.3)] scale-105"
          : "bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-primary text-xs font-body font-bold rounded-full uppercase tracking-wider">
          {mostPopularLabel}
        </div>
      )}
      <h3
        className={`font-display text-2xl mb-2 ${popular ? "text-white" : "text-foreground"}`}
      >
        {name}
      </h3>
      <p
        className={`text-sm font-body mb-6 ${popular ? "text-white/70" : "text-muted-foreground"}`}
      >
        {description}
      </p>
      <div className="flex items-baseline gap-1 mb-8">
        <span className="font-display text-5xl">{price}</span>
        <span
          className={`text-sm font-body ${popular ? "text-white/60" : "text-muted-foreground"}`}
        >
          {perMonthLabel}
        </span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${popular ? "text-emerald-300" : "text-primary"}`}
            />
            <span
              className={`text-sm font-body ${popular ? "text-white/90" : "text-foreground/70"}`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <Link href={`/signup?tier=${tier}`}>
        <Button
          className={`w-full h-12 font-body font-semibold rounded-xl transition-all ${
            popular
              ? "bg-white text-primary hover:bg-white/90"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          {hireAgentLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function LandingPage() {
  const { t } = useI18n();

  const features = [
    {
      icon: Zap,
      title: t.landing.feature1Title,
      description: t.landing.feature1Desc,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: Mic2,
      title: t.landing.feature2Title,
      description: t.landing.feature2Desc,
      gradient: "from-primary to-emerald-600",
    },
    {
      icon: MapPin,
      title: t.landing.feature3Title,
      description: t.landing.feature3Desc,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: Shield,
      title: t.landing.feature4Title,
      description: t.landing.feature4Desc,
      gradient: "from-red-500 to-rose-600",
    },
    {
      icon: Activity,
      title: t.landing.feature5Title,
      description: t.landing.feature5Desc,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: CalendarCheck,
      title: t.landing.feature6Title,
      description: t.landing.feature6Desc,
      gradient: "from-cyan-500 to-teal-600",
    },
  ];

  const steps = [
    {
      step: "01",
      title: t.landing.step1Title,
      description: t.landing.step1Desc,
    },
    {
      step: "02",
      title: t.landing.step2Title,
      description: t.landing.step2Desc,
    },
    {
      step: "03",
      title: t.landing.step3Title,
      description: t.landing.step3Desc,
    },
  ];

  const testimonials = [
    {
      quote: t.landing.testimonial1Quote,
      name: t.landing.testimonial1Name,
      role: t.landing.testimonial1Role,
    },
    {
      quote: t.landing.testimonial2Quote,
      name: t.landing.testimonial2Name,
      role: t.landing.testimonial2Role,
    },
    {
      quote: t.landing.testimonial3Quote,
      name: t.landing.testimonial3Name,
      role: t.landing.testimonial3Role,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquareText className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display text-xl text-foreground">
              ReviewFlow
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.features}
            </a>
            <a
              href="#pricing"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.pricing}
            </a>
            <Link
              href="/audit"
              className="text-sm font-body text-primary font-medium hover:text-primary/80 transition-colors"
            >
              {t.nav.freeAudit}
            </Link>
            <Link
              href="/login"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.signIn}
            </Link>
            <LanguageToggle />
            <Link href="/signup">
              <Button className="h-9 px-5 rounded-full bg-primary text-white font-body text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20">
                {t.nav.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-0 w-96 h-96 bg-primary/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/[0.02] to-transparent rounded-full" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <motion.div
              className="max-w-xl"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-body font-medium text-primary uppercase tracking-wider">
                  {t.landing.badge}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUpSlow}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.08] text-foreground mb-6"
              >
                <span className="relative inline-block">
                  <span className="relative z-10">{t.landing.heroTitle1}</span>
                  <motion.span
                    className="absolute bottom-1 md:bottom-2 left-[-4px] right-[-4px] h-[35%] bg-primary/10 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>{" "}
                <br className="hidden md:block" />
                {t.landing.heroTitle2}{" "}
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">{t.landing.heroTitle3}</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed mb-8"
              >
                {t.landing.heroDescription}
              </motion.p>

              {/* Stat bar — outcomes */}
              <motion.div
                variants={staggerContainerFast}
                className="grid grid-cols-3 gap-4 mb-8"
              >
                {[
                  { icon: Star, iconColor: "text-amber-500", bg: "bg-amber-50", number: t.landing.heroStat1Number, label: t.landing.heroStat1Label },
                  { icon: Zap, iconColor: "text-emerald-600", bg: "bg-emerald-50", number: t.landing.heroStat2Number, label: t.landing.heroStat2Label },
                  { icon: Activity, iconColor: "text-primary", bg: "bg-primary/5", number: t.landing.heroStat3Number, label: t.landing.heroStat3Label },
                ].map((stat, i) => (
                  <motion.div key={i} variants={fadeUp} transition={{ duration: 0.5 }} className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <span className="font-display text-2xl text-foreground leading-none">{stat.number}</span>
                      <p className="text-[11px] text-muted-foreground font-body leading-tight mt-0.5">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/signup">
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <Button className="h-14 px-8 rounded-xl bg-primary text-white font-body font-semibold text-base hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-colors">
                      {t.landing.heroCta}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/audit">
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <Button
                      variant="outline"
                      className="h-14 px-8 rounded-xl font-body font-medium text-base border-gray-200 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors"
                    >
                      {t.landing.heroCtaSecondary}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="text-xs text-muted-foreground font-body mt-4"
              >
                {t.landing.heroTrial}
              </motion.p>
            </motion.div>

            <div className="lg:translate-x-4">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {t.landing.featuresTitle1}{" "}
              <span className="italic text-primary">{t.landing.featuresTitle2}</span> {t.landing.featuresTitle3}
            </h2>
            <p className="text-lg text-muted-foreground font-body">
              {t.landing.featuresSubtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, boxShadow: "0 20px 50px rgba(0,0,0,0.1)" }}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-colors duration-300"
              >
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="font-display text-2xl text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {t.landing.howItWorksTitle1}{" "}
              <span className="italic text-primary">{t.landing.howItWorksTitle2}</span> {t.landing.howItWorksTitle3}
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {steps.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center md:text-left"
              >
                <motion.span
                  className="font-display text-7xl text-primary/10 leading-none inline-block"
                  whileInView={{ opacity: [0, 1], scale: [0.8, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  {item.step}
                </motion.span>
                <h3 className="font-display text-2xl text-foreground mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-xs mx-auto md:mx-0">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {t.landing.socialProofTitle1}{" "}
              <span className="italic text-primary">{t.landing.socialProofTitle2}</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body">
              {t.landing.socialProofSubtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 font-body leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="font-body font-semibold text-sm text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Free Audit CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="relative rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-primary/10 p-12 md:p-16 text-center overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs font-body font-medium text-primary uppercase tracking-wider">
                  {t.landing.auditCtaBadge}
                </span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
                {t.landing.auditCtaTitle1}{" "}
                <span className="italic text-primary">{t.landing.auditCtaTitle2}</span>
              </h2>
              <p className="text-lg text-muted-foreground font-body mb-8 max-w-xl mx-auto">
                {t.landing.auditCtaDesc}
              </p>
              <Link href="/audit">
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className="inline-block">
                  <Button className="h-14 px-10 rounded-xl bg-primary text-white font-body font-semibold text-base hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-colors">
                    {t.landing.auditCtaButton}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              {t.pricing.title1}{" "}
              <span className="italic text-primary">{t.pricing.title2}</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body">
              {t.pricing.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <PricingCard
              name={t.pricing.singleName}
              price="$19"
              description={t.pricing.singleDesc}
              tier="single"
              mostPopularLabel={t.pricing.mostPopular}
              perMonthLabel={t.pricing.perMonth}
              hireAgentLabel={t.pricing.hireAgent}
              features={[
                t.pricing.singleF1,
                t.pricing.singleF2,
                t.pricing.singleF3,
                t.pricing.singleF4,
                t.pricing.singleF5,
                t.pricing.singleF6,
              ]}
            />
            <PricingCard
              name={t.pricing.multiName}
              price="$49"
              description={t.pricing.multiDesc}
              tier="multi"
              mostPopularLabel={t.pricing.mostPopular}
              perMonthLabel={t.pricing.perMonth}
              hireAgentLabel={t.pricing.hireAgent}
              features={[
                t.pricing.multiF1,
                t.pricing.multiF2,
                t.pricing.multiF3,
                t.pricing.multiF4,
                t.pricing.multiF5,
                t.pricing.multiF6,
              ]}
            />
            <PricingCard
              name={t.pricing.proName}
              price="$99"
              description={t.pricing.proDesc}
              tier="pro"
              popular
              mostPopularLabel={t.pricing.mostPopular}
              perMonthLabel={t.pricing.perMonth}
              hireAgentLabel={t.pricing.hireAgent}
              features={[
                t.pricing.proF1,
                t.pricing.proF2,
                t.pricing.proF3,
                t.pricing.proF4,
                t.pricing.proF5,
                t.pricing.proF6,
                t.pricing.proF7,
                t.pricing.proF8,
              ]}
            />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="relative rounded-3xl bg-primary p-12 md:p-16 text-center overflow-hidden grain-overlay"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
                {t.landing.ctaTitle1}{" "}
                <span className="italic">{t.landing.ctaTitle2}</span>
              </h2>
              <p className="text-lg text-white/70 font-body mb-10 max-w-xl mx-auto">
                {t.landing.ctaDesc}
              </p>
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className="inline-block">
                  <Button className="h-14 px-10 rounded-xl bg-white text-primary font-body font-semibold text-base hover:bg-white/90 shadow-lg transition-colors">
                    {t.landing.ctaButton}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquareText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-lg text-foreground">
                ReviewFlow
              </span>
            </div>
            <div className="flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.features}
              </a>
              <a
                href="#pricing"
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.nav.pricing}
              </a>
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
