---
description: Optimize Load Times and API Calls for the Entire Application
---

# Objective
Improve the performance of the Tanuki Admin application by reducing page load times, minimizing unnecessary API calls, and implementing best‑practice caching and lazy‑loading strategies.

# Prerequisites
- Node.js (v20+)
- The project is a Next.js (app router) application located at `d:\Dev\Web\tanuki-admin`.
- Ensure the development server is running (`npm run dev`).

# Steps
1. **Audit Existing API Calls**
   - Search the codebase for direct `fetch`/`axios` calls.
   - Identify duplicated requests, calls inside loops, and calls that fetch large payloads.
   - Document findings in `docs/performance-audit.md`.

2. **Introduce a Centralized API Client**
   ```bash
   // turbo
   npx -y create-next-app@latest ./tmp_api_client
   ```
   - Create `src/lib/api.ts` that wraps `fetch` with default headers, error handling, and built‑in caching using **React Query** (or **SWR**).
   - Replace all direct fetch/axios calls with `api.get/post/...`.

3. **Add React Query Provider**
   - In `src/app/layout.tsx` wrap the children with `QueryClientProvider`.
   - Configure default stale time (e.g., 5 minutes) and enable background refetching.

4. **Implement Data Caching & Stale‑While‑Revalidate**
   - For read‑only endpoints (e.g., inventory lists, warehouses), set `staleTime: Infinity`.
   - Use `useQuery` with `select` to transform data only once.

5. **Debounce & Throttle User‑Triggered Calls**
   - For search inputs (e.g., book search), use `lodash.debounce` (300 ms) before invoking the query.
   - For scroll‑based pagination, throttle the request to one per 200 ms.

6. **Lazy‑Load Heavy Components**
   - Convert large UI components (modals, charts) to dynamic imports:
   ```tsx
   const AddBookModal = dynamic(() => import('@/components/inventory/AddBookToInventoryModal'), { ssr: false });
   ```
   - Add a loading skeleton for better UX.

7. **Code‑Split Routes**
   - Ensure each top‑level page under `src/app/**` uses `export const dynamic = 'error'` only when necessary.
   - For rarely used pages (e.g., finance reports), add `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` to avoid static generation overhead.

8. **Optimize Images & Assets**
   - Replace `<img>` tags with Next.js `<Image>` component.
   - Set appropriate `width`, `height`, and `quality` (80).
   - Enable `next-optimized-images` if custom formats are used.

9. **Enable HTTP Compression**
   - In `next.config.js` add:
   ```js
   const nextConfig = {
     compress: true,
     async headers() {
       return [{
         source: '/:path*',
         headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
       }];
     },
   };
   module.exports = nextConfig;
   ```

10. **Add Server‑Side Rendering Where Beneficial**
    - For dashboard widgets that depend on fresh data, use `fetch` inside `server components`.
    - Move heavy data fetching from client components to server components to reduce bundle size.

11. **Run Performance Tests**
    - Install `next-profiler` and capture Lighthouse scores.
    - Verify that Time to Interactive (TTI) drops below 2 s on a typical dev machine.
    - Record before/after metrics in `docs/performance-report.md`.

12. **Continuous Monitoring**
    - Add a GitHub Action that runs Lighthouse on every PR and fails if performance score drops >5 pts.
    - Use `next-telemetry` to send runtime metrics to an internal dashboard.

# Post‑Implementation Checklist
- [ ] All direct fetch/axios calls replaced.
- [ ] React Query provider configured.
- [ ] Heavy components are lazy‑loaded.
- [ ] Images use `<Image>`.
- [ ] `next.config.js` includes compression and caching headers.
- [ ] Lighthouse scores improved (target >90 on mobile, >95 on desktop).
- [ ] Documentation updated.

# References
- [React Query Docs](https://tanstack.com/query/v4/docs/overview)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
