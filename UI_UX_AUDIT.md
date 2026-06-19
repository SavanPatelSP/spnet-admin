# UI/UX AUDIT

**Project:** SPNET Admin
**Date:** 2026-06-18

---

## 1. LOADING STATES

### Current State
- Only 2 of 40 pages have `loading.tsx` (premium, premium-requests)
- 34 data-fetching pages show blank screen during navigation
- No loading states during async component actions (role changes, policy toggles)

### Fix Required
- Add `loading.tsx` to all 34 data-fetching routes
- Add loading states to all async buttons and action components
- Implement skeleton screens matching page layout structure

## 2. EMPTY STATES

### Current State
- Dashboard: Plain `<p>` for "No recent activity"
- Security: Plain `<p>` for "No recent activity"
- Settings/roles: Plain `<p>` for "No permissions assigned", "No members assigned"
- Moderation: Plain text "No notes available"

### Fix Required
- Replace all plain text empty states with `<EmptyState>` component
- Add contextual illustration/icon
- Provide actionable guidance (e.g., "Create your first permission")

## 3. ERROR HANDLING

### Current State
- Zero `error.tsx` files in entire project
- Root layout has no `global-error.tsx`
- `ErrorBoundary.tsx` at admin layout level catches only some errors
- Auth group has no error boundary at all

### Fix Required
- Add `error.tsx` at root (`/app/error.tsx`)
- Add `error.tsx` at auth group (`/app/(auth)/error.tsx`)
- Add `error.tsx` at admin group (`/app/(admin)/error.tsx`)
- Add `not-found.tsx` files at all route groups
- Add `global-error.tsx` for root layout failures

## 4. CONFIRMATION DIALOGS

### Current State
- 16+ destructive/financial actions lack confirmation dialogs
- 3 components use browser `confirm()`/`alert()` instead of UI modals

### Fix Required
- Add `<ConfirmDialog>` to all destructive actions
- Replace all `alert()` and `confirm()` with proper modal dialogs
- All confirmations should describe the action, consequences, and offer cancel

## 5. ACCESSIBILITY (a11y)

### Current State
- No `aria-label` on icon-only buttons (password toggle, action menus, delete buttons)
- No `aria-required` on form fields with `required` attribute
- Clickable `div` elements lack `role="button"`, `tabIndex`, keyboard handlers
- `<Modal>` component missing Escape key handler
- Color-only status indicators without text alternatives

### Fix Required
- Add `aria-label` to all icon-only buttons
- Add `aria-required` to required form fields
- Add `role="button"` + `tabIndex` + keyboard handlers to interactive divs
- Add Escape key handler to Modal
- Ensure status badges have text labels

## 6. BROWSER COMPATIBILITY

### Current State
- `crypto.randomUUID()` used in LicenseFeatureFlags.tsx, LicenseTagsInput.tsx — not available in older browsers or some SSR contexts
- `crypto.getRandomValues()` in UserMfaSetup.tsx — not SSR-safe
- `DevicesExportButton.tsx` uses `document.createElement("a")` outside useEffect — would crash on SSR

### Fix Required
- Use a simple counter or `nanoid` fallback for `randomUUID()`
- Move DOM-reliant code inside `useEffect`
- Ensure all browser API usage is SSR-safe with `typeof window !== "undefined"` checks

## 7. MOBILE RESPONSIVENESS

### Current State
- 6-column stat grids on mobile (dashboard, licenses)
- `premium/loading.tsx` has non-responsive `grid-cols-5` and `grid-cols-4`
- DataTable components likely overflow on small screens
- Modal has fixed width that may exceed viewport

### Fix Required
- Add responsive grid column variants to all stat grids
- Ensure DataTable has horizontal scroll (`overflow-x-auto`)
- Make modals responsive (`max-w-[90vw]` or `w-full sm:max-w-lg`)
- Test all pages at 375px, 768px, 1024px, 1440px

## 8. DARK MODE

### Current State
- All components use hardcoded dark colors (`bg-zinc-950`, `text-zinc-100`, `border-zinc-800`)
- `globals.css` defines both `:root` (light) and `.dark` (dark) themes
- No theme toggle mechanism exists
- App is effectively dark-mode-only

### Fix Required
- Either commit to dark-only (remove light theme vars) or implement theme-aware CSS variables
- If implementing light mode, replace all hardcoded colors with `bg-background`, `text-foreground`, etc.
- Add theme toggle component

## 9. FORM VALIDATION & UX

### Current State
- No form validation library (Zod, Yup)
- Manual `if (!x)` checks in API routes
- Form fields lack `aria-describedby` for error messages
- Some forms don't submit on Enter key press
- `BulkCreateLicenseModal.tsx` form fields not wrapped in `<form>` element

### Fix Required
- Integrate Zod for client + server validation
- Wrap forms in `<form>` elements for proper keyboard handling
- Add `aria-describedby` linking inputs to error messages
- Add Enter key submission handlers

## 10. PAGE-LEVEL ISSUES

### `/dashboard`
- 6-column stat grid collapses poorly on mobile
- "No recent activity" is plain text, not EmptyState component
- No `loading.tsx` — blank screen on navigation
- No `metadata` export — shows generic tab title

### `/users`
- User table: no loading skeleton
- `users/[id]/page.tsx`: detailed view with good data but no loading state

### `/settings`
- "Emergency Lockdown" links to API route directly (returns JSON)
- "Revoke All Sessions" and "Export Audit Logs" buttons do nothing
- Hardcoded "Healthy" stat
- `AddMemberForm.tsx:57` uses `location.reload()` instead of `router.refresh()`

### `/system-health`
- `getApiHealth()` returns `status: "healthy"` for all endpoints — doesn't actually probe
- No loading state
- No error state

### `/support`
- Good structure but missing loading/error states
- Ticket details missing loading skeleton

### `/broadcasts`
- `BroadcastActions.tsx` uses `confirm()` instead of modal
- `CreateBroadcastForm.tsx` has potential crash on `json.data.id`

### `/gems`
- Potential crash on `new Date(r.startDate).toLocaleDateString()` when null

### `/organizations`
- Good structure but missing loading/error states
- `ActivityIcon` component used before definition (hoisting-dependent)

## PRIORITY FIX LIST

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| P0 | Add `error.tsx` files (3 files) | Low | Prevents full-app crash |
| P0 | Add `not-found.tsx` files (3 files) | Low | Better 404 UX |
| P0 | Fix `location.reload()` in AddMemberForm | Low | Prevents state loss |
| P1 | Fix broken action buttons in settings | Low | Unlocks functionality |
| P1 | Fix `onToggle={() => {}}` in device detail | Low | UI reflects state changes |
| P1 | Add loading.tsx to top 10 pages | Medium | Better navigation UX |
| P1 | Add metadata to all pages | Medium | Better browser UX |
| P2 | Add confirmations to 16 destructive actions | Medium | Prevents data loss |
| P2 | Replace alert()/confirm() with modals | Low | Enterprise UX |
| P2 | Fix mobile grid layouts | Low | Better mobile UX |
| P3 | Add input validation (Zod) | High | Security & reliability |
| P3 | Add rate limiting | High | Security |
| P3 | Standardize API response format | High | API consistency |
| P4 | Implement light mode / theme toggle | Medium | User preference |
| P4 | Add comprehensive a11y attributes | Medium | Accessibility |
