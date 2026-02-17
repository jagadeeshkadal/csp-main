import { Megaphone } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="h-full overflow-y-auto p-6 bg-background">
      {/* Dashboard Title */}
      <h1 className="text-3xl font-bold mb-6">Corporate Simulation Program</h1>

      {/* Important Announcement Banner */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 mb-8 flex flex-col md:flex-row items-start gap-4 shadow-sm">
        <Megaphone className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm text-secondary font-semibold uppercase tracking-wider">Latest Announcement</p>
            <h3 className="text-xl font-bold text-foreground mt-1">Mokobara – SEA Expansion</h3>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            This case study explores Mokobara’s strategic expansion into Southeast Asian markets, focusing on optimizing sourcing, pricing, logistics, and marketplace strategy to achieve profitable international growth.
          </p>
        </div>
      </div>

      {/* Case Study Content - Full Width & Justified */}
      <div className="prose dark:prose-invert w-full max-w-none text-foreground text-base leading-relaxed text-justify">
        <p>
          Mokobara, a design-led D2C travel and lifestyle brand, is preparing to expand its operations into
          Southeast Asia, starting with Malaysia and Singapore. While the brand has strong product–market fit
          in India, entering new international markets introduces complex, interdependent challenges across
          product strategy, operations, marketing, finance, and go-to-market execution.
        </p>

        <p>
          The leadership team must determine how to sequence market entry, scale operations sustainably,
          and protect margins, while ensuring a consistent brand experience across channels and geographies.
          Decisions taken by one function—such as product assortment, vendor selection, pricing, inventory
          levels, or marketplace participation—have cascading effects on other teams.
        </p>

        <p>
          At the same time, the company must operate under real-world constraints: limited data, uncertain
          demand, regulatory and customs risks, logistics dependencies, platform power asymmetry, and
          unexpected operational disruptions. Teams are required to collaborate, make trade-offs, and
          respond to crises in real time, balancing growth ambition with operational discipline.
        </p>

        <p>
          The core challenge is not simply to launch in new markets, but to build a scalable, resilient operating
          model that aligns strategy, execution, and financial outcomes—while navigating ambiguity, cross-
          functional dependencies, and external shocks.
        </p>

        <p>
          Students participating in this simulation step into the role of Mokobara’s extended leadership team,
          responsible for making integrated decisions, defending their rationale, and owning the
          consequences of those decisions across the full business lifecycle.
        </p>
      </div>
    </div>
  );
}
