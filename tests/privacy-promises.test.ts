import { describe, expect, it } from "vitest";

import { CLIENT_COOKIE_MAX_AGE_DAYS } from "@/lib/rate-limit";
import { privacy } from "@/content/privacy";

/**
 * The privacy notice makes promises the code has to keep. These tests fail when
 * the two drift apart, which is the failure mode that matters: the page keeps
 * saying something the application stopped doing.
 */

const allText = JSON.stringify(privacy).toLowerCase();
const sectionIds = privacy.sections.map((section) => section.id);

describe("the notice describes what the site actually does", () => {
  it("names every cookie the site sets", () => {
    expect(allText).toContain("anvukta_cid");
    expect(allText).toContain("anvukta_session");
  });

  it("states the client cookie's real lifetime", () => {
    expect(allText).toContain(`${CLIENT_COOKIE_MAX_AGE_DAYS} days`);
  });

  it("no longer claims visitors get no cookies", () => {
    expect(allText).not.toContain("we do not use cookies for visitors");
  });

  it("no longer claims the contact form is the only collection point", () => {
    expect(allText).not.toContain("in one place on this site");
  });

  it("has a section for the chat, cookies, and where data is stored", () => {
    expect(sectionIds).toContain("the-chat");
    expect(sectionIds).toContain("cookies");
    expect(sectionIds).toContain("where-it-lives");
  });

  it("still covers retention, rights and lawful basis", () => {
    expect(sectionIds).toContain("how-long");
    expect(sectionIds).toContain("your-rights");
    expect(sectionIds).toContain("lawful-basis");
  });

  it("tells people they can complain to a regulator", () => {
    expect(allText).toContain("complain to the data protection authority");
  });

  it("does not use an em dash anywhere", () => {
    expect(JSON.stringify(privacy)).not.toContain("\u2014");
  });
});
