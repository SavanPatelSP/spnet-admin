export interface PermissionMeta {
  friendlyName: string;
  description: string;
}

export const PERMISSION_META: Record<string, PermissionMeta> = {
  "View Dashboard": {
    friendlyName: "View Dashboard",
    description: "Allows the user to view the main dashboard and platform overview.",
  },
  "Create Licenses": {
    friendlyName: "Create Licenses",
    description: "Allows the user to create new license keys for organizations.",
  },
  "View Licenses": {
    friendlyName: "View Licenses",
    description: "Allows the user to view all licenses and their details.",
  },
  "Edit Licenses": {
    friendlyName: "Edit Licenses",
    description: "Allows the user to modify existing license configurations.",
  },
  "Delete Licenses": {
    friendlyName: "Delete Licenses",
    description: "Allows the user to permanently delete licenses from the system.",
  },
  "Regenerate License Keys": {
    friendlyName: "Regenerate License Keys",
    description: "Allows the user to regenerate license keys for existing licenses.",
  },
  "Toggle License Status": {
    friendlyName: "Toggle License Status",
    description: "Allows the user to activate or suspend licenses.",
  },
  "Emergency License Lockdown": {
    friendlyName: "Emergency License Lockdown",
    description: "Allows the user to trigger an emergency lockdown on all licenses.",
  },
  "Manage License Features": {
    friendlyName: "Manage License Features",
    description: "Allows the user to enable or disable features on a per-license basis.",
  },
  "Manage License Tags": {
    friendlyName: "Manage License Tags",
    description: "Allows the user to add, edit, or remove tags on licenses.",
  },
  "Manage License Templates": {
    friendlyName: "Manage License Templates",
    description: "Allows the user to create and manage license templates.",
  },
  "Bulk Create Licenses": {
    friendlyName: "Bulk Create Licenses",
    description: "Allows the user to create multiple licenses at once.",
  },
  "Transfer Licenses": {
    friendlyName: "Transfer Licenses",
    description: "Allows the user to transfer licenses between organizations.",
  },
  "Validate Licenses": {
    friendlyName: "Validate Licenses",
    description: "Allows the user to validate license keys and their status.",
  },
  "Manage Trials": {
    friendlyName: "Manage Trials",
    description: "Allows the user to create and manage trial licenses.",
  },
  "View License Usage": {
    friendlyName: "View License Usage",
    description: "Allows the user to view usage statistics for licenses.",
  },
  "View License Events": {
    friendlyName: "View License Events",
    description: "Allows the user to view the event history for licenses.",
  },
  "Export Licenses": {
    friendlyName: "Export Licenses",
    description: "Allows the user to export license data to external formats.",
  },
  "View Devices": {
    friendlyName: "View Devices",
    description: "Allows the user to view all registered devices.",
  },
  "Revoke Devices": {
    friendlyName: "Revoke Devices",
    description: "Allows the user to revoke device access.",
  },
  "Manage Device Policies": {
    friendlyName: "Manage Device Policies",
    description: "Allows the user to configure device management policies.",
  },
  "View Device Fingerprints": {
    friendlyName: "View Device Fingerprints",
    description: "Allows the user to view device fingerprint data.",
  },
  "Update Device Trust": {
    friendlyName: "Update Device Trust",
    description: "Allows the user to adjust trust levels for devices.",
  },
  "Blacklist Devices": {
    friendlyName: "Blacklist Devices",
    description: "Allows the user to add devices to the blacklist.",
  },
  "Whitelist Devices": {
    friendlyName: "Whitelist Devices",
    description: "Allows the user to add devices to the whitelist.",
  },
  "View Device Analytics": {
    friendlyName: "View Device Analytics",
    description: "Allows the user to view analytics and statistics for devices.",
  },
  "Export Device Data": {
    friendlyName: "Export Device Data",
    description: "Allows the user to export device data.",
  },
  "Validate Devices": {
    friendlyName: "Validate Devices",
    description: "Allows the user to validate device status and compliance.",
  },
  "Activate Devices": {
    friendlyName: "Activate Devices",
    description: "Allows the user to activate devices on the platform.",
  },
  "Deactivate Devices": {
    friendlyName: "Deactivate Devices",
    description: "Allows the user to deactivate devices.",
  },
  "Suspend Devices": {
    friendlyName: "Suspend Devices",
    description: "Allows the user to suspend device access temporarily.",
  },
  "View Users": {
    friendlyName: "View Users",
    description: "Allows the user to view all platform users.",
  },
  "Create Users": {
    friendlyName: "Create Users",
    description: "Allows the user to create new user accounts.",
  },
  "Edit Users": {
    friendlyName: "Edit Users",
    description: "Allows the user to modify user account details.",
  },
  "Delete Users": {
    friendlyName: "Delete Users",
    description: "Allows the user to permanently delete user accounts.",
  },
  "Manage MFA": {
    friendlyName: "Manage MFA",
    description: "Allows the user to manage multi-factor authentication for users.",
  },
  "View Login History": {
    friendlyName: "View Login History",
    description: "Allows the user to view login history for all users.",
  },
  "User Lifecycle Management": {
    friendlyName: "User Lifecycle Management",
    description: "Allows the user to manage full user lifecycle (archive, restore).",
  },
  "Bulk Invite Users": {
    friendlyName: "Bulk Invite Users",
    description: "Allows the user to invite multiple users at once.",
  },
  "Export Users": {
    friendlyName: "Export Users",
    description: "Allows the user to export user data.",
  },
  "View Team Members": {
    friendlyName: "View Team Members",
    description: "Allows the user to view all team members.",
  },
  "Invite Team Members": {
    friendlyName: "Invite Team Members",
    description: "Allows the user to send invitations to new team members.",
  },
  "Create Team Members": {
    friendlyName: "Create Team Members",
    description: "Allows the user to create team members with credentials directly.",
  },
  "Remove Team Members": {
    friendlyName: "Remove Team Members",
    description: "Allows the user to remove team members from the platform.",
  },
  "Change Member Roles": {
    friendlyName: "Change Member Roles",
    description: "Allows the user to change the role assigned to team members.",
  },
  "Transfer Ownership": {
    friendlyName: "Transfer Ownership",
    description: "Allows the user to transfer platform ownership to another member.",
  },
  "View Passwords": {
    friendlyName: "View Passwords",
    description: "Allows the user to view passwords for team member accounts.",
  },
  "Generate Passwords": {
    friendlyName: "Generate Passwords",
    description: "Allows the user to generate secure passwords for team members.",
  },
  "Reset Passwords": {
    friendlyName: "Reset Passwords",
    description: "Allows the user to reset passwords for team members.",
  },
  "Manage Password Policy": {
    friendlyName: "Manage Password Policy",
    description: "Allows the user to configure password policy rules and requirements.",
  },
  "Generate Temp Passwords": {
    friendlyName: "Generate Temp Passwords",
    description: "Allows the user to generate temporary passwords for team members.",
  },
  "View Roles": {
    friendlyName: "View Roles",
    description: "Allows the user to view all roles and their configurations.",
  },
  "Create Roles": {
    friendlyName: "Create Roles",
    description: "Allows the user to create new roles with custom permissions.",
  },
  "Edit Roles": {
    friendlyName: "Edit Roles",
    description: "Allows the user to modify existing role configurations.",
  },
  "Delete Roles": {
    friendlyName: "Delete Roles",
    description: "Allows the user to delete roles from the platform.",
  },
  "Clone Roles": {
    friendlyName: "Clone Roles",
    description: "Allows the user to duplicate existing roles as a starting point.",
  },
  "View Security Policies": {
    friendlyName: "View Security Policies",
    description: "Allows the user to view all security policies.",
  },
  "Edit Security Policies": {
    friendlyName: "Edit Security Policies",
    description: "Allows the user to modify security policy configurations.",
  },
  "Toggle Security Policies": {
    friendlyName: "Toggle Security Policies",
    description: "Allows the user to enable or disable security policies.",
  },
  "Emergency Lockdown": {
    friendlyName: "Emergency Lockdown",
    description: "Allows the user to trigger an emergency platform lockdown.",
  },
  "View Audit Logs": {
    friendlyName: "View Audit Logs",
    description: "Allows the user to view all audit log entries.",
  },
  "Export Audit Logs": {
    friendlyName: "Export Audit Logs",
    description: "Allows the user to export audit log data.",
  },
  "Configure Audit Settings": {
    friendlyName: "Configure Audit Settings",
    description: "Allows the user to configure audit retention and settings.",
  },
  "Manage Sessions": {
    friendlyName: "Manage Sessions",
    description: "Allows the user to view and manage active user sessions.",
  },
  "Extend Sessions": {
    friendlyName: "Extend Sessions",
    description: "Allows the user to extend the duration of active sessions.",
  },
  "Force Logout": {
    friendlyName: "Force Logout",
    description: "Allows the user to forcefully terminate active sessions.",
  },
  "Override Session Policy": {
    friendlyName: "Override Session Policy",
    description: "Allows the user to override default session policies for specific cases.",
  },
  "Override Login Tenure": {
    friendlyName: "Override Login Tenure",
    description: "Allows the user to override the maximum login tenure for users.",
  },
  "View Session History": {
    friendlyName: "View Session History",
    description: "Allows the user to view historical session data.",
  },
  "View Organizations": {
    friendlyName: "View Organizations",
    description: "Allows the user to view all organizations on the platform.",
  },
  "Create Organizations": {
    friendlyName: "Create Organizations",
    description: "Allows the user to create new organizations.",
  },
  "Edit Organizations": {
    friendlyName: "Edit Organizations",
    description: "Allows the user to modify organization details.",
  },
  "Delete Organizations": {
    friendlyName: "Delete Organizations",
    description: "Allows the user to delete organizations from the platform.",
  },
  "View Premium": {
    friendlyName: "View Premium",
    description: "Allows the user to view premium subscription data.",
  },
  "Grant Premium": {
    friendlyName: "Grant Premium",
    description: "Allows the user to grant premium plans to organizations.",
  },
  "Revoke Premium": {
    friendlyName: "Revoke Premium",
    description: "Allows the user to revoke premium subscriptions.",
  },
  "Extend Premium": {
    friendlyName: "Extend Premium",
    description: "Allows the user to extend the duration of premium subscriptions.",
  },
  "Change Premium Plan": {
    friendlyName: "Change Premium Plan",
    description: "Allows the user to change the plan tier on premium subscriptions.",
  },
  "View Premium History": {
    friendlyName: "View Premium History",
    description: "Allows the user to view the full history of premium changes.",
  },
  "Manage Premium Requests": {
    friendlyName: "Manage Premium Requests",
    description: "Allows the user to view and manage premium upgrade requests.",
  },
  "Bulk Grant Premium": {
    friendlyName: "Bulk Grant Premium",
    description: "Allows the user to grant premium to multiple organizations at once.",
  },
  "Convert to Lifetime": {
    friendlyName: "Convert to Lifetime",
    description: "Allows the user to convert active subscriptions to lifetime status.",
  },
  "Downgrade Premium": {
    friendlyName: "Downgrade Premium",
    description: "Allows the user to downgrade premium plan tiers.",
  },
  "Convert to Custom": {
    friendlyName: "Convert to Custom",
    description: "Allows the user to convert subscriptions to custom duration plans.",
  },
  "View Coin Balances": {
    friendlyName: "View Coin Balances",
    description: "Allows the user to view coin balances across all wallets.",
  },
  "Add Coins": {
    friendlyName: "Add Coins",
    description: "Allows the user to add coins to user wallets.",
  },
  "Remove Coins": {
    friendlyName: "Remove Coins",
    description: "Allows the user to remove coins from user wallets.",
  },
  "Refund Coins": {
    friendlyName: "Refund Coins",
    description: "Allows the user to issue coin refunds.",
  },
  "View Coin History": {
    friendlyName: "View Coin History",
    description: "Allows the user to view the full transaction history for coins.",
  },
  "Bulk Add Coins": {
    friendlyName: "Bulk Add Coins",
    description: "Allows the user to add coins to multiple wallets at once.",
  },
  "Bulk Remove Coins": {
    friendlyName: "Bulk Remove Coins",
    description: "Allows the user to remove coins from multiple wallets at once.",
  },
  "Set Coin Balance": {
    friendlyName: "Set Coin Balance",
    description: "Allows the user to directly set the coin balance for a wallet.",
  },
  "Set Infinite Coins": {
    friendlyName: "Set Infinite Coins",
    description: "Allows the user to grant an unlimited coin balance to a wallet.",
  },
  "Remove Infinite Coins": {
    friendlyName: "Remove Infinite Coins",
    description: "Allows the user to remove the infinite coin flag from a wallet.",
  },
  "Grant Coins": {
    friendlyName: "Grant Coins",
    description: "Allows the user to grant coin packages to organizations.",
  },
  "View Gem Balances": {
    friendlyName: "View Gem Balances",
    description: "Allows the user to view gem balances across all wallets.",
  },
  "Grant Gems": {
    friendlyName: "Grant Gems",
    description: "Allows the user to grant gems to user wallets.",
  },
  "Revoke Gems": {
    friendlyName: "Revoke Gems",
    description: "Allows the user to revoke gems from user wallets.",
  },
  "View Gem History": {
    friendlyName: "View Gem History",
    description: "Allows the user to view the full transaction history for gems.",
  },
  "Manage Rewards": {
    friendlyName: "Manage Rewards",
    description: "Allows the user to create and manage gem reward catalog items.",
  },
  "Bulk Grant Gems": {
    friendlyName: "Bulk Grant Gems",
    description: "Allows the user to grant gems to multiple wallets at once.",
  },
  "Bulk Revoke Gems": {
    friendlyName: "Bulk Revoke Gems",
    description: "Allows the user to revoke gems from multiple wallets at once.",
  },
  "Set Gem Balance": {
    friendlyName: "Set Gem Balance",
    description: "Allows the user to directly set the gem balance for a wallet.",
  },
  "Set Infinite Gems": {
    friendlyName: "Set Infinite Gems",
    description: "Allows the user to grant an unlimited gem balance to a wallet.",
  },
  "Remove Infinite Gems": {
    friendlyName: "Remove Infinite Gems",
    description: "Allows the user to remove the infinite gem flag from a wallet.",
  },
  "View Offers": {
    friendlyName: "View Offers",
    description: "Allows the user to view all offers and promotions.",
  },
  "Create Offers": {
    friendlyName: "Create Offers",
    description: "Allows the user to create new offers and promotional campaigns.",
  },
  "Edit Offers": {
    friendlyName: "Edit Offers",
    description: "Allows the user to modify existing offers and promotions.",
  },
  "Delete Offers": {
    friendlyName: "Delete Offers",
    description: "Allows the user to delete offers from the platform.",
  },
  "Manage Promo Codes": {
    friendlyName: "Manage Promo Codes",
    description: "Allows the user to create and manage promotional codes.",
  },
  "View Redemption Analytics": {
    friendlyName: "View Redemption Analytics",
    description: "Allows the user to view analytics on offer and promo code redemptions.",
  },
  "View Invoices": {
    friendlyName: "View Invoices",
    description: "Allows the user to view all invoices in the system.",
  },
  "Create Invoices": {
    friendlyName: "Create Invoices",
    description: "Allows the user to generate new invoices.",
  },
  "Edit Invoices": {
    friendlyName: "Edit Invoices",
    description: "Allows the user to modify existing invoices.",
  },
  "Delete Invoices": {
    friendlyName: "Delete Invoices",
    description: "Allows the user to delete invoices from the system.",
  },
  "Share Invoices": {
    friendlyName: "Share Invoices",
    description: "Allows the user to share invoices with external stakeholders.",
  },
  "View Invoice Analytics": {
    friendlyName: "View Invoice Analytics",
    description: "Allows the user to view analytics and insights on invoices.",
  },
  "View Revenue": {
    friendlyName: "View Revenue",
    description: "Allows the user to view platform revenue data.",
  },
  "Manage Billing": {
    friendlyName: "Manage Billing",
    description: "Allows the user to manage billing configurations and settings.",
  },
  "Compliance Reporting": {
    friendlyName: "Compliance Reporting",
    description: "Allows the user to generate and view compliance reports.",
  },
  "View Analytics": {
    friendlyName: "View Analytics",
    description: "Allows the user to view platform analytics dashboards.",
  },
  "Export Analytics Data": {
    friendlyName: "Export Analytics Data",
    description: "Allows the user to export analytics data to external formats.",
  },
  "View Reports": {
    friendlyName: "View Reports",
    description: "Allows the user to view generated reports.",
  },
  "Create Reports": {
    friendlyName: "Create Reports",
    description: "Allows the user to create custom reports.",
  },
  "Schedule Reports": {
    friendlyName: "Schedule Reports",
    description: "Allows the user to schedule automated report generation.",
  },
  "Export Reports": {
    friendlyName: "Export Reports",
    description: "Allows the user to export reports to external formats.",
  },
  "View Broadcasts": {
    friendlyName: "View Broadcasts",
    description: "Allows the user to view all broadcast messages.",
  },
  "Create Broadcasts": {
    friendlyName: "Create Broadcasts",
    description: "Allows the user to create new broadcast messages.",
  },
  "Send Broadcasts": {
    friendlyName: "Send Broadcasts",
    description: "Allows the user to send broadcast messages to target audiences.",
  },
  "Delete Broadcasts": {
    friendlyName: "Delete Broadcasts",
    description: "Allows the user to delete broadcast messages.",
  },
  "View Content": {
    friendlyName: "View Content",
    description: "Allows the user to view platform content.",
  },
  "Moderate Content": {
    friendlyName: "Moderate Content",
    description: "Allows the user to review and moderate platform content.",
  },
  "Delete Content": {
    friendlyName: "Delete Content",
    description: "Allows the user to remove content from the platform.",
  },
  "View Tickets": {
    friendlyName: "View Tickets",
    description: "Allows the user to view support tickets.",
  },
  "Manage Tickets": {
    friendlyName: "Manage Tickets",
    description: "Allows the user to manage and update support tickets.",
  },
  "Resolve Tickets": {
    friendlyName: "Resolve Tickets",
    description: "Allows the user to resolve and close support tickets.",
  },
  "Access Settings": {
    friendlyName: "Access Settings",
    description: "Allows the user to access the settings pages.",
  },
  "Edit System Settings": {
    friendlyName: "Edit System Settings",
    description: "Allows the user to modify system-wide configuration settings.",
  },
  "Manage Notifications": {
    friendlyName: "Manage Notifications",
    description: "Allows the user to manage notification preferences and templates.",
  },
  "View System Health": {
    friendlyName: "View System Health",
    description: "Allows the user to view system health and performance metrics.",
  },
  "Manage System Health": {
    friendlyName: "Manage System Health",
    description: "Allows the user to manage system health monitoring and alerts.",
  },
  "coins.add": {
    friendlyName: "Add Coins (API)",
    description: "Internal API permission for adding coins to wallets.",
  },
  "coins.remove": {
    friendlyName: "Remove Coins (API)",
    description: "Internal API permission for removing coins from wallets.",
  },
  "coins.refund": {
    friendlyName: "Refund Coins (API)",
    description: "Internal API permission for issuing coin refunds.",
  },
  "coins.bulk-add": {
    friendlyName: "Bulk Add Coins (API)",
    description: "Internal API permission for adding coins to multiple wallets.",
  },
  "coins.bulk-remove": {
    friendlyName: "Bulk Remove Coins (API)",
    description: "Internal API permission for removing coins from multiple wallets.",
  },
  "coins.set": {
    friendlyName: "Set Coin Balance (API)",
    description: "Internal API permission for directly setting coin balances.",
  },
  "coins.set-infinite": {
    friendlyName: "Set Infinite Coins (API)",
    description: "Internal API permission for granting unlimited coins.",
  },
  "coins.remove-infinite": {
    friendlyName: "Remove Infinite Coins (API)",
    description: "Internal API permission for removing infinite coin status.",
  },
  "coins.grant": {
    friendlyName: "Grant Coins (API)",
    description: "Internal API permission for granting coin packages.",
  },
  "gems.grant": {
    friendlyName: "Grant Gems (API)",
    description: "Internal API permission for granting gems to wallets.",
  },
  "gems.revoke": {
    friendlyName: "Revoke Gems (API)",
    description: "Internal API permission for revoking gems from wallets.",
  },
  "gems.bulk-grant": {
    friendlyName: "Bulk Grant Gems (API)",
    description: "Internal API permission for granting gems to multiple wallets.",
  },
  "gems.bulk-revoke": {
    friendlyName: "Bulk Revoke Gems (API)",
    description: "Internal API permission for revoking gems from multiple wallets.",
  },
  "gems.set": {
    friendlyName: "Set Gem Balance (API)",
    description: "Internal API permission for directly setting gem balances.",
  },
  "gems.set-infinite": {
    friendlyName: "Set Infinite Gems (API)",
    description: "Internal API permission for granting unlimited gems.",
  },
  "gems.remove-infinite": {
    friendlyName: "Remove Infinite Gems (API)",
    description: "Internal API permission for removing infinite gem status.",
  },
  "premium.grant": {
    friendlyName: "Grant Premium (API)",
    description: "Internal API permission for granting premium subscriptions.",
  },
  "premium.revoke": {
    friendlyName: "Revoke Premium (API)",
    description: "Internal API permission for revoking premium subscriptions.",
  },
  "premium.extend": {
    friendlyName: "Extend Premium (API)",
    description: "Internal API permission for extending premium duration.",
  },
  "premium.change-plan": {
    friendlyName: "Change Premium Plan (API)",
    description: "Internal API permission for changing premium plan tiers.",
  },
  "premium.bulk-grant": {
    friendlyName: "Bulk Grant Premium (API)",
    description: "Internal API permission for granting premium to multiple licenses.",
  },
  "premium.convert-lifetime": {
    friendlyName: "Convert to Lifetime (API)",
    description: "Internal API permission for converting subscriptions to lifetime.",
  },
  "premium.downgrade": {
    friendlyName: "Downgrade Premium (API)",
    description: "Internal API permission for downgrading premium plan tiers.",
  },
  "premium.convert-custom": {
    friendlyName: "Convert to Custom (API)",
    description: "Internal API permission for converting to custom duration plans.",
  },
  "premium.requests.view": {
    friendlyName: "View Premium Requests (API)",
    description: "Internal API permission for viewing premium upgrade requests.",
  },
  "premium.requests.approve": {
    friendlyName: "Approve Premium Requests (API)",
    description: "Internal API permission for approving premium upgrade requests.",
  },
  "premium.requests.reject": {
    friendlyName: "Reject Premium Requests (API)",
    description: "Internal API permission for rejecting premium upgrade requests.",
  },
  "premium.requests.convert": {
    friendlyName: "Convert Premium Requests (API)",
    description: "Internal API permission for converting premium requests to subscriptions.",
  },
  "page:dashboard": {
    friendlyName: "Dashboard Page",
    description: "Grants access to the main dashboard page.",
  },
  "page:plan-overview": {
    friendlyName: "Plan Overview Page",
    description: "Grants access to the plan overview page.",
  },
  "page:system-health": {
    friendlyName: "System Health Page",
    description: "Grants access to the system health monitoring page.",
  },
};
