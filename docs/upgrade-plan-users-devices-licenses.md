# Final Upgrade Plan: Users · Devices · Licenses

Target: 9.5/10 for all three modules — the most advanced in the platform.

---

## Phase 1: Users — Full Lifecycle Management

### Schema Changes (TeamMember + new models)

| Change | Details |
|--------|---------|
| ✅ Add `mfaSecret` | `String?` — TOTP encrypted secret |
| ✅ Add `mfaEnabled` | `Boolean @default(false)` |
| ✅ Add `passwordChangedAt` | `DateTime?` — track last password change |
| ✅ Add `ssoProvider` | `String?` — e.g. "google", "azure", "saml" |
| ✅ Add `ssoId` | `String?` — external identity provider ID |
| ✅ Add `department` | `String?` — organizational unit |
| ✅ Add `phone` | `String?` — contact number |
| ✅ Add `avatarUrl` | `String?` — profile photo |
| ✅ Add `lastLoginIp` | `String?` |
| ✅ Add `lastUserAgent` | `String?` — browser/device detection |
| ✅ New model: **Session** | `id`, `teamMemberId`, `token`, `ipAddress`, `userAgent`, `expiresAt`, `createdAt` |
| ✅ New model: **LoginHistory** | `id`, `teamMemberId`, `ipAddress`, `userAgent`, `success`, `failureReason?`, `createdAt` |
| ✅ New model: **MfaBackupCode** | `id`, `teamMemberId`, `code` (hashed), `used`, `createdAt` |

### New API Routes (6)

| Route | Method | Purpose | Permission |
|-------|--------|---------|------------|
| `/api/team-members/enable-mfa` | POST | Generate TOTP secret, return provisioning URI + QR code | `"Edit Users"` |
| `/api/team-members/verify-mfa` | POST | Verify TOTP code to confirm MFA setup | `"Edit Users"` |
| `/api/team-members/disable-mfa` | POST | Disable MFA for a member | `"Edit Users"` |
| `/api/team-members/sessions` | GET | List active sessions for a member | `"View Users"` |
| `/api/team-members/revoke-session` | POST | Terminate a specific session | `"Edit Users"` |
| `/api/team-members/bulk-invite` | POST | CSV/email-list bulk invite with role mapping | `"Invite Team Members"` |

### New UI Components (6)

| Component | Description |
|-----------|-------------|
| `MfaSetupModal` | Steps: scan QR code, enter verification code, show backup codes |
| `MfaStatusBadge` | Green "MFA Enabled" / grey "MFA Disabled" badge with lock icon |
| `SessionsPanel` | Active sessions table with device, IP, last active, revoke button |
| `LoginHistoryTable` | Paginated login attempts with IP, browser, success/failure, geo hint |
| `MemberSecurityCard` | Consolidated card on detail page: MFA, sessions, login history, password age |
| `BulkInviteModal` | Textarea for emails + role selector + optional license mapping |

### Page Upgrades

| Page | Changes |
|------|---------|
| `/users/[id]` | Add tabbed layout: Profile, Security & Sessions (MFA status, active sessions, login history), Audit Trail |
| `/settings/team-members` | Add columns: MFA status badge, last login IP, department; add bulk invite button |
| `/settings/security` | Add password policy section (min length, complexity, expiry days) |

---

## Phase 2: Devices — Real Device Intelligence

### Schema Changes (Activation + new models)

