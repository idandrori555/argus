export const GEMINI_API_KEY = Bun.env['GEMINI_API_KEY'] ?? "";

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}
