import { describe, it, expect } from "vitest";
import {
  emailSchema,
  paginationSchema,
  premiumGrantSchema,
  coinAdjustSchema,
  licenseSchema,
} from "@/lib/validation";

describe("emailSchema", () => {
  it("validates correct emails", () => {
    expect(emailSchema.parse("Test@Example.com")).toBe("test@example.com");
    expect(emailSchema.parse("user@domain.co")).toBe("user@domain.co");
  });

  it("rejects invalid emails", () => {
    expect(() => emailSchema.parse("not-an-email")).toThrow();
    expect(() => emailSchema.parse("")).toThrow();
  });
});

describe("paginationSchema", () => {
  it("applies defaults", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sortOrder).toBe("desc");
  });

  it("coerces string numbers", () => {
    const result = paginationSchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("rejects out of range pageSize", () => {
    expect(() => paginationSchema.parse({ pageSize: 200 })).toThrow();
  });
});

describe("premiumGrantSchema", () => {
  it("validates a valid grant", () => {
    const data = {
      teamMemberId: "tm-1",
      plan: "PRO",
      subscriptionType: "MONTHLY",
    };
    expect(premiumGrantSchema.parse(data)).toEqual(data);
  });

  it("rejects invalid subscription type", () => {
    expect(() =>
      premiumGrantSchema.parse({
        teamMemberId: "tm-1",
        plan: "PRO",
        subscriptionType: "INVALID",
      })
    ).toThrow();
  });
});

describe("coinAdjustSchema", () => {
  it("validates positive amounts", () => {
    const data = { teamMemberId: "tm-1", amount: 100 };
    expect(coinAdjustSchema.parse(data)).toEqual(data);
  });

  it("rejects zero amounts", () => {
    expect(() =>
      coinAdjustSchema.parse({ teamMemberId: "tm-1", amount: 0 })
    ).toThrow();
  });
});

describe("licenseSchema", () => {
  it("validates license data", () => {
    const data = {
      key: "LIC-001",
      plan: "ENTERPRISE",
      expiresAt: "2027-12-31T00:00:00Z",
    };
    const result = licenseSchema.parse(data);
    expect(result.key).toBe("LIC-001");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});
