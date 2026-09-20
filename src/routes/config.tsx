import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { fetchArrivals } from "@/lib/bus";
import { ACCENT_KEYS, ACCENT_SWATCH, type AccentKey } from "@/components/BusPanel";
import { cn } from "@/lib/utils";

const panelSchema = fallback(z.string(), "").default("");

const searchSchema = z.object({
  a: panelSchema,
  b: panelSchema,
});

type Slot = "a" | "b";

const ACCENT_LABELS: Record<AccentKey, string> = {
  cyan: "Blue",
  amber: "Orange",
  green: "Green",
  rose: "Pink",
};

export const Route = createFileRoute("/config")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Choose Your Buses — SG Bus Timings" },
      {
        name: "description",
        content: "Pick a bus stop, choose your buses and a panel colour, then update your live bus timings page.",
      },
      { property: "og:title", content: "Choose Your Buses — SG Bus Timings" },
      {
        property: "og:description",
        content: "Pick a bus stop, choose your buses and a panel colour, then update your live bus timings page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const { a, b } = Route.useSearch();
  const navigate = useNavigate();

  const [slot, setSlot] = useState<Slot>("a");
  const [stopId, setStopId] = useState("");
  const [services, setServices] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [accent, setAccent] = useState<AccentKey>("cyan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopValid = /^\d{5}$/.test(stopId);
  const canUpdate = stopValid && selected.size > 0;

  async function loadBuses() {
    if (!stopValid) return;
    setLoading(true);
    setError(null);
    setServices(null);
    setSelected(new Set());
    try {
      const data = await fetchArrivals(stopId);
      const nos = data.map((s) => s.no);
      if (nos.length === 0) {
        setError("No buses found at that stop. Check the 5-digit code on the bus stop sign.");
      }
      setServices(nos);
    } catch {
      setError("Couldn't reach the bus stop. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleService(no: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
  }

  function update() {
    const value = `${stopId}:${[...selected].join(",")}:${accent}`;
    navigate({
      to: "/",
      search: slot === "a" ? { a: value, b } : { a, b: value },
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-4 pb-10">
      <header className="pt-2 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Choose your buses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a stop, tap your buses, then press Update.
        </p>
      </header>

      {/* 1. Which panel */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          1 · Which panel?
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(["a", "b"] as Slot[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSlot(s);
                setAccent(s === "a" ? "cyan" : "amber");
              }}
              className={cn(
                "rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors",
                slot === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              {s === "a" ? "Left panel" : "Right panel"}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Bus stop */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          2 · Bus stop code
        </h2>
        <div className="flex gap-2">
          <input
            value={stopId}
            onChange={(e) => setStopId(e.target.value.replace(/\D/g, "").slice(0, 5))}
            inputMode="numeric"
            placeholder="e.g. 69099"
            className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-card px-4 py-3 text-lg font-bold tabular-nums tracking-widest outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={loadBuses}
            disabled={!stopValid || loading}
            className="shrink-0 rounded-2xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground disabled:opacity-40"
          >
            {loading ? "Loading…" : "Show buses"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          The 5-digit code is printed on every bus stop sign in Singapore.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </section>

      {/* 3. Buses */}
      {services && services.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            3 · Tap your buses
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {services.map((no) => (
              <button
                key={no}
                type="button"
                onClick={() => toggleService(no)}
                className={cn(
                  "rounded-2xl border-2 px-2 py-3 text-lg font-black tabular-nums transition-colors",
                  selected.has(no)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground",
                )}
              >
                {no}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. Colour */}
      {services && services.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            4 · Panel colour
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {ACCENT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setAccent(key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-colors",
                  accent === key ? "border-foreground" : "border-border",
                )}
              >
                <span className={cn("h-6 w-6 rounded-full", ACCENT_SWATCH[key])} />
                <span className="text-xs font-bold">{ACCENT_LABELS[key]}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <button
          type="button"
          onClick={update}
          disabled={!canUpdate}
          className="w-full rounded-full bg-primary px-6 py-4 text-base font-black text-primary-foreground disabled:opacity-40"
        >
          Update
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Tip: after updating, bookmark the page in your browser to save this setup.
        </p>
        <div className="flex items-center justify-center gap-6">
          <Link
            to="/"
            search={{ a, b }}
            className="text-center text-sm font-medium text-muted-foreground underline underline-offset-4"
          >
            Cancel and go back
          </Link>
          <Link
            to="/about"
            className="text-center text-sm font-medium text-muted-foreground underline underline-offset-4"
          >
            About
          </Link>
        </div>
      </div>
    </main>
  );
}
