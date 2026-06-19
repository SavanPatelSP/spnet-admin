# ADMIN FULL AUDIT

**Project:** SPNET Admin
**Date:** 2026-06-18
**Node:** 16.2.9

---

## 1. RUNTIME ERRORS & CRASH POTENTIAL

| Severity | File | Issue | Fix |
|----------|------|-------|-----|
| HIGH | `gems/page.tsx:144` | `new Date(r.startDate).toLocaleDateString()` crashes when `r.startDate` is null | Guard with `r.startDate ? new Date(r.startDate).toLocaleDateString() : "N/A"` |
| HIGH | `broadcasts/CreateBroadcastForm.tsx:41` | `json.data.id` may be undefined causing fetch to `/api/broadcasts/undefined/send` | Add `if (!json.data?.id)` guard |
| HIGH | `licenses/[id]/page.tsx:50-53` | Empty catch on JSON.parse swallows errors silently | Log parse failures to identify corrupted data |
| MEDIUM | `users/[id]/page.tsx:119` | Unguarded `formatDateTime(member.lastLogin)` would crash if null | Already guarded with `?` — confirmed OK |
| MEDIUM | `gems/page.tsx:33` | `user.gemBalances[0]` could be undefined if user has no gem balance | Add optional chaining |

## 2. HYDRATION ISSUES

| Severity | File | Issue | Fix |
|----------|------|-------|-----|
| LOW | `login/page.tsx:21-32` | `useEffect` with `setTimeout(0)` to avoid hydration warning | Use `use()` hook pattern or `sync` external store |
| NONE | All pages | Server components are async — no hydration issues detected | N/A |

## 3. REACT WARNINGS & BEST PRACTICES

| Severity | File | Issue | Fix |
|----------|------|-------|-----|
| MEDIUM | `LicenseAnalytics.tsx:40-56` | 6x `useState` + `useEffect` + `setTimeout(0)` instead of `useMemo` | Replace with computed values using `useMemo` |
| MEDIUM | `CoinsAnalytics.tsx` | Analytics computed in `useEffect` instead of `useMemo` | Use `useMemo` |
| MEDIUM | `GemsAnalytics.tsx:39-60` | Same pattern as CoinsAnalytics | Use `useMemo` |
| LOW | `LicenseTrialManager.tsx:32-41` | `setTimeout(0)` for computed state | Use inline computation or `useMemo` |
| LOW | `LicenseTemplatesManager.tsx:52-55` | `setTimeout(0)` for data fetch | Call directly in useEffect |

## 4. PRISMA ISSUES

| Severity | File | Issue | Fix |
|----------|------|-------|-----|
| MEDIUM | `devices/analytics/route.ts:50-53` | `$queryRawUnsafe` with string interpolation risk | Use `$queryRaw` tagged template literal |
| MEDIUM | `licenses/transfer/route.ts:30` | Self-referential `parentLicenseId: licenseId` | Set to `null` or track previous parent correctly |
| LOW | All endpoints | Generic 500 on Prisma errors instead of specific codes | Map P2002→409, P2025→404, P2003→400 |

## 5. BROKEN ACTIONS

| Severity | File | Issue | Fix |
|----------|------|-------|-----|
| HIGH | `settings/page.tsx:71` | `<Link href="/api/licenses/emergency-mode">` navigates to API JSON | Change to `<button>` with POST fetch + confirmation |
| HIGH | `settings/page.tsx:78` | "Revoke All Sessions" `<button>` has no `onClick` | Add onClick handler |
| HIGH | `settings/page.tsx:79` | "Export Audit Logs" `<button>` has no `onClick` | Add onClick handler |
| HIGH | `devices/[id]/page.tsx:37` | `onToggle={() => {}}` empty callback on DeviceBlacklistButton | Pass real state-updating callback |
| HIGH | `MemberActions.tsx:19-36` | Suspend/reactivate/delete fire fetch with NO error handling | Add try/catch + error state |
| HIGH | `RoleSelector.tsx:17-25` | Role change fire-and-forget with no error handling | Add error handling + rollback on failure |
| HIGH | `PolicyActions.tsx:17-24` | Toggle fire-and-forget with no error handling | Add error handling |

