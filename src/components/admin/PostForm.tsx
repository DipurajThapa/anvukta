"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { savePost } from "@/app/actions/admin";
import { Icon } from "@/components/ui/Icon";
import { initialAdminState } from "@/lib/form-state";
import { slugify } from "@/lib/utils";

export type PostFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  heroImage: string;
  heroImageAlt: string;
  heroPoster: string;
  categoryId: string;
  tags: string;
  status: "draft" | "published";
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
};

type Category = { id: string; name: string };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={name}>
        {label}
      </label>
      {hint ? (
        <p className="field__hint" id={`${name}-hint`}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="field__error" id={`${name}-error`}>
          <span aria-hidden="true">✕</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export function PostForm({
  values,
  categories,
  savedNotice,
}: {
  values: PostFormValues;
  categories: Category[];
  savedNotice?: boolean;
}) {
  const [state, formAction] = useActionState(savePost, initialAdminState);

  const [title, setTitle] = useState(values.title);
  const [content, setContent] = useState(values.content);
  const [showPreview, setShowPreview] = useState(false);

  // null means "follow the title"; a string means the slug was edited by hand.
  const [slugOverride, setSlugOverride] = useState<string | null>(
    values.slug.length > 0 ? values.slug : null,
  );
  const slug = slugOverride ?? slugify(title);

  const error = (field: string) => state.fieldErrors[field];
  const isEdit = Boolean(values.id);

  return (
    <form action={formAction} className="mt-8" noValidate>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "mb-8 border-l-2 border-[color:var(--color-danger)] bg-[color:var(--color-paper-warm)] p-4 text-[length:var(--text-small)] font-medium text-[color:var(--color-danger)]"
              : "mb-8 border-l-2 border-[color:var(--color-success)] bg-[color:var(--color-paper-warm)] p-4 text-[length:var(--text-small)] font-medium text-[color:var(--color-success)]"
          }
        >
          {state.message}
        </p>
      ) : savedNotice ? (
        <p
          role="status"
          className="mb-8 border-l-2 border-[color:var(--color-success)] bg-[color:var(--color-paper-warm)] p-4 text-[length:var(--text-small)] font-medium text-[color:var(--color-success)]"
        >
          Article created.
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Field name="title" label="Title" error={error("title")}>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="field__control"
              aria-invalid={error("title") ? true : undefined}
              aria-describedby={error("title") ? "title-error" : undefined}
            />
          </Field>

          <Field
            name="slug"
            label="Slug"
            hint="Lowercase letters, numbers and hyphens. Must be unique."
            error={error("slug")}
          >
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={slug}
              onChange={(event) => setSlugOverride(event.target.value)}
              className="field__control"
              aria-invalid={error("slug") ? true : undefined}
              aria-describedby={
                error("slug") ? "slug-hint slug-error" : "slug-hint"
              }
            />
          </Field>

          <Field
            name="excerpt"
            label="Excerpt"
            hint="Shown on cards and used as the fallback meta description."
            error={error("excerpt")}
          >
            <textarea
              id="excerpt"
              name="excerpt"
              required
              rows={3}
              defaultValue={values.excerpt}
              className="field__control"
              style={{ minHeight: "6rem" }}
              aria-invalid={error("excerpt") ? true : undefined}
              aria-describedby={
                error("excerpt") ? "excerpt-hint excerpt-error" : "excerpt-hint"
              }
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="field__label">Content (Markdown)</span>
              <button
                type="button"
                className="btn btn-secondary min-h-[2.75rem] px-4"
                aria-pressed={showPreview}
                onClick={() => setShowPreview((value) => !value)}
              >
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>

            {showPreview ? (
              <div
                className="border border-[color:var(--color-line-strong)] p-6"
                aria-live="polite"
              >
                <p className="t-caption mb-4 text-[color:var(--color-text-muted)]">
                  Raw Markdown preview. The published page renders and sanitises
                  this on the server.
                </p>
                <pre className="whitespace-pre-wrap text-[length:var(--text-small)] leading-[1.7]">
                  {content}
                </pre>
              </div>
            ) : (
              <>
                <textarea
                  id="content"
                  name="content"
                  required
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="field__control font-mono"
                  style={{ minHeight: "28rem", fontSize: "0.875rem" }}
                  aria-invalid={error("content") ? true : undefined}
                  aria-describedby={error("content") ? "content-error" : undefined}
                />
                {error("content") ? (
                  <p className="field__error mt-2" id="content-error">
                    <span aria-hidden="true">✕</span>
                    <span>{error("content")}</span>
                  </p>
                ) : null}
              </>
            )}
            {showPreview ? (
              <input type="hidden" name="content" value={content} />
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="border-t-2 border-[color:var(--color-ink)] pt-5">
            <h2 className="t-eyebrow">Publication</h2>

            <div className="mt-5 flex flex-col gap-5">
              <Field name="status" label="Status" error={error("status")}>
                <select
                  id="status"
                  name="status"
                  defaultValue={values.status}
                  className="field__control"
                >
                  <option value="draft">Draft, not publicly visible</option>
                  <option value="published">Published, live on the site</option>
                </select>
              </Field>

              <Field
                name="publishedAt"
                label="Publication date"
                hint="Leave blank to use the moment it is first published."
                error={error("publishedAt")}
              >
                <input
                  id="publishedAt"
                  name="publishedAt"
                  type="datetime-local"
                  defaultValue={values.publishedAt}
                  className="field__control"
                  aria-describedby="publishedAt-hint"
                />
              </Field>

              <Field name="categoryId" label="Category" error={error("categoryId")}>
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={values.categoryId}
                  className="field__control"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                name="tags"
                label="Tags"
                hint="Comma separated. New tags are created automatically."
                error={error("tags")}
              >
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  defaultValue={values.tags}
                  className="field__control"
                  aria-describedby="tags-hint"
                />
              </Field>
            </div>
          </div>

          <div className="border-t-2 border-[color:var(--color-ink)] pt-5">
            <h2 className="t-eyebrow">Banner</h2>
            <p className="field__hint mt-3">
              The banner takes an image or a video. Put a <code>.jpg</code>,{" "}
              <code>.png</code> or <code>.webp</code> for an image, or a{" "}
              <code>.mp4</code> or <code>.webm</code> for a video. Videos play
              muted and looping, and a reader can pause them. Leave it empty and
              we generate cover art from the slug.
            </p>

            <div className="mt-5 flex flex-col gap-5">
              <Field
                name="heroImage"
                label="Banner image or video"
                hint="A path like /media/hero.jpg or /media/hero.mp4."
                error={error("heroImage")}
              >
                <input
                  id="heroImage"
                  name="heroImage"
                  type="text"
                  defaultValue={values.heroImage}
                  className="field__control"
                  placeholder="/media/example.jpg"
                  aria-describedby="heroImage-hint"
                />
              </Field>

              <Field
                name="heroPoster"
                label="Video poster image"
                hint="Only used for videos. Shown before the video plays."
                error={error("heroPoster")}
              >
                <input
                  id="heroPoster"
                  name="heroPoster"
                  type="text"
                  defaultValue={values.heroPoster}
                  className="field__control"
                  placeholder="/media/example-poster.jpg"
                  aria-describedby="heroPoster-hint"
                />
              </Field>

              <Field
                name="heroImageAlt"
                label="Describe the banner"
                hint="What someone would miss if they could not see it."
                error={error("heroImageAlt")}
              >
                <input
                  id="heroImageAlt"
                  name="heroImageAlt"
                  type="text"
                  defaultValue={values.heroImageAlt}
                  className="field__control"
                  aria-describedby="heroImageAlt-hint"
                />
              </Field>
            </div>
          </div>

          <div className="border-t-2 border-[color:var(--color-ink)] pt-5">
            <h2 className="t-eyebrow">Search &amp; social</h2>
            <div className="mt-5 flex flex-col gap-5">
              <Field
                name="seoTitle"
                label="SEO title"
                hint="Up to 70 characters. Falls back to the article title."
                error={error("seoTitle")}
              >
                <input
                  id="seoTitle"
                  name="seoTitle"
                  type="text"
                  maxLength={70}
                  defaultValue={values.seoTitle}
                  className="field__control"
                  aria-describedby="seoTitle-hint"
                />
              </Field>

              <Field
                name="seoDescription"
                label="Meta description"
                hint="Up to 180 characters. Falls back to the excerpt."
                error={error("seoDescription")}
              >
                <textarea
                  id="seoDescription"
                  name="seoDescription"
                  rows={3}
                  maxLength={180}
                  defaultValue={values.seoDescription}
                  className="field__control"
                  style={{ minHeight: "5.5rem" }}
                  aria-describedby="seoDescription-hint"
                />
              </Field>

              <Field
                name="canonicalUrl"
                label="Canonical URL"
                hint="Only set this if the article was first published elsewhere."
                error={error("canonicalUrl")}
              >
                <input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  type="url"
                  defaultValue={values.canonicalUrl}
                  className="field__control"
                  aria-describedby="canonicalUrl-hint"
                />
              </Field>

              <Field
                name="ogImage"
                label="Open Graph image URL"
                hint="Falls back to the site-wide social card."
                error={error("ogImage")}
              >
                <input
                  id="ogImage"
                  name="ogImage"
                  type="text"
                  defaultValue={values.ogImage}
                  className="field__control"
                  aria-describedby="ogImage-hint"
                />
              </Field>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-[color:var(--color-line)] pt-6">
        <SubmitButton label={isEdit ? "Save changes" : "Create article"} />
        <Link href="/admin/blog" className="btn btn-secondary">
          Cancel
        </Link>
        {isEdit && values.status === "published" ? (
          <Link
            href={`/blog/${values.slug}`}
            className="link t-small inline-flex items-center gap-1.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            View live article
            <Icon name="external" size="xs" />
          </Link>
        ) : null}
      </div>
    </form>
  );
}
