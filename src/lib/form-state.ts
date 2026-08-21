import type { FieldErrors } from "@/lib/validation";

/**
 * Shared form-state shapes and their initial values.
 *
 * These live outside the "use server" modules because a server-action file may
 * only export async functions — a plain object export breaks the build.
 */

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: FieldErrors;
};

export const initialContactState: ContactState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export type LoginState = { error: string };

export const initialLoginState: LoginState = { error: "" };

export type AdminState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors: FieldErrors;
};

export const initialAdminState: AdminState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};