## 6. MISSING CRUD OPERATIONS

| Resource | Missing |
|----------|---------|
| License Events | No PUT (update) or DELETE endpoints |
| License Tags | No PUT (update tag) |
| Moderation Actions | No POST (create) or PUT (update) — only DELETE |
| Devices | No PATCH for partial updates |
| Gems Rewards | POST used for update/delete instead of PUT/DELETE |

## 7. NON-WORKING BUTTONS

| File | Button | Issue |
|------|--------|-------|
| `settings/page.tsx` | Revoke All Sessions | No onClick handler assigned |
| `settings/page.tsx` | Export Audit Logs | No onClick handler assigned |
| `devices/[id]/page.tsx` | DeviceBlacklistButton toggle | `onToggle={() => {}}` — no state update |

## 8. DIALOG SCROLLING & CUT-OFF CONTENT

| File | Issue | Fix |
|------|-------|-----|
| `ui/Modal.tsx` | Fixed height without `overflow-y: auto` | Add `overflow-y-auto` to content area |
| `ChangePremiumPlanModal.tsx` | No overflow scroll | Add scroll handling for long plan lists |
| Several modals | No Escape key handler | Add `onKeyDown` Escape handler to Modal |

## 9. POOR UX

| File | Issue | Fix |
|------|-------|-----|
| `RefundCoinsButton.tsx:29,34` | Uses `alert()` for errors | Replace with inline error display |
| `DeleteRoleButton.tsx:27` | Uses `alert()` for errors | Replace with toast/inline error |
| `DeleteRoleButton.tsx` | Uses `confirm()` for confirmation | Replace with ConfirmDialog component |
| `BroadcastActions.tsx:35` | Uses `confirm()` for confirmation | Replace with ConfirmDialog component |
| `TeamMembersDataTable.tsx:85` | Uses `confirm()` for bulk delete | Replace with ConfirmDialog |
| `ErrorBoundary.tsx` | `window.location.reload()` hard reload | Use graceful recovery + retry |
| `AddMemberForm.tsx:57` | `location.reload()` destroys state | Use `router.refresh()` |
| `AddMemberForm.tsx:19` | Hardcoded `/api/licenses/list` | Use `API_ROUTES.LICENSES.LIST` constant |
| `ActionButton.tsx` | No `type="button"` | Add `type="button"` to prevent form submit |

## 10. PLACEHOLDER / FAKE DATA

| File | Line | Value | Fix |
|------|------|-------|-----|
| `settings/system/page.tsx:23` | `value="99.9%"` | Hardcoded uptime | Calculate from real data or remove |
| `settings/page.tsx:40` | `value="Healthy"` | Hardcoded platform health | Query real health status |
| `reports/page.tsx:25` | `value={0}` | "Pending Review" always 0 | Query actual count |
| `content/page.tsx:23,25` | `value={0}` | "Flagged"/"Pending" always 0 | Query actual counts |
| `broadcasts/[id]/send/route.ts:20-32` | `sentCount=targetCount;failedCount=0` | Faked send result | Implement actual sending or mark as simulated |
| `getApiHealth()` in system-health | All return `status:"healthy"` | No actual API probing | Implement real endpoint health checks |

## 11. MISSING CONFIRMATIONS