| Change | Details |
|--------|---------|
| ✅ Add `deviceFingerprint` | `String?` — SHA-256 hash of device characteristics |
| ✅ Add `os` | `String?` — e.g. "Windows 11", "macOS 14", "Android 14" |
| ✅ Add `osVersion` | `String?` |
| ✅ Add `browser` | `String?` — e.g. "Chrome", "Firefox", "Edge" |
| ✅ Add `browserVersion` | `String?` |
| ✅ Add `deviceType` | `String?` — "desktop", "mobile", "tablet", "server", "iot" |
| ✅ Add `userAgent` | `String?` — raw UA string |
| ✅ Add `country` | `String?` — resolved from IP |
| ✅ Add `city` | `String?` |
| ✅ Add `latitude` | `Float?` |
| ✅ Add `longitude` | `Float?` |
| ✅ Add `isp` | `String?` — internet service provider |
| ✅ Add `lastSeenAt` | `DateTime?` — last heartbeat/check-in |
| ✅ Add `status` | `String @default("ACTIVE")` — ACTIVE, SUSPENDED, BLACKLISTED |
| ✅ Add `trustScore` | `Int @default(50)` — 0-100 based on behavior |
| ✅ Add `notes` | `String?` — admin notes |
| ✅ New model: **DeviceFingerprint** | `id`, `fingerprint` (unique), `firstSeenAt`, `lastSeenAt`, `activationCount`, `licenseIds` (JSON) |

### New API Routes (8)

| Route | Method | Purpose | Permission |
|-------|--------|---------|------------|
| `/api/devices/validate` | POST | Server-side activation validation — checks max devices, blacklist, concurrent limits | Public (SDK) |
| `/api/devices/blacklist` | POST | Blacklist a device by ID | `"Manage Device Policies"` |
| `/api/devices/unblacklist` | POST | Remove blacklist | `"Manage Device Policies"` |
| `/api/devices/bulk-blacklist` | POST | Bulk blacklist by device IDs | `"Manage Device Policies"` |
| `/api/devices/fingerprint/{hash}` | GET | Look up all activations for a device fingerprint | `"View Devices"` |
| `/api/devices/concurrent` | GET | Check concurrent session counts per license | `"View Devices"` |
| `/api/devices/stats` | GET | Platform-level device analytics summary | `"View Analytics"` |
| `/api/devices/list` | GET | Paginated, filterable, sortable device list | `"View Devices"` |

### New UI Components (7)

| Component | Description |
|-----------|-------------|
| `DeviceFingerprintDisplay` | Expandable section showing fingerprint hash, first/last seen, cross-license history |
| `DeviceInfoCard` | Rich card: OS, browser, device type, geolocation, ISP, trust score gauge |
| `DeviceStatusActions` | Toggle ACTIVE/SUSPENDED/BLACKLISTED with confirmation |
| `DeviceTrustGauge` | Circular gauge 0-100 with green/yellow/red thresholds |
| `DeviceGeoMap` | Simple static map pin showing lat/lng (via static map URL) |
| `DeviceFilterBar` | Rich filters: OS, browser, device type, country, status, date range |
| `ActivationTimeline` | Per-license activation/deactivation timeline |

### Page Upgrades

| Page | Changes |
|------|---------|
| `/devices` | Replace all-at-once load with server-paginated API (`/api/devices/list`); add rich filter bar; add columns: OS, device type, country, trust score, status, last seen |
| `/devices/[id]` | Add fingerprint panel with cross-license history; add geolocation card; add trust score gauge; add status toggle (blacklist/suspend); add notes editor |
| `/licenses/[id]` | Add device utilization trend chart; add concurrent session indicator; add enforcement status |

---

## Phase 3: Licenses — Enterprise License Operations

### Schema Changes (License + new models)

| Change | Details |
|--------|---------|
| ✅ Add `featureFlags` | `String?` — JSON object of feature entitlements |
| ✅ Add `tags` | `String?` — JSON array of strings |
| ✅ Add `group` | `String?` — logical grouping for fleet management |
| ✅ Add `templateId` | `String?` — FK to LicenseTemplate |
| ✅ Add `trialEndsAt` | `DateTime?` — trial expiration |
| ✅ Add `autoRenew` | `Boolean @default(false)` |
| ✅ Add `lastValidatedAt` | `DateTime?` — last external validation |
| ✅ Add `metadata` | `String?` — JSON extensible fields |
| ✅ New model: **LicenseTemplate** | `id`, `name`, `plan`, `maxDevices`, `durationDays`, `featureFlags` (JSON), `price`, `createdAt` |
| ✅ New model: **LicenseEvent** | `id`, `licenseId`, `field`, `oldValue`, `newValue`, `performedBy`, `createdAt` |
| ✅ New model: **LicenseTag** | `id`, `name` (unique), `color` |

