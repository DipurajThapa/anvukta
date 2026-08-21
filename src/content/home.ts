/**
 * All page copy for Home and Our Proposition, in one file so it can be reviewed
 * and edited without touching components.
 *
 * House style:
 *  - Active voice. Short sentences. Words a busy reader gets on the first pass.
 *  - No em dashes. Use a full stop, a comma, or the word "and".
 *  - Speak to the reader as "you". Name the problem before naming the service.
 *  - No jargon that a CFO would have to look up.
 *
 * Content integrity rules:
 *  - No invented clients, logos, awards, certifications or partnerships.
 *  - Results our leaders achieved in earlier jobs are labelled that way, always.
 *  - Anonymised examples stay anonymised.
 *  - Outcomes are outcomes we work towards, never guarantees.
 */

export const hero = {
  eyebrow: "Business, Technology & AI",
  headline: "Strategy. Reinvention. Delivery.",
  lead: "Most transformation programmes do not fail because the strategy was wrong. They fail in the gap between the decision and the delivery. We close that gap.",
  support:
    "Senior-led advisory for leadership teams across the GCC. We work with SMEs, mid-market businesses, and the programmes your board is watching most closely.",
} as const;

export const challenge = {
  eyebrow: "The Constraint",
  heading: "The gap sits between intent and execution.",
  lead: "Five things connect a decision in the boardroom to a result in the business. Programmes rarely collapse. One of these five quietly gives way, and everything downstream slows to a halt.",
  links: [
    {
      name: "Strategy",
      description:
        "The ambition is clear. Nobody has turned it into a sequenced plan with names against it.",
    },
    {
      name: "Systems",
      description:
        "The platform gets chosen before anyone works out how the business will actually run on it.",
    },
    {
      name: "People",
      description:
        "The plan assumes skills and spare capacity your teams were never given.",
    },
    {
      name: "Governance",
      description:
        "Three forums discuss the hard trade-offs. None of them owns the decision.",
    },
    {
      name: "Adoption",
      description:
        "The new way of working goes live. People quietly keep using the old one.",
    },
  ],
  close:
    "One weak link stalls the whole programme. That is why we work across all five, not just the technology in the middle.",
} as const;

export const symptoms = {
  eyebrow: "What We Hear",
  heading: "You have probably said at least one of these.",
  lead: "These are the sentences we hear most often from leadership teams across the GCC. If any of them sound familiar, the problem is usually not effort.",
  items: [
    "We launched well. Six months on, nobody can tell me where it stands.",
    "IT and the business are pulling in different directions, and both think they are right.",
    "Our AI pilot worked. It has been eighteen months and it still is not in production.",
    "Every vendor delivers their piece and nobody owns the outcome.",
    "I find out a milestone slipped when it has already slipped.",
  ],
  note: "Not every business has all five. Almost every business has one.",
} as const;

export const proposition = {
  eyebrow: "The Proposition",
  heading:
    "We connect the decision you made to the result you were promised.",
  lead: "Senior people. Real governance. One partner who owns the outcome with you.",
  principles: [
    {
      title: "Senior from day one",
      description:
        "You get the people who have run these programmes before. Not a pitch team who hand you over to juniors once the contract is signed.",
    },
    {
      title: "Evidence, not theory",
      description:
        "Every recommendation comes from something our leaders have already delivered at scale, in earlier roles. We will tell you where it worked and where it did not.",
    },
    {
      title: "Gated, not open-ended",
      description:
        "You choose whether to carry on at every stage. No scope that grows quietly. No invoice you did not see coming.",
    },
  ],
} as const;

export const outcomes = {
  eyebrow: "Outcomes",
  heading: "Five things we work to move.",
  items: [
    {
      icon: "growth",
      name: "Growth",
      description:
        "Digital and AI work that reaches customers instead of stalling in a pilot.",
    },
    {
      icon: "speed",
      name: "Speed",
      description:
        "Less time between deciding something and having it live.",
    },
    {
      icon: "cost",
      name: "Cost & Productivity",
      description:
        "More out of the systems and people you already pay for.",
    },
    {
      icon: "people",
      name: "Customer Experience",
      description:
        "One journey that holds together across web, mobile and store.",
    },
    {
      icon: "shield",
      name: "Delivery Confidence & Control",
      description:
        "Reporting you can take to the board without checking it twice.",
    },
  ],
  note: "These are the outcomes we work towards with you. They are not guarantees, and anyone who offers you one is guessing.",
} as const;

