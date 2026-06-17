# Week 1 — Users: Completion Report

## Status: ✅ Complete

## Schema Changes
- **TeamMember**: Added `mfaSecret`, `mfaEnabled`, `passwordChangedAt`, `ssoProvider`, `ssoId`, `department`, `phone`, `avatarUrl`, `lastLoginIp`, `lastUserAgent`
- **Session** (new): `id`, `teamMemberId` (FK), `token`, `ipAddress`, `userAgent`, `expiresAt`, `createdAt`
- **LoginHistory** (new): `id`, `teamMemberId` (FK), `ipAddress`, `userAgent`, `success`, `failureReason`, `createdAt`
- **MfaBackupCode** (new): `id`, `teamMemberId` (FK), `code`, `used`, `createdAt`

## API Routes (7 new)
| Route | Method | Permission |
|-------|--------|------------|
| `/api/team-members/bulk-invite` | POST | Bulk Invite Users |
| `/api/team-members/mfa/setup` | POST | Manage MFA |
| `/api/team-members/mfa/disable` | POST | Manage MFA |
| `/api/team-members/sessions/list` | GET | Manage Sessions |
| `/api/team-members/sessions/revoke` | POST | Manage Sessions |
| `/api/team-members/login-history` | GET | View Login History |
| `/api/team-members/lifecycle` | PUT | User Lifecycle Management |

## UI Components (8 new)
- `UserSessionsPanel` — active sessions list with revoke
- `UserLoginHistory` — login history with filterable table
- `UserMfaSetup` — enable/disable MFA with secret display
- `BulkInviteModal` — multi-row invitation form
- `BulkInviteButton` — client wrapper for modal state
- `UserPasswordPolicy` — password policy display/editor
- `UserLifecycleTimeline` — vertical event timeline

## Page Upgrades
- **`/users`**: Added MFA/sessions/login-history stats; Bulk Invite button in header; password policy summary
- **`/users/[id]`**: Added MFA section, Session panel, Login History, Lifecycle Timeline, Password Policy; new stat cards (MFA status, Active Sessions, Failed Today, Account Locked)

## Permissions Added (6)
`Manage MFA`, `View Login History`, `Manage Sessions`, `User Lifecycle Management`, `Bulk Invite Users`, `Export Users`
