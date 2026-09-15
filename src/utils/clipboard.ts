/**
 * Copies text to the clipboard with modern asynchronous API and legacy fallback.
 * Works seamlessly across secure contexts (HTTPS/localhost) and fallback environments.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      textarea.style.top = "-999999px";
      textarea.setAttribute("aria-hidden", "true");
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        (document as any).execCommand("copy");
      } catch {
        // Suppress if execCommand is disallowed
      }

      document.body.removeChild(textarea);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
