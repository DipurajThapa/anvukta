import type { Metadata } from "next";

import { EngagementSection } from "@/components/home/EngagementSection";
import {
  FinalCtaSection,
  WaysToEngageSection,
} from "@/components/home/EngageSection";
import { Hero } from "@/components/home/Hero";
import { PostCardItem } from "@/components/insights/PostCard";
import { TextArrowLink } from "@/components/ui/ArrowLink";
import {
  ChapterRule,
  ImageBandBreaker,
  StatementBreaker,
} from "@/components/ui/SectionBreaker";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getPublishedPosts } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} | ${site.tagline}` },
  description: site.description,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    url: absoluteUrl("/"),
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: [{ url: site.ogImagePath, width: 1200, height: 630, alt: site.tagline }],
  },
};

/** Latest Insights — omitted entirely when nothing is published yet. */
async function InsightsTeaser() {
  const { posts } = await getPublishedPosts({ page: 1 });
  if (posts.length === 0) return null;

  return (
    <section className="section" aria-labelledby="insights-teaser-heading">
      <div className="content">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Insights"
            heading="Thinking on transformation, technology and AI."
            headingId="insights-teaser-heading"
          />
          <TextArrowLink href="/blog">View all insights</TextArrowLink>
        </div>

        <hr className="rule mt-10" />

        <ul className="grid12 mt-10">
          {posts.slice(0, 3).map((post) => (
            <li key={post.id} className="md:col-span-3 lg:col-span-4">
              <PostCardItem post={post} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Section rhythm, deliberately alternating so no two neighbours share a shape:
 * ink photo → paper → ink photo → paper → warm statement → paper → ink.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      <ChapterRule index={1} label="How we work" />
      <EngagementSection />

      <ImageBandBreaker
        src="/media/breaker-port.jpg"
        alt="Container cranes along a working port at dusk, lit against a heavy sky."
        eyebrow="The discipline"
      >
        We govern engagements with evidence and decisions, not with an
        open-ended count of hours.
      </ImageBandBreaker>

      <InsightsTeaser />

      <StatementBreaker>
        We do not price before we understand the problem.
      </StatementBreaker>

      <WaysToEngageSection />
      <FinalCtaSection />
    </>
  );
}
