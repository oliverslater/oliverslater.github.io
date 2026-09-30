import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchCredentialJson } from "../../src/utils/credentialApi";

describe("credentialApi utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully fetches and parses JSON response", async () => {
    const mockData = { items: [1, 2, 3] };
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockData),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await fetchCredentialJson<typeof mockData>(
      "https://example.com/api",
      5000,
      "TestProvider",
    );

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith("https://example.com/api", {
      headers: {
        Accept: "application/json",
        "User-Agent": "OliverSlater-VirtualCV/1.0",
      },
      signal: expect.anything(),
    });

    vi.unstubAllGlobals();
  });

  it("throws descriptive error when response is not ok", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(
      fetchCredentialJson("https://example.com/api", 5000, "Credly"),
    ).rejects.toThrow("Credly API returned HTTP 404");

    vi.unstubAllGlobals();
  });
});
