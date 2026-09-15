import { createFileRoute } from "@tanstack/react-router";
import { BusPanel } from "@/components/BusPanel";

export const Route = createFileRoute("/")({
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
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4 md:flex-row">
      <BusPanel stopId="69099" serviceNos={["148"]} title="Bus 148" accent="cyan" />
      <BusPanel stopId="61121" serviceNos={["104", "148"]} title="Bus 104 & 148" accent="amber" />
    </main>
  );
}
