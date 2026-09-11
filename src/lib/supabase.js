import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://example.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const logAppError = (context, error) => {
  const details = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : undefined,
      }
    : error;

  if (import.meta.env.DEV) {
    console.error(`[${context}]`, details);
    return;
  }

  console.error(`[${context}] Runtime error`, {
    message: error?.message || "Unknown runtime error",
  });
};

export const getFriendlyErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  const rawMessage = typeof error?.message === "string" ? error.message.trim() : "";
  const lowerMessage = rawMessage.toLowerCase();

  if (!rawMessage) return fallback;

  if (
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("already taken") ||
    lowerMessage.includes("violates unique")
  ) {
    return "This item already exists. Please choose a different one.";
  }

  if (
    lowerMessage.includes("permission denied") ||
    lowerMessage.includes("row-level security") ||
    lowerMessage.includes("policy")
  ) {
    return "You do not have permission to complete this action right now.";
  }

  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("timeout")
  ) {
    return "Connection issue. Please check your internet connection and try again.";
  }

  if (
    lowerMessage.includes("not found") &&
    (lowerMessage.includes("table") || lowerMessage.includes("relation"))
  ) {
    return "The service is temporarily unavailable. Please try again in a moment.";
  }

  return fallback;
};