import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import LetterGlitch from "../../src/components/LetterGlitch";

describe("<LetterGlitch /> Component", () => {
  it("renders a canvas element without crashing", () => {
    // Mock getContext for jsdom canvas support
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    });

    const { container } = render(<LetterGlitch />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });
});
