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

      let execCommandSucceeded = false;
      try {
        // execCommand is deprecated but remains the only fallback in non-secure contexts.
        // Capture the boolean return value — false means the command was denied.
        execCommandSucceeded = document.execCommand("copy");
      } catch {
        // Suppress if execCommand throws (e.g., security policy violation)
      }

      document.body.removeChild(textarea);
      return execCommandSucceeded;
    }

    return false;
  } catch {
    return false;
  }
}
