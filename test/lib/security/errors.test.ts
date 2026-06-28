import { describe, it, expect, afterEach } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  getSafeErrorMessage,
} from "@/lib/security/errors";

describe("AppError", () => {
  it("creates with defaults", () => {
    const err = new AppError("test");
    expect(err.message).toBe("test");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBeUndefined();
  });

  it("creates with status and code", () => {
    const err = new AppError("not found", 404, "NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });
});

describe("ValidationError", () => {
  it("has correct defaults", () => {
    const err = new ValidationError();
    expect(err.message).toBe("Validation failed");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });
});

describe("NotFoundError", () => {
  it("has correct defaults", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Resource not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });
});

describe("UnauthorizedError", () => {
  it("has correct defaults", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Authentication required");
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });
});

describe("ForbiddenError", () => {
  it("has correct defaults", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Insufficient permissions");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});

describe("getSafeErrorMessage", () => {
  const origEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
  });

  it("returns AppError message in development", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const err = new AppError("Internal db error", 500);
    expect(getSafeErrorMessage(err)).toBe("Internal db error");
  });

  it("hides 500+ error details in production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const err = new AppError("Internal db error", 500);
    expect(getSafeErrorMessage(err)).toBe("An internal error occurred");
  });

  it("exposes 4xx error details in production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const err = new ValidationError("Invalid email format");
    expect(getSafeErrorMessage(err)).toBe("Invalid email format");
  });
});
