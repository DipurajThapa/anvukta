import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const stored = await hashPassword("Correct Horse Battery Staple 9!");
    await expect(verifyPassword("Correct Horse Battery Staple 9!", stored)).resolves.toBe(
      true,
    );
  });

  it("rejects an incorrect password", async () => {
    const stored = await hashPassword("Correct Horse Battery Staple 9!");
    await expect(verifyPassword("wrong password", stored)).resolves.toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toBe(b);
  });

  it("never stores the password in the hash string", async () => {
    const stored = await hashPassword("PlainTextSecret");
    expect(stored).not.toContain("PlainTextSecret");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    for (const stored of ["", "not-a-hash", "scrypt$abc$8$1$x$y", "bcrypt$1$2$3$4$5"]) {
      await expect(verifyPassword("anything", stored)).resolves.toBe(false);
    }
  });

  it("treats unicode-equivalent passwords as the same", async () => {
    // "é" composed vs decomposed — both normalise to NFKC before hashing.
    const stored = await hashPassword("café");
    await expect(verifyPassword("café", stored)).resolves.toBe(true);
  });
});
