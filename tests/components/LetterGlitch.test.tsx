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

  it("handles smooth transitions and custom glitchSpeed prop", () => {
    const { container } = render(
      <LetterGlitch
        glitchSpeed={20}
        smooth={true}
        glitchColors={["#ff0000", "#00ff00"]}
      />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("handles IntersectionObserver callbacks and window resize", () => {
    let observerCallback: (entries: any[]) => void = () => {};
    class MockIntersectionObserver {
      constructor(cb: any) {
        observerCallback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const { container } = render(<LetterGlitch glitchSpeed={10} smooth />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Trigger intersection visible
    observerCallback([{ isIntersecting: true }]);

    // Trigger window resize
    window.dispatchEvent(new Event("resize"));

    // Trigger intersection hidden
    observerCallback([{ isIntersecting: false }]);

    vi.unstubAllGlobals();
  });
});
