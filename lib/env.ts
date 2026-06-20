export type AppEnvironment = "development" | "staging" | "production";

export function getAppEnvironment(): AppEnvironment {
  const env = (process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
  if (env === "staging") return "staging";
  if (env === "production") return "production";
  return "development";
}