export type Capability = {
  id: string;
  name: string;
  problem: string;
  intervention: string;
  value: string;
  decisionMaker: string;
};

export type Pillar = {
  id: string;
  name: string;
  summary: string;
  capabilities: Capability[];
};

export const capabilities = {
  eyebrow: "Capabilities",
  heading: "Three pillars. One measure of success.",
  lead: "We judge our work by one thing: whether business value actually landed. Not whether the activity happened.",
  pillars: [
    {
      id: "strategy-and-value",
      name: "Strategy & Value",
      summary:
        "Operating model advisory, digital and AI strategy, and programme governance and recovery.",
      capabilities: [
        {
          id: "operating-model-advisory",
          name: "Business Transformation & Operating-Model Advisory",
          problem:
            "You have outgrown the way the business is set up, and it shows in every hand-off.",
          intervention:
            "We reset the structure, the decision rights and the ways of working around where the business is going, not where it has been.",
          value: "A business built for the size you are becoming.",
          decisionMaker: "CEO · COO",
        },
        {
          id: "digital-ai-strategy",
          name: "Digital & AI Transformation Strategy",
          problem:
            "The board wants an AI answer. Nobody has a plan anyone can fund.",
          intervention:
            "We turn the ambition into a sequenced set of initiatives, each with an owner, a budget and a way to tell if it worked.",
          value: "A roadmap your CFO will sign and your teams can actually run.",
          decisionMaker: "CEO · CIO · CTO",
        },
        {
          id: "programme-governance",
          name: "Portfolio, Programme Governance & Recovery",
          problem:
            "A programme has stalled, and you no longer trust the status report.",
          intervention:
            "We establish what is genuinely true, rebuild the governance around it, and set out a plan you can hold people to.",
          value: "An honest position, and a credible route back to value.",
          decisionMaker: "COO · Programme Sponsor",
        },
      ],
    },
    {
      id: "technology-and-engineering",
      name: "Technology & Engineering",
      summary:
        "Product and platform engineering, cloud, AI-enabled automation, and the data your decisions rest on.",
      capabilities: [
        {
          id: "platform-engineering",
          name: "Digital Product, SaaS & Platform Engineering",
          problem:
            "You built something good for yourselves. It will not survive being sold to anyone else.",
          intervention:
            "We take it from internal tooling to a product other businesses can rely on, with unit economics that hold up.",
          value: "A platform you can put a price on.",
          decisionMaker: "CTO · Head of Engineering",
        },
        {
          id: "cloud-architecture",
          name: "Cloud Architecture, Migration & Cost Optimisation",
          problem:
            "Your cloud bill is growing faster than the business using it.",
          intervention:
            "We rebuild the architecture around the workload you actually run, then size it, secure it and cost it on purpose.",
          value: "Cloud spend you can explain line by line.",
          decisionMaker: "CIO · CTO",
        },
        {
          id: "ai-workflow-automation",
          name: "AI-Enabled Workflow Automation & Responsible Adoption",
          problem:
            "The pilot impressed everyone. It never made it into the day job.",
          intervention:
            "We redesign the work around what the model changes, set the review points, and prove the cost per case before you scale.",
          value: "AI that shows up in your operating numbers.",
          decisionMaker: "CIO · COO",
        },
        {
          id: "data-decision-systems",
          name: "Data, Analytics & Executive Decision Systems",
          problem:
            "You cannot see how delivery is going until someone tells you.",
          intervention:
            "We build the measurement first, then the reporting, so the numbers hold up on the days they are uncomfortable.",
          value: "A dashboard your leadership team actually opens.",
          decisionMaker: "CIO · CFO · COO",
        },
      ],
    },
    {
      id: "growth-and-experience",
      name: "Growth & Experience",
      summary:
        "Customer experience, omnichannel retail, service operations, vendor performance and digital growth.",
      capabilities: [
        {
          id: "cx-omnichannel",
          name: "Customer Experience, E-Commerce & Omnichannel",
          problem:
            "Your customer meets a different company on the app, the site and the shop floor.",
          intervention:
            "We design the journey once, then line up web, mobile and store behind it.",
          value: "One business, whichever door a customer walks through.",
          decisionMaker: "COO · CMO",
        },
        {
          id: "process-vendor-performance",
          name: "Process Excellence, Service Operations & Vendor Performance",
          problem:
            "Every supplier hits their SLA and the outcome still does not arrive.",
          intervention:
            "We rewrite the operating rhythm and the measures around business results instead of activity reports.",
          value: "Vendors judged on the thing you actually care about.",
          decisionMaker: "COO · Operations Lead",
        },
        {
          id: "digital-growth-geo",
          name: "Digital Growth, Technical SEO, GEO & Go-To-Market",
          problem:
            "Traffic is up. Revenue is flat. Nobody can tell you why.",
          intervention:
            "We rebuild the funnel around commercial measures, including how AI answer engines find and quote you.",
          value: "Marketing you can hold to a revenue number.",
          decisionMaker: "CEO · CMO",
        },
      ],
    },
  ] satisfies Pillar[],
} as const;