| File | Action | Fix |
|------|--------|-----|
| `ToggleLicenseStatusButton.tsx` | Toggle active/inactive | Add ConfirmDialog |
| `LicenseTransferButton.tsx` | Transfer license (financial impact) | Add ConfirmDialog |
| `EditLicenseButton.tsx` | Plan/status changes | Add ConfirmDialog |
| `UserDetailActions.tsx:28` | Suspend user | Add ConfirmDialog |
| `SetInfiniteCoinsButton.tsx` | Grant infinite coins | Add ConfirmDialog |
| `RemoveInfiniteCoinsButton.tsx` | Remove infinite coins | Add ConfirmDialog |
| `SetInfiniteGemsButton.tsx` | Grant infinite gems | Add ConfirmDialog |
| `RemoveInfiniteGemsButton.tsx` | Remove infinite gems | Add ConfirmDialog |
| `ChangePremiumPlanModal.tsx` | Change premium plan (billing impact) | Add ConfirmDialog |
| `MemberActions.tsx:41,45` | Suspend/Reactivate member | Add ConfirmDialog |
| `RoleSelector.tsx:17-25` | Change member role (privilege change) | Add ConfirmDialog |
| `TeamMembersDataTable.tsx:59,71` | BulkSuspend/BulkReactivate | Add ConfirmDialog |
| `PolicyActions.tsx:17-24` | Toggle security policy | Add ConfirmDialog |

## 12. MISSING AUDIT LOGS

| Endpoint | Audit Log Missing |
|----------|-------------------|
| `licenses/list/route.ts` | No audit logging |
| `licenses/usage/route.ts` | No audit logging |
| `licenses/events/route.ts` | No audit logging |
| `licenses/events/create/route.ts` | No audit logging |
| `moderation/actions/[id]/route.ts` | No audit logging (DELETE) |
| `moderation/reports/[id]/route.ts` | No audit logging (GET) |
| `gems/rewards/create/route.ts` | No audit logging |
| `gems/rewards/update/route.ts` | No audit logging |
| `gems/rewards/delete/route.ts` | No audit logging |
| `gems/rewards/list/route.ts` | No audit logging |
| `coins/balance/route.ts` | No audit logging |
| `coins/history/route.ts` | No audit logging |
| `devices/list/route.ts` | No audit logging |
| `devices/detail/route.ts` | No audit logging |
| `devices/session-enforcement/route.ts` | No audit logging |
| `devices/analytics/route.ts` | No audit logging |
| `roles/list/route.ts` | No audit logging |

## 13. MISSING LOADING INDICATORS

| File | Issue | Fix |
|------|-------|-----|
| 34 pages missing `loading.tsx` | No skeleton during data fetch | Add loading.tsx to each route |
| `RoleSelector.tsx:17-25` | No loading state during role change | Add spinner/disabled state |
| `DeviceBlacklistButton.tsx:39-54` | No loading state during whitelist | Add loading state |

## 14. MOBILE LAYOUT ISSUES

| File | Issue | Fix |
|------|-------|-----|
| `dashboard/page.tsx:79` | `columns={6}` stat grid too wide on mobile | Use responsive grid: `1 sm:2 lg:3 xl:6` |
| `licenses/page.tsx:64` | Same 6-column issue | Same fix |
| `premium/loading.tsx:18` | `grid-cols-5` no responsive variant | Add responsive breakpoints |
| `premium/loading.tsx:27` | `grid-cols-4` no responsive variant | Add responsive breakpoints |
| DataTable components | No horizontal scroll on mobile | Add overflow-x-auto wrapper |
| `Modal.tsx` | Fixed width can overflow on small screens | Use responsive width: `w-full sm:w-auto` |

## 15. ENTERPRISE-GRADE GAPS

| Area | Gap | Impact |
|------|-----|--------|
| Rate limiting | Zero rate limiting on any endpoint | Brute force / DoS |
| Input validation | No Zod/Yup schemas | Injection, bad data |
| Error boundaries | Zero error.tsx files | Full-app crash on error |
| Metadata | Zero page-level metadata exports | Poor UX in tabs/bookmarks |
| Response standardization | 3+ different response shapes | API client confusion |
| Temporary passwords | Returned in API response body | Security leak |
| Unauthenticated endpoints | license/validate, device/validate | No auth on critical validation |
| CSP | CSP configured but not enforced on API | XSS risk |
| Emergency lockdown | No confirmation, dry-run, or undo | Data loss risk |
| Sequential batch ops | Bulk actions run sequentially | Slow for large batches |
