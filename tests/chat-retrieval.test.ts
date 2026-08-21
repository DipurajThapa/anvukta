import { describe, expect, it } from "vitest";

import { buildCorpus } from "@/lib/chat-knowledge";
import { retrieve } from "@/lib/chat-retrieval";

/**
 * The chat must only ever repeat something already published, and must admit
 * when it does not know. These tests pin both halves of that promise.
 */

describe("chat corpus", () => {
  /**
   * Content entries that grow from a string into an object are easy to miss:
   * the corpus keeps building and only the reader sees "[object Object]".
   */
  it("never stringifies an object into an answer", async () => {
    const corpus = await buildCorpus();
    const broken = corpus.filter((passage) => passage.text.includes("[object Object]"));
    expect(broken.map((passage) => passage.id)).toEqual([]);
  });

  it("gives every passage real text and a link", async () => {
    const corpus = await buildCorpus();
    expect(corpus.length).toBeGreaterThan(0);
    for (const passage of corpus) {
      expect(passage.text.trim().length).toBeGreaterThan(0);
      expect(passage.href).toBeTruthy();
    }
  });
});

describe("chat retrieval", () => {
  it("answers a question about what the business does", async () => {
    const result = await retrieve("What do you actually do?");
    expect(result.needsHuman).toBe(false);
    expect(result.answers[0]?.href).toBeTruthy();
  });

  it("finds pricing when asked about cost", async () => {
    const result = await retrieve("how much does a diagnostic cost");
    expect(result.needsHuman).toBe(false);
    expect(result.answers.some((a) => /price|scope|understand the problem/i.test(a.text))).toBe(true);
  });

  it("finds the AI capability from a plain-language problem", async () => {
    const result = await retrieve("our AI pilot is stuck and never reached production");
    expect(result.needsHuman).toBe(false);
    expect(result.answers.some((a) => /ai/i.test(a.topic))).toBe(true);
  });

  it("finds the sectors list", async () => {
    const result = await retrieve("which industries have you worked in");
    expect(result.needsHuman).toBe(false);
    expect(result.answers.some((a) => /sector|industr/i.test(a.topic))).toBe(true);
  });

  it("finds how to get in touch", async () => {
    const result = await retrieve("how do I contact you");
    expect(result.needsHuman).toBe(false);
    expect(result.answers.some((a) => a.href === "/contact")).toBe(true);
  });

  it("every answer carries a link back to a real page", async () => {
    const result = await retrieve("how do your engagements work");
    for (const answer of result.answers) {
      expect(answer.href.startsWith("/")).toBe(true);
      expect(answer.text.length).toBeGreaterThan(20);
    }
  });

  it("admits it does not know rather than guessing", async () => {
    for (const nonsense of [
      "what is the airspeed velocity of an unladen swallow",
      "do you sell home insurance policies to families",
      "qwertyuiop asdfghjkl",
    ]) {
      const result = await retrieve(nonsense);
      expect(result.needsHuman, nonsense).toBe(true);
      expect(result.answers, nonsense).toEqual([]);
    }
  });

  it("returns nothing for an empty question", async () => {
    const result = await retrieve("   ");
    expect(result.needsHuman).toBe(true);
  });
});
