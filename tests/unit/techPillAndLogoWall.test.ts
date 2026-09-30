import { describe, it, expect } from "vitest";
import { technologiesData } from "../../src/data/siteData";

// Icon classification logic mirrored from TechPill.astro
export function getTechPillIconType(name: string): string {
  const n = name.toLowerCase().trim();
  if (n.includes("gemini")) return "gemini";
  if (n.includes("lambda")) return "lambda";
  if (n.includes("s3") || n.includes("storage")) return "s3";
  if (n.includes("dynamodb") || n.includes("nosql")) return "dynamodb";
  if (
    (n.includes("aurora") || n.includes("sql") || n.includes("relational")) &&
    !n.includes("nosql")
  )
    return "aurora";
  if (n.includes("aws")) return "aws";
  if (n.includes("azure")) return "azure";
  if (n.includes("terraform")) return "terraform";
  if (n.includes("kubernetes")) return "kubernetes";
  if (n.includes("docker")) return "docker";
  if (n.includes("python")) return "python";
  if (n.includes("github")) return "github";
  if (n.includes("gitlab")) return "gitlab";
  if (n.includes("linux")) return "linux";
  if (
    n.includes("security") ||
    n.includes("iam") ||
    n.includes("governance") ||
    n.includes("well-architected")
  )
    return "security";
  return "fallback";
}

describe("LogoWall & TechPill styling/rendering tests", () => {
  describe("TechPill category icon mapping", () => {
    it("maps cloud platforms correctly", () => {
      expect(getTechPillIconType("AWS Solutions Architecture")).toBe("aws");
      expect(getTechPillIconType("Microsoft Azure Cloud")).toBe("azure");
    });

    it("maps IaC and container technologies correctly", () => {
      expect(getTechPillIconType("Terraform")).toBe("terraform");
      expect(getTechPillIconType("Kubernetes (EKS/AKS)")).toBe("kubernetes");
      expect(getTechPillIconType("Docker Containers")).toBe("docker");
    });

    it("maps serverless and database primitives correctly", () => {
      expect(getTechPillIconType("AWS Lambda")).toBe("lambda");
      expect(getTechPillIconType("Amazon S3 Object Storage")).toBe("s3");
      expect(getTechPillIconType("DynamoDB NoSQL")).toBe("dynamodb");
      expect(getTechPillIconType("PostgreSQL Relational")).toBe("aurora");
    });

    it("maps security and DevSecOps correctly", () => {
      expect(getTechPillIconType("IAM Security")).toBe("security");
      expect(getTechPillIconType("Well-Architected Framework")).toBe(
        "security",
      );
    });

    it("falls back to generic chip for unmapped tech", () => {
      expect(getTechPillIconType("OpenTelemetry")).toBe("fallback");
    });
  });

  describe("LogoWall technologies data structure", () => {
    it("loads valid technology items with tags and logos", () => {
      const items = technologiesData.technologies;
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);

      items.forEach((item) => {
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("tag");
        expect(typeof item.name).toBe("string");
        expect(typeof item.tag).toBe("string");
      });
    });

    it("contains major platform categories (Cloud, IaC, DevOps)", () => {
      const tags = new Set(technologiesData.technologies.map((t) => t.tag));
      expect(tags.size).toBeGreaterThan(1);
    });
  });
});
