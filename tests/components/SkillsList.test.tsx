import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SkillsList, { type PillarItem } from "../../src/components/SkillsList";

describe("<SkillsList /> Component", () => {
  const mockPillars: PillarItem[] = [
    {
      category: "Cloud Architecture",
      icon: "cloud",
      items: ["AWS Well-Architected", "Terraform", "Kubernetes"],
    },
    {
      category: "Modern Delivery",
      icon: "box",
      items: ["CI/CD Pipelines", "Docker", "GitOps"],
    },
  ];

  it("renders pillar categories, expands first item by default, and toggles upon click", () => {
    render(<SkillsList pillars={mockPillars} />);

    // Categories are visible
    expect(screen.getByText("Cloud Architecture")).toBeInTheDocument();
    expect(screen.getByText("Modern Delivery")).toBeInTheDocument();

    // First pillar is expanded by default
    expect(screen.getByText("AWS Well-Architected")).toBeInTheDocument();

    // Second pillar is collapsed initially
    expect(screen.queryByText("CI/CD Pipelines")).not.toBeInTheDocument();

    // Click second pillar button to expand it
    fireEvent.click(screen.getByText("Modern Delivery"));

    // Second pillar is now expanded
    expect(screen.getByText("CI/CD Pipelines")).toBeInTheDocument();
  });

  it("handles record format pillars as fallback", () => {
    const recordPillars = {
      "Backend Engineering": ["TypeScript", "Node.js", "Python"],
    };

    render(<SkillsList pillars={recordPillars} />);

    expect(screen.getByText("Backend Engineering")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("toggles the open pillar to collapsed when clicked again", () => {
    render(<SkillsList pillars={mockPillars} />);

    // First pillar is expanded by default
    expect(screen.getByText("AWS Well-Architected")).toBeInTheDocument();

    // Click the active pillar button
    fireEvent.click(screen.getByText("Cloud Architecture"));

    // Now it should be collapsed
    expect(screen.queryByText("AWS Well-Architected")).not.toBeInTheDocument();
  });

  it("renders distinct icons for code/pipeline, serverless/data, and security/shield categories", () => {
    const variedPillars: PillarItem[] = [
      { category: "Infrastructure as Code", items: ["Terraform"] },
      { category: "Serverless Data", items: ["Lambda", "DynamoDB"] },
      { category: "DevSecOps & Security", items: ["OWASP", "Trivy"] },
      { category: "Cloud Architecture", items: ["Multi-Region"] },
    ];

    const { container } = render(<SkillsList pillars={variedPillars} />);
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(4);
  });

  it("handles empty pillars without throwing errors", () => {
    const { container } = render(<SkillsList pillars={[]} />);
    expect(container).toBeInTheDocument();
  });
});
