import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { BusPanel, type AccentKey } from "@/components/BusPanel";
import { parsePanel, type PanelConfig } from "@/lib/panel";

const panelSchema = fallback(z.string(), "").default("");

const searchSchema = z.object({
  a: panelSchema,
  b: panelSchema,
});

const DEFAULTS: [PanelConfig, PanelConfig] = [
  { stopId: "69099", serviceNos: ["148"], title: "Bus 148" },
  { stopId: "61121", serviceNos: ["104", "148"], title: "Bus 104 & 148" },
];

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Bus Timings — SG Arrivals" },
      {
        name: "description",
        content:
          "Live Singapore bus arrivals for your regular stops, with flashing alerts when it's time to leave.",
      },
      { property: "og:title", content: "Bus Timings — SG Arrivals" },
      {
        property: "og:description",
        content:
          "Live Singapore bus arrivals for your regular stops, with flashing alerts when it's time to leave.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { a, b } = Route.useSearch();

  const panels: Array<{ config: PanelConfig; accent: AccentKey }> = [];
  const left = parsePanel(a) ?? (a ? null : DEFAULTS[0]);
  const right = parsePanel(b) ?? (b ? null : DEFAULTS[1]);
  if (left) panels.push({ config: left, accent: left.accent ?? "cyan" });
  if (right) panels.push({ config: right, accent: right.accent ?? "amber" });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-col gap-4 md:flex-row">
        {panels.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Add panels via the URL, e.g. <code>?a=69099:148&b=61121:104,148</code>
          </p>
        )}
        {panels.map(({ config, accent }) => (
          <BusPanel
            key={`${config.stopId}-${config.serviceNos.join(",")}`}
            stopId={config.stopId}
            serviceNos={config.serviceNos}
            title={config.title}
            accent={accent}
          />
        ))}
      </div>
      <div className="pb-4 pt-2 text-center">
        <Link
          to="/config"
          search={{ a, b }}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          Change stops &amp; buses
        </Link>
      </div>
    </main>
  );
}
