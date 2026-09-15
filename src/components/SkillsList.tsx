import { useState } from "react";

export interface PillarItem {
  category: string;
  icon?: string;
  items: string[];
}

export interface SkillsListProps {
  pillars?: PillarItem[] | Record<string, string[]>;
}

function renderPillarIcon(category: string, iconKey?: string): React.ReactNode {
  const key = (iconKey || category).toLowerCase();

  if (
    key.includes("container") ||
    key.includes("modern") ||
    key.includes("box") ||
    key === "box"
  ) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--sec)]"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }

  if (
    key.includes("infra") ||
    key.includes("code") ||
    key.includes("pipeline") ||
    key === "code"
  ) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--sec)]"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }

  if (
    key.includes("serverless") ||
    key.includes("data") ||
    key.includes("zap") ||
    key === "zap"
  ) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--sec)]"
      >
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }

  if (
    key.includes("devsecops") ||
    key.includes("security") ||
    key.includes("well-architected") ||
    key === "shield"
  ) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--sec)]"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }

  // Default: Cloud
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--sec)]"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

const SkillsList = ({ pillars }: SkillsListProps) => {
  const normalizedPillars: PillarItem[] = Array.isArray(pillars)
    ? pillars
    : pillars && typeof pillars === "object"
      ? Object.entries(pillars).map(([category, items]) => ({
          category,
          items,
        }))
      : [];

  const [openItem, setOpenItem] = useState<string | null>(
    normalizedPillars[0]?.category || null,
  );

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
        {normalizedPillars.map((pillar) => {
          const isOpen = openItem === pillar.category;
          return (
            <li key={pillar.category} className="w-full">
              <div
                onClick={() => toggleItem(pillar.category)}
                className="w-full bg-white dark:bg-[#1414149c] rounded-2xl text-left transition-all border border-neutral-200/80 dark:border-[var(--white-icon-tr)] hover:border-neutral-300 dark:hover:border-[#ffffff20] cursor-pointer overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3 p-4">
                  {renderPillarIcon(pillar.category, pillar.icon)}
                  <span className="flex-grow text-[var(--white)] text-base sm:text-lg font-medium">
                    {pillar.category}
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
                      {pillar.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--sec)] font-mono text-xs mt-0.5">
                            &bull;
                          </span>
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