export const sectors = {
  eyebrow: "Experience",
  heading: "Where we have done this before.",
  note: "These are industries our leadership team has worked in directly. We are not claiming to know every sector, and we will tell you when a problem sits outside what we have seen.",
  items: [
    { icon: "terminal", name: "Software & B2B SaaS" },
    { icon: "cart", name: "E-Commerce & Retail" },
    { icon: "bank", name: "Public Sector & Citizen Services" },
    { icon: "shield", name: "Insurance & Financial Services" },
    { icon: "truck", name: "Travel, Logistics & Complex Operations" },
    { icon: "server", name: "Technology & Digital Platforms" },
  ],
} as const;

export const engagementModel = {
  eyebrow: "How We Work",
  heading: "Five stages, and a decision at the end of each one.",
  lead: "You are never more than one stage away from being able to stop. That is deliberate.",
  stages: [
    {
      name: "Diagnose",
      purpose:
        "We look at strategy, systems, people and governance together, and find where value is actually getting stuck.",
      output: "A ranked list of what is holding you back",
      gate: "Stop, change the scope, or move to Design.",
    },
    {
      name: "Prioritise",
      purpose:
        "We rank those constraints by what they are worth, what they risk, and what you can realistically take on now.",
      output: "An agreed order of work",
      gate: "You sign off the sequence before any design starts.",
    },
    {
      name: "Design",
      purpose:
        "We define the target operating model, the architecture and the measures that will tell us it worked.",
      output: "A solution design and the numbers it will be judged on",
      gate: "Design, plan and measures approved before anyone mobilises.",
    },
    {
      name: "Mobilise & Govern",
      purpose:
        "We stand up the delivery teams and the governance rhythm that keeps them honest against those measures.",
      output: "A running programme and reporting you can trust",
      gate: "A mid-programme review against the agreed measures. Scope changes if it needs to.",
    },
    {
      name: "Measure & Transfer",
      purpose:
        "We check the results against where you started, then hand the capability to your team so it does not leave with us.",
      output: "A results review and a proper handover",
      gate: "Results reviewed, capability transferred, engagement closes.",
    },
  ],
  gateNote:
    "After the diagnostic you can stop, adapt or proceed. Plenty of diagnostics end there, and that is a good outcome. You will have learned something and spent very little.",
} as const;

export const leadership = {
  eyebrow: "Leadership",
  heading: "You will be working with people who have done this.",
  headline: {
    value: "69+",
    unit: "years",
    label: "of combined leadership experience across the GCC, India and APAC.",
  },
  points: [
    "Leadership across founder-led ventures and Fortune 500 delivery organisations.",
    "Engineering and operations teams grown past 100 people, and past 360.",
    "Production platforms handling 135,000+ transactions every second.",
    "Delivery for public sector, e-commerce, insurance and technology clients.",
  ],
  qualification:
    "These are results our leadership team delivered in earlier roles, at other companies. They are not Anvukta Consulting Service results, and we will not present them as such. The 69 years is the sum of tenure across three leadership profiles supplied for this engagement.",
} as const;

