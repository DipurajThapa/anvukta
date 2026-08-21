/**
 * Privacy notice content.
 *
 * Describes only what the application actually does. Every claim here is
 * traceable to code:
 *   - form fields:      src/lib/validation.ts (contactSchema)
 *   - what is stored:   prisma/schema.prisma (ContactSubmission, ChatConversation, ChatMessage)
 *   - the chat:         src/app/actions/chat.ts
 *   - the sender hash:  src/lib/rate-limit.ts (clientFingerprint)
 *   - email handling:   src/lib/mail.ts
 *   - cookies:          src/lib/auth.ts (anvukta_session), src/lib/rate-limit.ts (anvukta_cid)
 *   - deletion:         scripts/purge-expired-data.mjs, src/app/actions/admin.ts
 *
 * If any of those change, this file changes with them.
 */

export const privacy = {
  title: "Privacy Notice",
  description:
    "What Anvukta Consulting Service collects when you use this website, why we collect it, how long we keep it, and how to have it removed.",

  /** Set once the business confirms a data controller contact. */
  lastUpdated: "2026-08-21",

  intro:
    "This notice covers this website only. We have written it to be read, not survived. If anything here is unclear, ask us and we will explain it in plain words.",

  sections: [
    {
      id: "what-we-collect",
      heading: "What we collect",
      body: [
        "We collect personal data in two places on this site: the contact form, and the chat window. Nothing else asks you for information. We do not follow you around as you read, and we do not build a profile of you.",
      ],
      table: {
        caption: "Everything the contact form stores",
        head: ["Field", "Required", "Why we need it"],
        rows: [
          ["Full name", "Yes", "So we can address a reply to a person."],
          ["Work email", "Yes", "So we can reply."],
          ["Company", "Yes", "So we understand the context of the enquiry."],
          ["Job title", "No", "Helps us pitch the reply at the right level."],
          ["Phone", "No", "Only if you would rather we called."],
          ["Service of interest", "No", "Routes the enquiry to the right person."],
          ["Your message", "Yes", "The enquiry itself."],
          [
            "A one-way code for the sender",
            "Automatic",
            "Limits how many messages one sender can submit in an hour. It is made by scrambling either your address or the anvukta_cid cookie below, with a secret, in a way that cannot be turned back. Neither the address nor the cookie value is stored.",
          ],
          [
            "Your browser's user agent",
            "Automatic",
            "Helps us tell a real enquiry from automated spam.",
          ],
        ],
      },
    },
    {
      id: "the-chat",
      heading: "The chat window",
      body: [
        "The chat answers using passages we have already published on this site. It does not invent answers, and nothing you type is sent to an outside company or used to train anything.",
        "What you type is stored so that a person here can pick the conversation up and reply. If you ask for a person, you can give a name and an email so we can reach you, and both are optional. You can talk to the chat without giving either.",
        "Your browser also keeps a short code so the window can show you the same conversation when you come back. That code sits in your browser's own storage, not in a cookie, and clearing your browsing data removes it.",
      ],
      table: {
        caption: "Everything the chat stores",
        head: ["Field", "Required", "Why we need it"],
        rows: [
          ["Your messages", "Yes", "So a person can read the question and answer it."],
          ["Our replies", "Yes", "So you can read them again when you return."],
          ["Your name", "No", "Only if you ask for a person and choose to give it."],
          ["Your email", "No", "Only if you ask for a person and want a reply by email."],
          [
            "A one-way code for the sender",
            "Automatic",
            "Stops one sender flooding the chat. Made the same way as the one on the contact form.",
          ],
          [
            "Your browser's user agent",
            "Automatic",
            "Helps us tell a real question from automated abuse.",
          ],
        ],
      },
    },
    {
      id: "cookies",
      heading: "Cookies",
      body: [
        "This site sets two cookies and no more. Both are needed for the site to work safely, neither follows you to other websites, and neither is readable by scripts running in your browser.",
        "We set no advertising cookies, no analytics cookies and nothing belonging to another company, which is why you do not see a cookie banner asking for permission.",
      ],
      table: {
        caption: "Every cookie this site sets",
        head: ["Name", "What it is for", "How long it lasts"],
        rows: [
          [
            "anvukta_cid",
            "Tells the site that a run of requests came from the same browser, so one sender cannot flood the contact form or the chat. It holds a random code we made up, and nothing about you.",
            "30 days",
          ],
          [
            "anvukta_session",
            "Keeps our own staff signed in to the administration area. Visitors never receive it.",
            "8 hours",
          ],
        ],
      },
    },
    {
      id: "what-we-do-not",
      heading: "What we do not do",
      body: [
        "This site loads no third-party scripts at all. There is no analytics, no advertising, no social tracking, no session recording and no fingerprinting.",
        "We do not sell your data, share it with anyone for marketing, or add you to a mailing list. There is no mailing list.",
      ],
    },
    {
      id: "lawful-basis",
      heading: "Why we are allowed to hold it",
      body: [
        "You give us your details deliberately, by filling in a form and ticking a consent box, so that we can reply. That consent is our basis for holding them, and you can withdraw it at any time by asking us to delete the enquiry.",
        "In the chat, we hold what you type because you started a conversation and asked us something. If you hand the conversation to a person and give a name or an email, you are choosing to give them, and you can ask us to delete the whole conversation.",
        "The two cookies and the sender code exist to keep the site standing up against abuse. We rely on our legitimate interest in running a working website, and we have kept both to the smallest thing that does the job.",
        "Once a conversation becomes a commercial relationship, we hold what we need to perform that engagement, under the contract between us.",
      ],
    },
    {
      id: "how-long",
      heading: "How long we keep it",
      body: [
        "Enquiries that do not lead anywhere are deleted within 24 months. Enquiries that become engagements are kept for as long as the engagement runs, and then for the period our professional and tax obligations require.",
        "Chat conversations are deleted 12 months after the last message. A conversation nobody ever wrote in is deleted after 7 days.",
        "The counter that limits how often one sender can write expires within an hour and is then deleted.",
        "These are not promises we leave to memory. A routine runs on a schedule and deletes anything past its date, and you can ask us at any time to run it sooner for your own records.",
      ],
    },
    {
      id: "who-sees-it",
      heading: "Who can see it",
      body: [
        "Only Anvukta Consulting Service staff, through a password-protected administration area on this site. Access requires a personal account, and every session expires after eight hours.",
        "If we have configured email notifications, a copy of your enquiry is also sent to our own inbox with our email provider. No other third party receives it.",
      ],
    },
    {
      id: "security",
      heading: "How it is protected",
      body: [
        "The site is served over HTTPS with strict transport security. Passwords are stored as salted scrypt hashes, never in readable form. Sign-in sessions are stored as one-way hashes, so reading the database does not let anyone impersonate a user.",
        "Your IP address is hashed with a secret before storage and is never recorded in readable form.",
      ],
    },
    {
      id: "your-rights",
      heading: "Your rights",
      body: [
        "You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to delete it. You can also withdraw your consent, which means the same thing as asking us to delete it.",
        "Email us and we will act within 30 days. We will not ask you to justify the request. Tell us the email address you used, or paste a line from the conversation, and that is enough for us to find it and remove it.",
        "If you think we have handled your data badly, you can complain to the data protection authority where you live, and you do not have to come to us first.",
      ],
    },
    {
      id: "where-it-lives",
      heading: "Where your data lives",
      body: [
        "The site and its database run on servers in the United Arab Emirates. Your data is held there and is not copied to another country by us.",
        "If we have switched on email notifications, a copy of your enquiry also reaches our own inbox with our email provider, so that provider handles it on our behalf. We use no other outside service to store or process what you send us.",
        "If we ever move the site to another country, we will change this page before we move it, and we will put a lawful transfer arrangement in place first.",
      ],
    },
    {
      id: "children",
      heading: "Children",
      body: [
        "This site is aimed at business decision-makers. We do not knowingly collect data from anyone under 18. If you believe we have, tell us and we will delete it.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this notice",
      body: [
        "If we change what we collect or what we do with it, we will update this page and change the date at the top. We will not apply a change retrospectively to data you gave us under an earlier version without asking you first.",
      ],
    },
  ],
} as const;
