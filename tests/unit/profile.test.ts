import { describe, it, expect } from "vitest";
import { getContactDetails } from "../../src/utils/profile";

describe("profile utils", () => {
  it("extracts contact details from profile data and environment", () => {
    const details = getContactDetails();
    expect(details).toHaveProperty("showEmail");
    expect(details).toHaveProperty("contactEmail");
    expect(details).toHaveProperty("github");
    expect(details).toHaveProperty("linkedin");
    expect(details).toHaveProperty("website");
  });
});
