"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Check,
  ArrowRight,
  MessageSquareText,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
          title: "Error",
          description: data.error || "Failed to start checkout",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start checkout",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  return (
    <div
      className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
        popular
          ? "bg-primary text-white shadow-[0_20px_60px_rgba(27,67,50,0.3)] scale-105"
          : "bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-primary text-xs font-body font-bold rounded-full uppercase tracking-wider">
          Most Popular
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
          /mo
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
      <Button
        className={`w-full h-12 font-body font-semibold rounded-xl transition-all ${
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
            Start Free Trial
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageSquareText className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display text-xl text-foreground">
            ReviewFlow
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link href="/signup">
            <Button className="h-9 px-5 rounded-full bg-primary text-white font-body text-sm font-medium hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <div className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Simple, Transparent{" "}
              <span className="italic text-primary">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground font-body">
              Start free for 7 days. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <PricingCard
              name="Single"
              price="$29"
              description="Perfect for one location"
              tier="single"
              features={[
                "1 Google Business location",
                "Unlimited AI-generated replies",
                "Custom brand voice & tone",
                "Auto-reply or manual approval",
                "CSV review import",
                "Email support",
              ]}
            />
            <PricingCard
              name="Multi"
              price="$79"
              description="For growing businesses"
              tier="multi"
              popular
              features={[
                "Up to 5 Google Business locations",
                "Unlimited AI-generated replies",
                "Custom instructions per location",
                "Auto-reply or manual approval",
                "CSV review import",
                "Priority support",
              ]}
            />
          </div>

          {/* FAQ */}
          <div className="mt-24 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl text-foreground text-center mb-12">
              Questions? Answers.
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "How does the free trial work?",
                  a: "You get full access to all features for 7 days. No credit card needed to start. If you love it, pick a plan. If not, no worries.",
                },
                {
                  q: "Can I change plans later?",
                  a: "Absolutely. Upgrade, downgrade, or cancel anytime from your billing portal. Changes take effect immediately.",
                },
                {
                  q: "Do you need access to my Google account?",
                  a: "We request limited OAuth access to read your reviews and post replies. We never access anything else on your Google account.",
                },
                {
                  q: "What if I don't like a generated reply?",
                  a: "Every reply can be edited before posting. You can also regenerate, skip, or adjust your custom instructions to fine-tune the AI's output.",
                },
              ].map((faq) => (
                <div key={faq.q} className="border-b border-gray-100 pb-6">
                  <h3 className="font-body font-semibold text-foreground mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
