import { describe, it, expect } from "vitest";
import { authSchema, chatInputSchema } from "@/lib/schemas";

describe("authSchema", () => {
  it("accepts a valid email + password", () => {
    const result = authSchema.safeParse({ email: "user@example.com", password: "supersecret" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = authSchema.safeParse({ email: "not-an-email", password: "supersecret" });
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = authSchema.safeParse({ email: "user@example.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("chatInputSchema", () => {
  it("accepts a normal message", () => {
    const result = chatInputSchema.safeParse({ message: "Compare GPT-5 and Gemini 2.5 Pro" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    const result = chatInputSchema.safeParse({ message: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects messages longer than 10k chars", () => {
    const result = chatInputSchema.safeParse({ message: "x".repeat(10_001) });
    expect(result.success).toBe(false);
  });
});
