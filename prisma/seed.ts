import fs from "node:fs";
import path from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

import { PrismaClient } from "../src/generated/prisma/client";

const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220));
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

/* -------------------------------------------------------------------------- */
/* Seed content                                                                */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  {
    name: "AI Transformation",
    description:
      "Moving AI from pilot to production, with governance and economics that hold up.",
  },
  {
    name: "Transformation Strategy",
    description:
      "Turning executive intent into a sequenced, owned and funded plan.",
  },
  {
    name: "Programme Governance",
    description:
      "Recovering stalled programmes and keeping delivery honest against evidence.",
  },
];

/**
 * Three seeded articles, drafted only from themes the source material supports.
 * They contain no invented statistics, clients or case studies, and they ship
 * as drafts. Nothing goes live until a person reviews and publishes it.
 */
const POSTS = [
  {
    title: "Why AI Pilots Stall Before Production",
    heroImage: "/media/insights/ai-pilots.jpg",
    heroImageAlt: "A curved glass roof seen from below, its ribs running away to a vanishing point.",
    category: "AI Transformation",
    tags: ["AI adoption", "Operating model", "Governance"],
    excerpt:
      "Most AI pilots do not fail because the model was poor. They stall because nothing around the model was built to carry it. Ownership, workflow, cost and governance were all left for later.",
    seoTitle: "Why AI Pilots Stall Before Production",
    seoDescription:
      "AI pilots rarely stall on model quality. They stall on ownership, workflow design, unit economics and governance. What to fix, and in what order.",
    content: `A pilot proves that something *can* work. Production proves that an organisation can run it every day, at cost, under scrutiny, without the original team standing over it. Those are different problems, and the second one is where most AI initiatives quietly stop.

## The pilot answered the wrong question

Pilots are usually scoped to answer a technical question: can the model do the task well enough? That question is worth answering, and it is rarely the binding constraint.

The questions that decide whether a pilot survives are organisational:

- Who owns the workflow once it is automated, and what happens when it is wrong?
- What is the cost per case at real volume, not at demo volume?
- Which existing process is being replaced, and who currently gets paid to do it?
- What would tell leadership it is working, or that it has quietly drifted?

None of these are model questions. All of them are operating-model questions.

## Four places pilots stall

### 1. No owner on the business side

An AI pilot sponsored only by technology has no home when it works. Someone in the business has to own the outcome, accept the exceptions, and defend the change to their own team. Without that, the pilot ends when the sponsor's attention moves.

### 2. The workflow was never redesigned

Adding a model to an unchanged process usually adds a step rather than removing one. Your people now check the model *and* do the task. Cost goes up, not down. The gain only arrives when you redesign the work around what the model actually changes, including what happens when it gets one wrong.

> Automation that leaves the old process intact is a cost, not a saving.

### 3. The economics were never established

Demo volumes hide the cost curve. Before production, the cost per case has to be known and defensible at the volume you actually expect. If nobody can state that number, the finance conversation will end the initiative later rather than sooner.

### 4. Governance arrived after the fact

Decisions about data handling, human review, error tolerance and audit are far cheaper to design in than to retrofit. When they arrive as a late compliance review, they usually arrive as a stop.

## What to do instead

<div class="callout"><span class="callout__label">Practical sequence</span>Prove the operating model before you scale the technology.</div>

1. **Pick a workflow, not a use case.** Scope the pilot around an end-to-end process with a named business owner.
2. **Design the exception path first.** What happens when the model is wrong is the part people will judge.
3. **Establish unit economics early.** Cost per case at expected volume, measured, not assumed.
4. **Set the governance line before build.** Data handling, human review points, and the evidence that will be reported.
5. **Agree the stop condition.** Decide in advance what result would mean "do not scale this". A pilot that cannot fail is not a pilot.

## The pattern underneath

This is the same failure the [five links between intent and execution](/proposition) describe. The model is the *systems* link. When strategy, people, governance and adoption are not moved with it, the technology works and the change does not.

If your AI work keeps producing demonstrations instead of capability, the constraint is usually one link away from the model. Finding which one is the whole point of a diagnostic, and [a short conversation](/contact) is normally enough to locate it.`,
  },
  {
    title: "Closing the Gap Between Transformation Strategy and Execution",
    heroImage: "/media/insights/strategy-execution.jpg",
    heroImageAlt: "A working port at dusk, cranes lined up along the quay.",
    category: "Transformation Strategy",
    tags: ["Transformation", "Operating model", "Execution"],
    excerpt:
      "Transformations rarely fail at the strategy stage. They fail in the translation, where the ambition should have become a sequenced plan with owners and funding, and never did.",
    seoTitle: "Closing the Gap Between Strategy and Execution",
    seoDescription:
      "Transformation strategies rarely fail on ambition. They fail in translation. How to turn intent into a sequenced, owned and funded plan that survives contact with delivery.",
    content: `Most leadership teams can tell you where the business needs to be in three years. Far fewer can list, in order, the first six decisions that get them there, who owns each one, what it costs, and what would tell them it is working.

That distance between a clear destination and an owned sequence is where transformations are lost.

## The translation problem

A strategy document is a statement of intent. A plan is a statement of commitment. The difference is uncomfortable, which is why the translation step is so often skipped:

- Intent can stay abstract. A plan has to name owners.
- Intent can include everything. A plan has to sequence, which means saying "not yet".
- Intent does not have a budget. A plan does.
- Intent cannot be wrong. A plan can be measured.

Organisations that skip translation do not notice immediately. Activity starts, teams are busy, and reporting looks healthy for two or three quarters. The gap shows up later, as a portfolio of initiatives that are all in progress and none finished.

## Four symptoms of an untranslated strategy

### Everything is a priority

If the initiative list has no order written down, the order is being set somewhere else. Usually by whoever escalates best. That is not a strategy, it is a queue.

### Ownership is at the wrong altitude

A programme "owned by the executive committee" is owned by nobody. Ownership has to sit with a person who can make the trade-offs the work requires, and who is accountable for the outcome rather than the activity.

### The measures are activity measures

Milestones delivered, workshops run, systems deployed. These say work happened. They do not say value moved. Every initiative needs at least one measure that would embarrass someone if it failed to move.

### There is no stop condition

Initiatives that cannot be stopped absorb capacity indefinitely. A plan without stop conditions is not gated; it is open-ended, and open-ended work always crowds out new work.

## Making the translation

<div class="callout"><span class="callout__label">The translation test</span>Can each initiative name its owner, its sequence position, its cost, its success measure, and the condition under which it stops?</div>

1. **Diagnose the constraint, not the wish list.** Assess strategy, systems, people, governance and adoption against the target outcome, and find where value is actually stalling.
2. **Rank by value, risk and feasibility.** Not by who asked loudest. The output is an agreed sequence, not a longer list.
3. **Design to a measure.** Define the target operating model and the KPIs together, so the design is testable.
4. **Mobilise with governance attached.** Delivery teams and a governance cadence tied to those KPIs start at the same time, not months apart.
5. **Measure against a baseline and hand over.** If nobody recorded the starting position, no result can be claimed at the end.

That sequence is gated on purpose. After the first stage the honest options are stop, adapt or proceed, and [not every diagnostic should become a programme](/#how-we-work).

## Where this usually lands

The organisations that close this gap are rarely the ones with the best strategy documents. They are the ones willing to make the plan specific enough to be wrong, and to check it against evidence often enough to correct it early.

If your transformation has momentum but no clear line from ambition to sequence, that is a translation problem, and it is fixable. [A discovery conversation](/contact) is usually enough to establish whether it is the binding constraint.`,
  },
  {
    title: "What Effective Programme Recovery Governance Looks Like",
    heroImage: "/media/insights/programme-recovery.jpg",
    heroImageAlt: "A tower facade photographed from the ground, its frame rising in hard diagonals.",
    category: "Programme Governance",
    tags: ["Programme recovery", "Governance", "Delivery"],
    excerpt:
      "A stalled programme rarely needs more reporting. It needs governance that surfaces the real position, restores decision-making, and earns back sponsor confidence in that order.",
    seoTitle: "What Effective Programme Recovery Governance Looks Like",
    seoDescription:
      "Recovering a stalled programme starts with an honest position, not more reporting. The governance that restores decision-making and sponsor confidence.",
    content: `By the time a programme is described as "stalled", two things are usually true: the reported status and the real status have separated, and the sponsor has stopped believing the reporting. Recovery has to fix the second problem by fixing the first.

## Recovery is not more reporting

When confidence drops, the instinct is to ask for more detail. More frequent updates, finer status reporting, another forum. This almost always makes things worse. It consumes the delivery team's remaining capacity, and it produces more of the artefact that already lost credibility.

Effective recovery does something different. It re-establishes what is actually true, then rebuilds the decision-making around it.

## The first move: an honest position

Before any replanning, the programme needs a position statement that people believe. In practice this means:

- **Scope as it stands**, not as originally approved.
- **What is genuinely done**, tested against a definition of done that someone outside the team would accept.
- **The real dependencies**, including the ones outside the programme's control.
- **The open risks that are already issues**, named as issues.

This is uncomfortable, and it is the whole point. A recovery plan built on the previous reporting inherits the previous problem.

> Recovery starts when the reported position and the real position are the same document.

## The second move: restore decision-making

Stalled programmes are usually decision-starved rather than resource-starved. Common patterns:

### No forum owns the trade-off

Cross-functional decisions get raised in three forums and settled in none. Recovery needs one body with the authority to decide scope, sequence and pace, and the attendance to make that authority real.

### Decisions are made without evidence

If the forum cannot see delivery data, it will decide on advocacy. The measurement layer usually has to be rebuilt before governance can function.

### Nothing is ever stopped

A recovery that only adds is not a recovery. Descoping is the fastest lever available, and it needs an owner willing to use it.

## The third move: govern to a plan that can fail

<div class="callout"><span class="callout__label">Gate discipline</span>Each stage ends with an explicit decision: stop, adapt, or proceed.</div>

A credible recovery plan has:

1. **A fixed near-term horizon.** Weeks, not quarters. Long-horizon recovery plans cannot be falsified quickly enough to rebuild trust.
2. **Named owners per workstream**, with the authority to match.
3. **Outcome measures, not activity measures.** Deployment frequency, defect rate, cycle time, whatever actually reflects the value at stake.
4. **A published decision gate.** At the end of the horizon: continue, adjust, or stop, decided against the evidence.
5. **A handover intent from day one.** Recovery that depends permanently on the people who ran it has not finished.

## Rebuilding confidence

Sponsor confidence does not come back because the status turned green. It comes back because a few commitments were made in the open, met on time, and reported honestly, including the ones that were missed. Two or three cycles of that is usually enough.

This is the same discipline described in [how we work](/#how-we-work): evidence, an explicit gate, and a decision that includes the option to stop.

If a committed programme in your organisation has lost its reporting credibility, the fastest useful step is establishing the honest position. [That is often a single conversation away.](/contact)`,
  },
];

