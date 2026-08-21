"use client";

import { useRef } from "react";

/**
 * Destructive submit guarded by a native <dialog>. The dialog element gives
 * focus trapping, Esc-to-close and a real modal role for free, and the form
 * still submits normally if the browser has no dialog support.
 */
export function ConfirmSubmit({
  label,
  title,
  description,
  confirmLabel,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  return (
    <>
      <button
        type="button"
        className="btn btn-danger"
        onClick={(event) => {
          const dialog = dialogRef.current;
          if (!dialog?.showModal) return; // No dialog support: let the form submit.
          event.preventDefault();
          dialog.showModal();
        }}
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] border border-[color:var(--color-line-strong)] bg-[color:var(--color-paper)] p-6 backdrop:bg-black/50"
      >
        <h2 id="confirm-title" className="t-h3">
          {title}
        </h2>
        <p
          id="confirm-description"
          className="mt-3 text-[length:var(--text-body)] text-[color:var(--color-text-muted)]"
        >
          {description}
        </p>

        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-danger">
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
