import { describe, it, expect, vi, afterEach } from "vitest";
import { copyToClipboard } from "../../src/utils/clipboard";

describe("clipboard utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses navigator.clipboard.writeText when in secure context", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const result = await copyToClipboard("hello world");
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith("hello world");
  });

  it("falls back to document.execCommand when navigator.clipboard is unavailable", async () => {
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true,
    });
    document.execCommand = vi.fn().mockReturnValue(true);

    const result = await copyToClipboard("fallback text");
    expect(result).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("returns false when execCommand fallback is denied by browser policy", async () => {
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true,
    });
    // Browser policy returns false (clipboard access denied)
    document.execCommand = vi.fn().mockReturnValue(false);

    const result = await copyToClipboard("denied text");
    expect(result).toBe(false);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("handles exceptions gracefully and returns false", async () => {
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
      configurable: true,
    });

    const result = await copyToClipboard("will fail");
    expect(result).toBe(false);
  });
});