### New API Routes (10)

| Route | Method | Purpose | Permission |
|-------|--------|---------|------------|
| `/api/licenses/bulk-create` | POST | CSV/JSON batch import with row preview | `"Create Licenses"` |
| `/api/licenses/validate` | POST | Public validation — key + fingerprint, returns status + features | Public (SDK) |
| `/api/licenses/feature-flags` | PUT | Set per-license feature flags | `"Edit Licenses"` |
| `/api/licenses/transfer` | POST | Transfer license between organizations | `"Edit Licenses"` |
| `/api/licenses/convert-trial` | POST | Convert trial license to paid plan | `"Edit Licenses"` |
| `/api/licenses/usage` | GET | Aggregated usage analytics (hourly/daily active devices) | `"View Analytics"` |
| `/api/licenses/templates` | GET | List all license templates | `"View Licenses"` |
| `/api/licenses/templates/create` | POST | Create a license template | `"Create Licenses"` |
| `/api/licenses/templates/{id}` | PUT/DELETE | Update/delete a template | `"Edit Licenses"` |
| `/api/licenses/export` | GET | Export licenses as JSON or PDF | `"View Licenses"` |

### New UI Components (10)

| Component | Description |
|-----------|-------------|
| `FeatureFlagEditor` | Grid of feature toggles per license — checkbox list with grouping |
| `LicenseTagManager` | Tag input with autocomplete, color dots, suggested tags |
| `LicenseTemplateModal` | Create/edit template with plan, defaults, feature flags, price |
| `BulkCreateLicenseModal` | CSV paste/upload with row preview, field mapping, dry-run |
| `LicenseTransferModal` | Select target org, confirm with warning about active devices |
| `TrialManager` | Trial creation panel: duration, plan, auto-convert settings |
| `LicenseTimeline` | Full event log with field-level diffs (old → new values) |
| `UsageDashboard` | Aggregated charts: daily active devices, top orgs, plan distribution trends |
| `FloatingPoolManager` | Pool configuration: total seats, assigned licenses, availability |
| `ComplianceReportButton` | One-click SOC2/HIPAA report generation (exports JSON summary) |

### Page Upgrades

| Page | Changes |
|------|---------|
| `/licenses` | Add server-side pagination with cursor-based API; add tag filter + group filter + feature flag filter; add columns: tags, feature flags (compact dots), group, last validated |
| `/licenses/[id]` | Add tabbed layout: Overview, Feature Flags, Usage, Changelog (timeline), Compliance; add license events timeline; add tags manager; add transfer button; add trial conversion panel |
| `/licenses/templates` | New page: list all templates, create/edit, apply template to license |
| `/analytics` | Add license usage dashboard section (daily active, plan trends) |
| New `/api/licenses/validate` | Public endpoint — external SDKs call this to verify license validity + get feature flags |

---

## Execution Plan

### Phase 1 — Users (Week 1)
1. Schema migration — add TeamMember fields + Session + LoginHistory + MfaBackupCode models
2. Create 6 API routes
3. Create 6 UI components  
4. Upgrade user detail page and team settings page
5. Verify build + seed

### Phase 2 — Devices (Week 2)
1. Schema migration — add Activation fields + DeviceFingerprint model
2. Create 8 API routes (including public validate endpoint)
3. Create 7 UI components
4. Upgrade devices listing + detail pages
5. Add server-side pagination to devices list
6. Verify build + seed

### Phase 3 — Licenses (Week 3)
1. Schema migration — add License fields + LicenseTemplate + LicenseEvent + LicenseTag models
2. Create 10 API routes (including public validate + bulk-create)
3. Create 10 UI components
4. Upgrade licenses listing + detail pages
5. Add server-side pagination to licenses list
6. Create templates management page
7. Verify build + seed

### Week 4 — Integration & Polish
1. Cross-link all three modules (user sessions show device info; license detail shows user assignments)
2. Add permission seeds for new dot-notation permissions
3. Audit log consolidation
4. Load testing with 10K+ records (verify pagination)
5. Final build verification
