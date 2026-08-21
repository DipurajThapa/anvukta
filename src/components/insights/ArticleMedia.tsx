import Image from "next/image";

import { ArtCover } from "@/components/art/ArtCover";

/**
 * The banner at the top of an article.
 *
 * Three cases, decided by what the editor put in the hero field:
 *   a video file  -> an inline, muted, looping video with a poster frame
 *   an image file -> an optimised responsive image
 *   nothing       -> the generated cover, so an article is never bannerless
 *
 * The frame keeps a fixed 3:2 box in every case, so the page never jumps while
 * the media loads.
 */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];

export function isVideo(src: string | null | undefined): boolean {
  if (!src) return false;
  const path = src.split("?")[0]?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.some((extension) => path.endsWith(extension));
}

export function ArticleMedia({
  src,
  poster,
  alt,
  slug,
  className,
  priority = false,
}: {
  src: string | null;
  /** Still frame shown before a video plays, and while it loads. */
  poster?: string | null;
  alt: string | null;
  /** Falls back to generated cover art keyed on the slug. */
  slug: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return <ArtCover seed={slug} className={className} />;
  }

  if (isVideo(src)) {
    return (
      <div
        className={className}
        style={{ aspectRatio: "3 / 2", position: "relative", overflow: "hidden" }}
      >
        {/* Muted, looping and inline: this is a banner, not something to watch.
            Controls are offered so a reader can pause it if they want to. */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          aria-label={alt ?? "Article banner video"}
        >
          Your browser cannot play this video.
        </video>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ aspectRatio: "3 / 2", position: "relative", overflow: "hidden" }}
    >
      <Image
        src={src}
        alt={alt ?? ""}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 62vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
