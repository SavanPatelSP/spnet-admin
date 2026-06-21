import type { AppEnvironment } from "./env";

export function getPublicAppEnvironment(): AppEnvironment {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") return "production";
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") return "staging";
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") return "production";
  if (process.env.NEXT_PUBLIC_APP_ENV === "staging") return "staging";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}
