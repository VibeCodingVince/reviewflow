---
name: lead-magnet
description: Build high-converting lead magnet pages that capture emails through interactive tools, audits, quizzes, or gated content. Use this skill whenever building a public-facing page designed to collect leads, gate content behind email capture, create free tools or calculators, or build any conversion-focused landing page. Also use for audit pages, score cards, health checks, or any "free analysis" flows.
---

# Lead Magnet Page Design

This skill creates lead magnet pages that convert visitors into email leads through a combination of instant value, progressive disclosure, and premium visual design. The core psychological loop: give something valuable for free → create curiosity about the full picture → gate the detailed insights behind an email.

## The Conversion Architecture

Every lead magnet page follows a **4-state flow**. Build it as a single client component with state transitions — not separate pages. This keeps the experience fluid and prevents drop-off from page loads.

### State 1: Hook (Search / Input)
The visitor arrives and immediately understands what they'll get. No preamble.

**Above the fold — always include:**
- **Headline** in display font: Frame the value as a question or outcome ("How Healthy Is Your Google Business Profile?", "Is Your Website Losing Customers?"). Questions outperform statements because they create an open loop.
- **Subheadline** in body font: One sentence explaining what happens next ("Get a free audit score in 30 seconds — no signup required")
- **The input mechanism**: Search bar, URL field, quiz start button, file upload — whatever kicks off the analysis. Make it large, prominent, and impossible to miss.
- **Trust signals below the input**: "10,000+ businesses audited" or "Based on 50+ ranking factors" — even if approximate. Social proof reduces friction at the moment of action.

**Design notes:**
- The input should feel like a product, not a form. Rounded corners, subtle shadow, generous padding.
- Add a subtle animated element (floating dots, pulsing glow around the input) to draw the eye without being distracting.
- Decorative background: gradient blobs, grain overlay, or geometric patterns — but muted. The input is the star.
- Consider showing 2-3 "sample results" or logos of businesses that have been audited below the fold as additional social proof.

### State 2: Loading (Analysis Animation)
This state exists to build perceived value. An instant result feels cheap. A 3-4 second animated analysis feels thorough.

**Build anticipation through staged reveals:**
```
Second 0-1:  "Analyzing [Business Name]..." with a spinner
Second 1-2:  "Checking review presence..." (first category appears)
Second 2-3:  "Evaluating visual content..." (second category)
Second 3-4:  Score counter animates from 0 to final number
```

**Design notes:**
- Use stagger animations (`.stagger-1` through `.stagger-6`) for category labels appearing one by one.
- The score counter should use a smooth easing function — fast at first, then decelerating as it approaches the final number. This creates a "drum roll" effect.
- Keep the background clean. A centered card with the animation feels more premium than a full-page takeover.
- Progress indicators (even fake ones) dramatically reduce perceived wait time. A thin progress bar at the top or a circular progress ring works well.

### State 3: Preview (Partial Results — The Gate)
This is the highest-leverage state. Show enough to prove value, blur/gate enough to create desire.

**Show for free (builds trust):**
- The overall score/grade — big, colorful, unmissable
- Category-level scores with progress bars (e.g., "Rating: 22/25", "Photos: 8/15")
- A color-coded assessment (green/amber/red) so they instantly know where they stand
- The business name and basic info they already know (confirms accuracy)

**Gate behind email (creates desire):**
- Detailed explanations for each category score (why they got that score)
- Specific, actionable recommendations ("Add 13 more photos — businesses in your category average 25+")
- Priority-ranked "quick wins" list
- Competitive benchmarks or comparisons
- Any AI-generated narrative or personalized advice

**The blur gate pattern:**
Apply `backdrop-filter: blur(8px)` or `filter: blur(8px)` to the gated content. Overlay a card with:
- Heading: "Unlock Your Full Report" (not "Sign Up" — frame it as unlocking value they can already see, not giving something away)
- Subtext: "Enter your email to get detailed recommendations and quick wins"
- Email input + submit button
- 2-3 bullet points of what they'll unlock (use check icons)
- Privacy note: "No spam, ever. Unsubscribe anytime."

**Design notes:**
- The blur should be visible enough that they can see there IS content behind it (shapes, colors, text blocks) but not readable. `blur(8px)` is the sweet spot.
- The score gauge is the hero element. Use an SVG circular gauge with animated fill. Color-code by grade:
  - A (85+): Emerald/green
  - B (70-84): Teal/cyan
  - C (55-69): Amber/yellow
  - D (40-54): Orange
  - F (<40): Red
- Category cards should use horizontal progress bars with the same color coding.
- The email capture card should have a subtle border, slight elevation (shadow), and a background that contrasts with the blurred content behind it (white card over blurred gray works well).

### State 4: Full Results (After Email)
The reveal. Everything un-blurs with a smooth transition (`transition: filter 0.5s ease`). The visitor now sees the complete report.

**After the reveal, add:**
- Each category expanded with detail text and specific recommendations
- A "Quick Wins" section highlighting the 2-3 easiest improvements
- Share button ("Share your score" — for virality, though optional)
- **The CTA section** — this is why the page exists:

**CTA design (critical):**
- Dark background section (brand primary color) that breaks the white flow
- Headline: "Want to improve this score automatically?" or "Fix these issues in minutes, not months"
- Subtext connecting their specific weak areas to your product's features
- Large, high-contrast button: "Start Free Trial" or "Get Started Free"
- Secondary link: "See how [Product] works" → features page
- Optional: show a before/after score comparison ("Businesses using [Product] improve their score by 23 points on average")

## Visual Design System

### Typography
- **Headlines**: Display serif font (DM Serif Display or similar). Large, confident, editorial.
- **Body/UI**: Clean sans-serif (Outfit, or similar). Light/regular weight for body, medium/semibold for labels.
- **Score numbers**: Display font at oversized scale (4xl-6xl). The score should be the largest text on the page.

### Color
- Primary brand color for CTAs, active states, and the score gauge
- White/near-white backgrounds for content areas
- Light gray (`gray-50` or `gray-100`) for section alternation
- Score-based color palette (green → amber → red) should feel natural, not traffic-light harsh. Use emerald/teal instead of pure green, warm amber instead of yellow.

### Animation
Use these CSS animation patterns throughout:

```css
/* Fade up on enter */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Stagger children */
.stagger-1 { animation-delay: 100ms; }
.stagger-2 { animation-delay: 200ms; }
.stagger-3 { animation-delay: 300ms; }
/* ... through stagger-6 */

/* Score counter (use JS for the counting, CSS for the gauge fill) */
@keyframes gauge-fill {
  from { stroke-dashoffset: <circumference>; }
  to { stroke-dashoffset: <calculated-offset>; }
}

/* Blur reveal */
.blurred { filter: blur(8px); transition: filter 0.5s ease; }
.revealed { filter: blur(0); }
```

- Every element that enters the viewport should animate in. Use `animate-fade-in` with stagger delays.
- Hover states on interactive elements: slight lift (`-translate-y-1`), shadow increase.
- The score gauge fill animation should take 1.5-2 seconds with an ease-out curve.
- Category progress bars should animate their width on mount with stagger delays.

### Layout
- Max content width: `max-w-4xl` for the results, `max-w-2xl` for the search state
- Generous vertical padding between sections (`py-16` to `py-24`)
- Category cards: responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or similar)
- Mobile-first: single column stack, full-width inputs, touch-friendly tap targets (min 44px)

### The Score Gauge (SVG Pattern)
Build this as an inline SVG, not a library:

```
- Circle radius: ~80-90px
- Stroke width: 8-10px
- Background track: light gray (gray-200)
- Fill stroke: color based on score grade
- Centered text: score number (large) + grade letter (smaller, below)
- Use stroke-dasharray and stroke-dashoffset for the animated fill
- Animate with CSS or requestAnimationFrame for the counter
```

## Conversion Principles

These aren't just nice-to-haves — they're the difference between a 2% and a 15% email capture rate:

1. **Reciprocity**: Give real value before asking for anything. The free preview must be genuinely useful, not a teaser that tells them nothing.

2. **Curiosity gap**: The blur gate works because humans can't stand seeing something they almost understand. Show enough structure that they know the gated content is substantial and relevant.

3. **Commitment escalation**: They already typed their business name, waited for the analysis, and saw their score. They're invested. The email is a small next step, not a cold ask.

4. **Loss aversion**: Frame the gate as "unlock" (keeping what's theirs), not "sign up" (giving something away). "Your full report is ready" > "Create an account to see more."

5. **Specificity builds trust**: "Based on 47 ranking factors" converts better than "comprehensive analysis." Use real numbers.

6. **Speed to value**: The faster someone gets their first result, the more likely they convert. Aim for < 5 seconds from landing to seeing their score.

## API Architecture

Lead magnet pages need public (unauthenticated) API routes. Key patterns:

- **Proxy external APIs server-side**: Never expose third-party API keys to the browser. Create thin proxy routes that forward requests.
- **Rate limit public endpoints**: Use in-memory rate limiting (Map with TTL) at minimum. 10-20 requests per IP per minute is reasonable.
- **Email capture route**: Use the admin/service-role Supabase client (not the user client) since there's no authenticated user. Validate emails server-side (regex + length). Upsert to avoid duplicates.
- **Store leads with context**: Save not just the email but what they searched for, their score, and the breakdown. This data is gold for sales follow-up and segmentation.
- **No auth middleware**: Ensure the page route is not caught by auth middleware redirects.

## Common Mistakes to Avoid

- **Asking for email too early**: Never gate the initial result. The overall score/grade must be free.
- **Too much blur**: If the blurred section is too small, there's no perceived value behind the gate. Show at least 3-4 content blocks behind the blur.
- **Generic recommendations**: "Improve your online presence" is worthless. Recommendations must reference their specific data ("Your 3.8 rating is below the 4.2 average for restaurants in your area").
- **Weak CTAs**: "Learn More" is a dead phrase. Use action + outcome: "Start Improving Your Score", "Fix This in 5 Minutes", "Get Your Free Trial".
- **Forgetting mobile**: 60%+ of lead magnet traffic is mobile. The score gauge must look good at 200px wide. The email input must be full-width. Touch targets must be 44px minimum.
- **No loading state**: Instant results feel cheap and untrustworthy. Even if your API returns in 200ms, add a staged loading animation.