export const caseStories = {
  eyebrow: "Selected Experience",
  heading: "Three problems, and what actually happened.",
  qualification:
    "Each of these was delivered by a member of the Anvukta Consulting Service leadership team in an earlier role, at another company. Client names are withheld until we have permission to use them.",
  items: [
    {
      id: "ai-workflow-platform",
      name: "AI Workflow Platform",
      situation:
        "A services business was capped by how many hours it could bill. It needed a revenue line that did not depend on people being available.",
      intervention:
        "Designed and shipped a multi-tenant, AI-powered automation platform from a blank page.",
      result:
        "A live commercial SaaS running enterprise workloads for under $1 of cloud cost per case.",
      why: "It shows internal know-how turned into a product with economics that work at scale.",
    },
    {
      id: "programme-recovery",
      name: "Programme Recovery",
      situation:
        "A Fortune 100 logistics firm had a multi-stream digital migration that had stalled and was losing value every month it ran.",
      intervention:
        "Recovered the governance, then put agile and DevOps delivery pipelines in place.",
      result:
        "$1.2M+ in value unlocked, deployment time down 40%, defects down 35%.",
      why: "It shows what disciplined recovery looks like on a programme that was already in trouble.",
    },
    {
      id: "gcc-omnichannel-launch",
      name: "GCC Omnichannel Launch",
      situation:
        "A regional retail group needed to bring many brands online together, on a date it could not move.",
      intervention:
        "Co-led an enterprise-wide omnichannel transformation across web, mobile and in-store.",
      result: "28 brand platforms launched on a single day across the GCC.",
      why: "It shows large, multi-brand delivery against a hard deadline, in this region.",
    },
  ],
} as const;

export const engagements = {
  eyebrow: "Ways To Engage",
  heading: "Three ways to start.",
  items: [
    {
      id: "executive-diagnostic",
      icon: "insights",
      name: "Executive Diagnostic & Transformation Roadmap",
      buyer: "CEO / COO",
      problem:
        "You know value is leaking somewhere between strategy and delivery. You cannot point at where.",
      scope: "Usually 3 to 4 weeks.",
      outcome:
        "A ranked view of where value is stuck and what to fix first.",
      decision: "Move to design, or stop with a roadmap you keep.",
    },
    {
      id: "fractional-leadership",
      icon: "people",
      name: "Fractional Transformation, Technology or Programme Leadership",
      buyer: "CIO / CTO / COO",
      problem:
        "You need senior leadership now, and you are not ready to commit to a permanent hire.",
      scope: "Part-time or interim, with the scope written down.",
      outcome: "Senior capacity without a full-time headcount.",
      decision: "Renew, convert to permanent, or wind down.",
    },
    {
      id: "programme-recovery",
      icon: "route",
      name: "Programme Recovery & Delivery Acceleration",
      buyer: "Programme Sponsor / CIO",
      problem:
        "A committed programme has stalled, and the reporting has lost its credibility.",
      scope: "An assessment first, then a fixed recovery plan.",
      outcome: "A stalled programme moving again, with governance you can see.",
      decision: "Commit to the recovery plan, or stand it down cleanly.",
    },
  ],
  note: "We price once we understand the problem, and not before. A number quoted before that is a guess with a decimal point.",
} as const;

export const finalCta = {
  eyebrow: "Recommended Next Step",
  heading: "Give us 60 minutes.",
  lead: "One conversation, with the people who would do the work. No deck, no discovery call that turns into a pitch.",
  purpose: [
    "Work out which constraint is costing you the most right now.",
    "Agree what evidence you would need before acting on it.",
    "Decide together whether a diagnostic is worth doing at all.",
  ],
  close:
    "If we do not think a diagnostic is worth your money, we will say so in the call. That happens, and it is a perfectly good result.",
} as const;
