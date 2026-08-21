import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import { isDemoMode } from "@/lib/site";

/**
 * DEMO_MODE is what stops a shared test link from being indexed. If it ever
 * stops working it fails silently, so pin both states.
 */
describe("demo mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off when the variable is unset", () => {
    vi.stubEnv("DEMO_MODE", "");
    expect(isDemoMode()).toBe(false);
  });

  it("accepts the usual ways of writing yes", () => {
    for (const value of ["true", "TRUE", " true ", "1", "yes"]) {
      vi.stubEnv("DEMO_MODE", value);
      expect(isDemoMode()).toBe(true);
    }
  });

  it("ignores anything else", () => {
    for (const value of ["false", "0", "no", "maybe"]) {
      vi.stubEnv("DEMO_MODE", value);
      expect(isDemoMode()).toBe(false);
    }
  });

  it("shuts crawlers out of everything when on", () => {
    vi.stubEnv("DEMO_MODE", "true");
    const rules = robots().rules;
    const all = Array.isArray(rules) ? rules : [rules];
    expect(all).toHaveLength(1);
    expect(all[0]?.disallow).toBe("/");
    expect(all[0]?.allow).toBeUndefined();
  });

  it("lets crawlers in, minus admin, when off", () => {
    vi.stubEnv("DEMO_MODE", "");
    const rules = robots().rules;
    const all = Array.isArray(rules) ? rules : [rules];
    expect(all[0]?.allow).toBe("/");
    expect(all[0]?.disallow).toContain("/admin");
  });
});
