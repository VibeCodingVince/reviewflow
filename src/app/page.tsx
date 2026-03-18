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

function ReviewDemo() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Decorative elements */}
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl" />

      {/* Review card */}
      <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-gray-100/80 p-6 mb-4 opacity-0 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-body font-semibold text-sm">
            SK
          </div>
          <div>
            <p className="font-body font-semibold text-sm text-foreground">
              Sarah K.
            </p>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          <span className="ml-auto text-xs text-muted-foreground font-body">
            2 min ago
          </span>
        </div>
        <p className="text-sm text-foreground/80 font-body leading-relaxed">
          &ldquo;Amazing brunch! The avocado toast was incredible and the
          service was so warm and attentive. Will definitely be back!&rdquo;
        </p>
      </div>

      {/* AI Reply */}
      <div className="relative ml-8 bg-gradient-to-br from-primary/[0.03] to-emerald-50 rounded-2xl border border-primary/10 p-6 opacity-0 animate-fade-in stagger-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-body font-medium text-primary uppercase tracking-wider">
            Reply from [Your Business Name]
          </span>
        </div>
        <p className="text-sm text-foreground/80 font-body leading-relaxed">
          &ldquo;Sarah, so glad you loved the avocado toast — it&apos;s our
          chef&apos;s pride! Thank you for noticing our team&apos;s
          attentiveness, we can&apos;t wait to welcome you back.
          — [Your Business Name]&rdquo;
        </p>
        <div className="flex gap-2 mt-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body font-medium">
            <Check className="w-3 h-3" /> Approve & Post
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-body font-medium">
            Edit
          </span>
        </div>
      </div>
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
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  tier: string;
}) {
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
      <Link href={`/signup?tier=${tier}`}>
        <Button
          className={`w-full h-12 font-body font-semibold rounded-xl transition-all ${
            popular
              ? "bg-white text-primary hover:bg-white/90"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          Start Free Trial
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

export default function LandingPage() {
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
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button className="h-9 px-5 rounded-full bg-primary text-white font-body text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20">
                Get Started
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
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8 opacity-0 animate-fade-in">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-body font-medium text-primary uppercase tracking-wider">
                  AI-Powered Review Management
                </span>
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.08] text-foreground mb-6 opacity-0 animate-fade-in stagger-1">
                Never Miss a Google Review{" "}
                <span className="italic text-primary">Again</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground font-body leading-relaxed mb-10 opacity-0 animate-fade-in stagger-2">
                Craft perfect, on-brand replies to every review in seconds.
                AI that sounds like you, not a robot — posted automatically or
                with your approval.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in stagger-3">
                <Link href="/signup">
                  <Button className="h-14 px-8 rounded-xl bg-primary text-white font-body font-semibold text-base hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="h-14 px-8 rounded-xl font-body font-medium text-base border-gray-200 hover:border-primary/30 hover:bg-primary/[0.02] transition-all"
                >
                  See How It Works
                </Button>
              </div>

              <p className="text-xs text-muted-foreground font-body mt-4 opacity-0 animate-fade-in stagger-4">
                7-day free trial. No credit card required.
              </p>
            </div>

            <div className="opacity-0 animate-fade-in stagger-2">
              <ReviewDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Everything You Need to{" "}
              <span className="italic text-primary">Own</span> Your Reviews
            </h2>
            <p className="text-lg text-muted-foreground font-body">
              From pulling reviews to posting replies — fully automated or
              hands-on, your choice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Auto-Reply Engine",
                description:
                  "AI generates thoughtful, specific replies the moment a new review lands. Approve with one click or let it post automatically.",
                gradient: "from-amber-400 to-orange-500",
              },
              {
                icon: Mic2,
                title: "Your Brand Voice",
                description:
                  "Set your tone — friendly, professional, or casual. Add custom instructions. Every reply sounds authentically you.",
                gradient: "from-primary to-emerald-600",
              },
              {
                icon: MapPin,
                title: "Multi-Location",
                description:
                  "Manage reviews across all your locations from one dashboard. Each location gets its own voice and settings.",
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                icon: Shield,
                title: "Review Shield",
                description:
                  "AI detects fake and spam reviews instantly. Get suspicious review scores, reasons, and auto-generated appeal narratives to flag them to Google.",
                gradient: "from-red-500 to-rose-600",
              },
              {
                icon: Activity,
                title: "Early-Warning Radar",
                description:
                  "Daily performance monitoring catches drops before they hurt. AI alerts explain what happened and recommend next steps.",
                gradient: "from-violet-500 to-purple-600",
              },
              {
                icon: CalendarCheck,
                title: "Action Planner",
                description:
                  "Weekly AI-generated tasks optimize your profile — draft posts, update services, improve descriptions. Approve and auto-publish.",
                gradient: "from-cyan-500 to-teal-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Three Steps to{" "}
              <span className="italic text-primary">Effortless</span> Reviews
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Connect",
                description:
                  "Link your Google Business Profile in one click. We handle the OAuth magic.",
              },
              {
                step: "02",
                title: "Generate",
                description:
                  "AI crafts personalized replies to every review, matching your brand tone perfectly.",
              },
              {
                step: "03",
                title: "Post",
                description:
                  "Review and approve, or enable auto-reply. Either way, no review goes unanswered.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <span className="font-display text-7xl text-primary/10 leading-none">
                  {item.step}
                </span>
                <h3 className="font-display text-2xl text-foreground mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-xs mx-auto md:mx-0">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Trusted by Business Owners
            </h2>
            <p className="text-lg text-muted-foreground font-body">
              Join hundreds of businesses that respond to every review.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "ReviewFlow saved us 10+ hours a week. Our Google rating went from 4.1 to 4.6 in three months.",
                name: "Marcus Chen",
                role: "Owner, Chen's Bistro",
              },
              {
                quote:
                  "The replies sound exactly like us. Customers have no idea it's AI — they just know we care enough to respond.",
                name: "Priya Sharma",
                role: "Director, Bloom Dental Group",
              },
              {
                quote:
                  "Managing 5 locations used to be chaos. Now every review gets a perfect reply within minutes.",
                name: "David Park",
                role: "COO, Park Fitness Studios",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              Simple, Transparent{" "}
              <span className="italic text-primary">Pricing</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body">
              Start free for 7 days. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
              features={[
                "Up to 5 Google Business locations",
                "Unlimited AI-generated replies",
                "Custom instructions per location",
                "Auto-reply or manual approval",
                "CSV review import",
                "Priority support",
              ]}
            />
            <PricingCard
              name="Pro"
              price="$149"
              description="Full GBP management suite"
              tier="pro"
              popular
              features={[
                "Up to 5 locations",
                "Everything in Multi, plus:",
                "Review Shield — AI spam detection",
                "Early-Warning Radar — performance alerts",
                "Action Planner — weekly AI tasks",
                "Auto-publish GBP posts",
                "Health score & trend analytics",
                "Priority support",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl bg-primary p-12 md:p-16 text-center overflow-hidden grain-overlay">
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
                Ready to Take Control of Your Reviews?
              </h2>
              <p className="text-lg text-white/70 font-body mb-10 max-w-xl mx-auto">
                Join hundreds of businesses that never miss a review. Start
                your free trial today.
              </p>
              <Link href="/signup">
                <Button className="h-14 px-10 rounded-xl bg-white text-primary font-body font-semibold text-base hover:bg-white/90 shadow-lg transition-all hover:-translate-y-0.5">
                  Start Free Trial — 7 Days, No Card Required
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
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
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/login"
                className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              &copy; 2024 ReviewFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
