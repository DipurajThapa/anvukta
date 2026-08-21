import "server-only";

import {
  capabilities,
  challenge,
  engagementModel,
  engagements,
  finalCta,
  outcomes,
  proposition,
  sectors,
  symptoms,
} from "@/content/home";
import { prisma } from "@/lib/db";
import { site } from "@/lib/site";

/**
 * The chat's knowledge base.
 *
 * Every answer the chat gives is a passage that already exists somewhere on this
 * site, retrieved and shown verbatim with a link to where it lives. Nothing is
 * generated, paraphrased or summarised, so the chat cannot invent a service we
 * do not offer, a price we have not agreed, or a claim we cannot support.
 *
 * When retrieval finds nothing good enough, the chat says so and offers a
 * person. That is the whole design.
 */

export type Passage = {
  id: string;
  /** What a reader would call this. Shown above the answer. */
  topic: string;
  text: string;
  href: string;
  /** Extra words that should match this passage but are not in its text. */
  keywords: string[];
};

const STOP = new Set(
  ("a an and are as at be but by can could do does for from has have how i if in into is it its" +
    " me my of on or our so that the their them there these they this to us was we were what when" +
    " where which who why will with would you your")
    .split(" "),
);

export function tokenise(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^-+|-+$/g, ""))
    .filter((word) => word.length > 2 && !STOP.has(word));
}

/** Built once per request from the same content the pages render. */
export async function buildCorpus(): Promise<Passage[]> {
  const passages: Passage[] = [];

  passages.push({
    id: "what-we-do",
    topic: "What Anvukta does",
    text: `${proposition.heading} ${proposition.lead}`,
    href: "/proposition",
    keywords: [
      "who are you",
      "what do you do",
      "about",
      "services",
      "service",
      "offer",
      "provide",
      "help",
      "consulting",
      "consultancy",
      "advisory",
      "support",
      "company",
      "overview",
    ],
  });

  for (const principle of proposition.principles) {
    passages.push({
      id: `principle-${principle.title}`,
      topic: principle.title,
      text: principle.description,
      href: "/proposition",
      keywords: ["how you work", "principles", "approach", "juniors", "seniority"],
    });
  }

  passages.push({
    id: "the-constraint",
    topic: "Why programmes stall",
    text: `${challenge.heading} ${challenge.lead} ${challenge.close}`,
    href: "/proposition",
    keywords: ["stalled", "stuck", "failing", "problem", "why", "delayed", "behind"],
  });

  for (const link of challenge.links) {
    passages.push({
      id: `link-${link.name}`,
      topic: link.name,
      text: link.description,
      href: "/proposition",
      keywords: ["constraint", "gap", "breaks", link.name.toLowerCase()],
    });
  }

  passages.push({
    id: "symptoms",
    topic: "What we hear from leadership teams",
    text: `${symptoms.lead} ${symptoms.items.join(" ")}`,
    href: "/proposition",
    keywords: ["symptoms", "sounds familiar", "common problems", "visibility", "reporting"],
  });

  for (const item of outcomes.items) {
    passages.push({
      id: `outcome-${item.name}`,
      topic: `Outcome: ${item.name}`,
      text: `${item.description} ${outcomes.note}`,
      href: "/proposition",
      keywords: ["outcome", "results", "roi", "value", "benefit", item.name.toLowerCase()],
    });
  }

  for (const pillar of capabilities.pillars) {
    passages.push({
      id: `pillar-${pillar.id}`,
      topic: pillar.name,
      text: pillar.summary,
      href: `/proposition#${pillar.id}`,
      keywords: [
        "capability",
        "capabilities",
        "services",
        "service",
        "offer",
        "provide",
        "help",
        "consulting",
        "what can you do",
      ],
    });

    for (const capability of pillar.capabilities) {
      passages.push({
        id: `capability-${capability.id}`,
        topic: capability.name,
        text: `${capability.problem} ${capability.intervention} ${capability.value}`,
        href: `/proposition#${pillar.id}`,
        keywords: [
          "service",
          "capability",
          "help with",
          "do you do",
          capability.decisionMaker.toLowerCase(),
        ],
      });
    }
  }

  for (const [index, stage] of engagementModel.stages.entries()) {
    passages.push({
      id: `stage-${stage.name}`,
      topic: `Stage ${index + 1}: ${stage.name}`,
      text: `${stage.purpose} Principal output: ${stage.output}. Decision gate: ${stage.gate}`,
      href: "/#how-we-work",
      keywords: ["process", "stages", "how long", "engagement model", "method", "gate"],
    });
  }

  passages.push({
    id: "gates",
    topic: "You can stop at any stage",
    text: engagementModel.gateNote,
    href: "/#how-we-work",
    keywords: ["stop", "cancel", "commitment", "lock in", "contract", "exit"],
  });

  for (const engagement of engagements.items) {
    passages.push({
      id: `engagement-${engagement.id}`,
      topic: engagement.name,
      text: `For ${engagement.buyer}. ${engagement.problem} Typical scope: ${engagement.scope} You get: ${engagement.outcome} Decision point: ${engagement.decision}`,
      href: "/#ways-to-engage",
      keywords: ["engage", "start", "how do we begin", "options", "retainer", "fractional"],
    });
  }

  passages.push({
    id: "pricing",
    topic: "How we price",
    text: engagements.note,
    href: "/#ways-to-engage",
    keywords: ["price", "pricing", "cost", "fees", "rate", "budget", "how much", "quote"],
  });

  passages.push({
    id: "sectors",
    topic: "Sectors we have worked in",
    text: `${sectors.items.map((sector) => sector.name).join(", ")}. ${sectors.note}`,
    href: "/proposition#experience",
    keywords: ["industry", "industries", "sector", "experience", "worked with"],
  });

  passages.push({
    id: "discovery",
    topic: "The 60 minute conversation",
    text: `${finalCta.lead} ${finalCta.purpose.join(" ")} ${finalCta.close}`,
    href: "/contact",
    keywords: ["call", "meeting", "consultation", "discovery", "talk", "book", "appointment"],
  });

  passages.push({
    id: "contact",
    topic: "How to reach us",
    text: `Email ${site.contact.email}, WhatsApp ${site.contact.whatsappDisplay}, or send a brief through the contact page. A person reads every enquiry and replies within two working days.`,
    href: "/contact",
    keywords: ["contact", "email", "whatsapp", "phone", "reach", "get in touch", "speak"],
  });

  passages.push({
    id: "privacy",
    topic: "What we do with your data",
    text: "We collect what you send us here or on the contact form, and we use it to reply. No analytics, no advertising, no mailing list, and nothing goes to another company. Two cookies keep the site working and stop abuse, and neither follows you elsewhere. You can ask us to delete anything we hold at any time and we will do it within 30 days.",
    href: "/privacy",
    keywords: ["privacy", "data", "gdpr", "delete", "personal information", "cookies", "retention", "how long"],
  });

  const posts = await prisma.post.findMany({
    where: { status: "published", publishedAt: { not: null, lte: new Date() } },
    select: { slug: true, title: true, excerpt: true, category: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });

  for (const post of posts) {
    passages.push({
      id: `post-${post.slug}`,
      topic: post.title,
      text: post.excerpt,
      href: `/blog/${post.slug}`,
      keywords: ["article", "insight", "read", "writing", post.category?.name.toLowerCase() ?? ""],
    });
  }

  return passages;
}
