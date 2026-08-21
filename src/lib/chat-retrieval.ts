import "server-only";

import { buildCorpus, tokenise, type Passage } from "@/lib/chat-knowledge";

/**
 * Retrieval, and only retrieval.
 *
 * Scoring is BM25-style term weighting over the site's own passages, with a
 * bonus for exact phrases and for words that appear in a passage's topic. There
 * is no language model anywhere in this path, so the chat can only ever repeat
 * something a person has already written and approved.
 *
 * Below the confidence floor it returns nothing, and the caller offers a human.
 */

const K1 = 1.4;
const B = 0.72;

/** Below this, we say we do not know rather than guess. */
const CONFIDENCE_FLOOR = 1.6;

/**
 * A passage must also share at least this many distinct words with the question.
 * Score alone is not enough: "do you sell home insurance" scores well against the
 * sectors list purely because that list happens to contain the word "insurance",
 * and answering it would imply we sell insurance. Requiring real overlap makes
 * the chat say "I do not know" instead, which is the honest answer.
 */
const MIN_TERM_OVERLAP = 2;

export type Answer = {
  topic: string;
  text: string;
  href: string;
  score: number;
};

export type RetrievalResult = {
  answers: Answer[];
  /** True when nothing cleared the floor, so the caller offers a person. */
  needsHuman: boolean;
};

type Indexed = Passage & { tokens: string[]; length: number };

let cache: { built: number; docs: Indexed[]; df: Map<string, number>; avg: number } | null = null;
const CACHE_MS = 60_000;

async function index() {
  if (cache && Date.now() - cache.built < CACHE_MS) return cache;

  const corpus = await buildCorpus();
  const docs: Indexed[] = corpus.map((passage) => {
    const tokens = tokenise(`${passage.topic} ${passage.text} ${passage.keywords.join(" ")}`);
    return { ...passage, tokens, length: tokens.length };
  });

  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(doc.tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const avg = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, docs.length);
  cache = { built: Date.now(), docs, df, avg };
  return cache;
}

export async function retrieve(question: string, limit = 2): Promise<RetrievalResult> {
  const query = tokenise(question);
  if (query.length === 0) return { answers: [], needsHuman: true };

  const { docs, df, avg } = await index();
  const total = docs.length;
  const phrase = question.toLowerCase().trim();

  const scored = docs.map((doc) => {
    let score = 0;

    for (const term of new Set(query)) {
      const frequency = doc.tokens.filter((t) => t === term).length;
      if (frequency === 0) continue;

      const documentFrequency = df.get(term) ?? 1;
      const idf = Math.log(1 + (total - documentFrequency + 0.5) / (documentFrequency + 0.5));
      const norm = frequency * (K1 + 1);
      const denom = frequency + K1 * (1 - B + (B * doc.length) / avg);
      score += idf * (norm / denom);
    }

    // A word in the topic line is worth more than the same word buried in prose.
    const topicTokens = new Set(tokenise(doc.topic));
    for (const term of new Set(query)) {
      if (topicTokens.has(term)) score += 0.8;
    }

    // A literal phrase match is the strongest signal we have.
    if (phrase.length > 8 && doc.text.toLowerCase().includes(phrase)) score += 3;
    if (phrase.length > 6 && doc.topic.toLowerCase().includes(phrase)) score += 3;

    const overlap = new Set(query.filter((term) => doc.tokens.includes(term))).size;

    return { doc, score, overlap };
  });

  const required = Math.min(MIN_TERM_OVERLAP, new Set(query).size);

  const best = scored
    .filter((entry) => entry.score >= CONFIDENCE_FLOOR && entry.overlap >= required)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    answers: best.map(({ doc, score }) => ({
      topic: doc.topic,
      text: doc.text,
      href: doc.href,
      score: Math.round(score * 100) / 100,
    })),
    needsHuman: best.length === 0,
  };
}

/** Opening prompts, so a first-time visitor is not staring at an empty box. */
export const SUGGESTED_QUESTIONS = [
  "What do you actually do?",
  "How much does a diagnostic cost?",
  "Our AI pilot is stuck. Can you help?",
  "How do your engagements work?",
  "Which industries have you worked in?",
] as const;