/* -------------------------------------------------------------------------- */

async function main() {
  console.info("Seeding Anvukta Consulting Service database…");

  /* ---- Admin user -------------------------------------------------------- */
  const email = (process.env.ADMIN_EMAIL ?? "admin@anvukta.example").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe!Admin2026";
  // Shown publicly as the byline on every article, so it reads as the firm
  // rather than as a login. Inventing a person would break the content rules.
  const name = process.env.ADMIN_NAME ?? "Anvukta Consulting Service";

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: "admin" },
    // Existing password is left alone so re-seeding never resets a real account.
    update: { name },
    select: { id: true, email: true },
  });

  console.info(`  admin user: ${admin.email}`);

  /* ---- Categories -------------------------------------------------------- */
  const categoryIds = new Map<string, string>();

  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: slugify(category.name) },
      create: {
        name: category.name,
        slug: slugify(category.name),
        description: category.description,
      },
      update: { description: category.description },
      select: { id: true },
    });
    categoryIds.set(category.name, record.id);
  }

  console.info(`  categories: ${CATEGORIES.length}`);

  /* ---- Posts (drafts) ---------------------------------------------------- */
  for (const post of POSTS) {
    const slug = slugify(post.title);

    const tagLinks = [];
    for (const tagName of post.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: slugify(tagName) },
        create: { name: tagName, slug: slugify(tagName) },
        update: {},
        select: { id: true },
      });
      tagLinks.push({ tagId: tag.id });
    }

    const data = {
      title: post.title,
      slug,
      excerpt: post.excerpt,
      content: post.content,
      // Seeded as drafts: nothing goes public until a human publishes it.
      status: "draft",
      publishedAt: null,
      readingMinutes: readingMinutes(post.content),
      heroImage: post.heroImage,
      heroImageAlt: post.heroImageAlt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      categoryId: categoryIds.get(post.category) ?? null,
      authorId: admin.id,
    };

    await prisma.post.upsert({
      where: { slug },
      create: { ...data, tags: { create: tagLinks } },
      update: { ...data, tags: { deleteMany: {}, create: tagLinks } },
    });
  }

  console.info(`  articles: ${POSTS.length} (all drafts)`);
  console.info("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
