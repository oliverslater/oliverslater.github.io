import { useState } from "react";

const CategoryIcons: Record<string, React.ReactNode> = {
  "Enterprise Cloud Architecture": (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--sec)]">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  "Infrastructure as Code & CI/CD": (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--sec)]">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  "Serverless & High-Volume Data": (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--sec)]">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  "DevSecOps & Well-Architected": (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--sec)]">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

const pillars = {
  "Enterprise Cloud Architecture": [
    "AWS Golden Jacket Holder with 11 AWS Certifications",
    "Microsoft Azure Solutions Architect Expert (AZ-104, AZ-305)",
    "Enterprise Landing Zones, Multi-Account & Networking",
    "Large-Scale Cloud Migration Strategy (MGN, DMS, MAP)",
  ],
  "Infrastructure as Code & CI/CD": [
    "HashiCorp Certified Terraform Authoring & Operations Professional",
    "AWS CloudFormation and AWS CDK Production Frameworks",
    "Enterprise Pipeline Migrations (GitLab to GitHub Actions)",
    "Automated Testing, Deployment Gating & Module Reusability",
  ],
  "Serverless & High-Volume Data": [
    "Architect of Serverless Healthcare Ingestion on Lambda & S3",
    "DynamoDB Data Architect: Single-Table & NoSQL Optimization",
    "Event-Driven Message Bus Designs (SQS, SNS, EventBridge)",
    "High-Availability Low-Latency UK Healthcare Platforms",
  ],
  "DevSecOps & Well-Architected": [
    "AWS Well-Architected Framework Reviews across all 5 Pillars",
    "Continuous Cloud Cost Optimisation, Right-Sizing & Lifecycle Policies",
    "Healthcare Platform Security: Inspector, GuardDuty, Security Hub",
    "Technical Mentorship & Practice-Wide Certification Coaching",
  ],
};

const SkillsList = () => {
  const [openItem, setOpenItem] = useState<string | null>("Enterprise Cloud Architecture");

  const toggleItem = (item: string) => {
    setOpenItem(openItem === item ? null : item);
  };

  return (
    <div className="text-left w-full">
      <p className="text-sm font-medium text-[var(--sec)] shiny-sec mb-1">
        Architecture Capabilities
      </p>
      <h3 className="text-[var(--white)] text-3xl md:text-4xl font-semibold mb-6">
        What I Deliver
      </h3>

      <ul className="space-y-3 w-full">
        {Object.entries(pillars).map(([category, items]) => {
          const isOpen = openItem === category;
          return (
            <li key={category} className="w-full">
              <div
                onClick={() => toggleItem(category)}
                className="w-full bg-white dark:bg-[#1414149c] rounded-2xl text-left transition-all border border-neutral-200/80 dark:border-[var(--white-icon-tr)] hover:border-neutral-300 dark:hover:border-[#ffffff20] cursor-pointer overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3 p-4">
                  {CategoryIcons[category]}
                  <span className="flex-grow text-[var(--white)] text-base sm:text-lg font-medium">
                    {category}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-[var(--sec)] transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {isOpen && (
                  <div className="px-5 pb-4 pt-1 border-t border-[var(--white-icon-tr)] text-sm text-[var(--white-icon)]">
                    <ul className="space-y-2">
                      {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--sec)] font-mono text-xs mt-0.5">&bull;</span>
                          <span className="text-xs sm:text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SkillsList;
