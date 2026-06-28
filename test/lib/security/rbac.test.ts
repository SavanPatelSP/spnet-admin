import { describe, it, expect } from "vitest";
import { Role, roleGte, roleLt, checkRouteAccess, isValidRole } from "@/lib/security/rbac";

describe("roleGte", () => {
  it("returns true for same role", () => {
    expect(roleGte("OWNER", Role.OWNER)).toBe(true);
  });

  it("returns true for higher role", () => {
    expect(roleGte("OWNER", Role.VIEWER)).toBe(true);
  });

  it("returns false for lower role", () => {
    expect(roleGte("VIEWER", Role.ADMIN)).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(roleGte("UNKNOWN", Role.VIEWER)).toBe(false);
  });
});

describe("roleLt", () => {
  it("returns true for lower role", () => {
    expect(roleLt("VIEWER", Role.ADMIN)).toBe(true);
  });

  it("returns false for same role", () => {
    expect(roleLt("OWNER", Role.OWNER)).toBe(false);
  });
});

describe("checkRouteAccess", () => {
  it("denies access for no role", () => {
    const result = checkRouteAccess(null, "/owner");
    expect(result.allowed).toBe(false);
  });

  it("allows owner access to owner routes", () => {
    const result = checkRouteAccess("OWNER", "/owner");
    expect(result.allowed).toBe(true);
  });

  it("denies viewer access to admin routes", () => {
    const result = checkRouteAccess("VIEWER", "/settings/roles");
    expect(result.allowed).toBe(false);
  });

  it("allows access to unlisted routes", () => {
    const result = checkRouteAccess("VIEWER", "/some-unknown-path");
    expect(result.allowed).toBe(true);
  });

  it("matches wildcard routes", () => {
    const result = checkRouteAccess("OWNER", "/owner/settings");
    expect(result.allowed).toBe(true);
  });

  it("allows support role on support routes", () => {
    const result = checkRouteAccess("SUPPORT", "/support/ticket-1");
    expect(result.allowed).toBe(true);
  });
});

describe("isValidRole", () => {
  it("validates known roles", () => {
    expect(isValidRole("OWNER")).toBe(true);
    expect(isValidRole("ADMIN")).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(isValidRole("INVALID")).toBe(false);
    expect(isValidRole(null)).toBe(false);
    expect(isValidRole(undefined)).toBe(false);
  });
});
