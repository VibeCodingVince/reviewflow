"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Check,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import { motion } from "motion/react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

function PricingCard({
  name,
  price,
  description,
  features,
  popular,
  tier,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  tier: string;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: t.pricing.errorTitle,
          description: data.error || t.pricing.errorCheckout,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t.pricing.errorTitle,
        description: t.pricing.errorCheckout,
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative rounded-2xl p-8 ${
        popular
          ? "bg-primary text-white shadow-[0_20px_60px_rgba(27,67,50,0.3)] scale-105"
          : "bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-primary text-xs font-body font-bold rounded-full uppercase tracking-wider">
          {t.pricing.mostPopular}
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
          {t.pricing.perMonth}
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
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Button
          className={`w-full h-12 font-body font-semibold rounded-xl transition-colors ${
            popular
              ? "bg-white text-primary hover:bg-white/90"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {t.pricing.hireAgent}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
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
            <Button className="h-9 px-5 rounded-full bg-primary text-white font-body text-sm font-medium hover:bg-primary/90">
              {t.nav.getStarted}
            </Button>
          </Link>
        </div>
      </nav>

      <div className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1
              className="font-display text-4xl md:text-5xl text-foreground mb-4"
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.pricing.title1}{" "}
              <span className="italic text-primary">{t.pricing.title2}</span>
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground font-body"
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.pricing.subtitleFull}
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <PricingCard
              name={t.pricing.singleName}
              price="$19"
              description={t.pricing.singleDesc}
              tier="single"
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

          {/* FAQ */}
          <motion.div
            className="mt-24 max-w-2xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2
              className="font-display text-3xl text-foreground text-center mb-12"
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.pricing.faqTitle}
            </motion.h2>
            <div className="space-y-6">
              {[
                { q: t.pricing.faq1Q, a: t.pricing.faq1A },
                { q: t.pricing.faq2Q, a: t.pricing.faq2A },
                { q: t.pricing.faq3Q, a: t.pricing.faq3A },
                { q: t.pricing.faq4Q, a: t.pricing.faq4A },
                { q: t.pricing.faq5Q, a: t.pricing.faq5A },
              ].map((faq) => (
                <motion.div
                  key={faq.q}
                  className="border-b border-gray-100 pb-6"
                  variants={fadeUp}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h3 className="font-body font-semibold text-foreground mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
