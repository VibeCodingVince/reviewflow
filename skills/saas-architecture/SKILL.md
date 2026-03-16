---
name: saas-architecture
description: Best practices for building production SaaS apps with Next.js, Supabase, and Stripe.
---

## Rules
- All API routes must have proper error handling with try/catch and meaningful error messages
- All database queries must use parameterized inputs
- All pages must have loading states and error states
- All forms must have client-side validation
- Stripe webhooks must verify signatures
- OAuth tokens must be encrypted at rest
- Environment variables must never be hardcoded
- Every page must be mobile responsive
- Use TypeScript strict mode everywhere
- Use server components by default, client components only when needed
