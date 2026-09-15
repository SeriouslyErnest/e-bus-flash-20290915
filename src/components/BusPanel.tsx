import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchArrivals, minutesUntil, type BusService } from "@/lib/bus";
import { cn } from "@/lib/utils";

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ArrivalCell({ isoTime, primary }: { isoTime: string | undefined; primary?: boolean }) {
  useNow();
  const mins = minutesUntil(isoTime);

  if (mins === null) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/60 py-3">
        <span className="text-2xl font-bold text-muted-foreground">—</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">no data</span>
      </div>
    );
  }

  const state = mins < 3 ? "urgent" : mins < 5 ? "warn" : "ok";
  const label = mins === 0 ? "Arr" : `${mins}`;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl py-3 transition-colors",
        primary ? "min-h-24" : "min-h-20",
        state === "urgent" && "animate-flash-urgent",
        state === "warn" && "animate-flash-warn",
        state === "ok" && "bg-secondary",
      )}
    >
      <span className={cn("font-black leading-none tabular-nums", primary ? "text-4xl" : "text-3xl")}>
        {label}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider opacity-80">
        {mins === 0 ? "arriving" : "min"}
      </span>
    </div>
  );
}

function ServiceRow({ service }: { service: BusService }) {
  const arrivals = [service.next?.time, service.next2?.time, service.next3?.time];
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground">
        {service.no}
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
        {arrivals.map((t, i) => (
          <ArrivalCell key={i} isoTime={t} primary={i === 0} />
        ))}
      </div>
    </div>
  );
}

const ACCENTS = {
  cyan: {
    stripe: "bg-cyan-400",
    header: "text-cyan-300",
    glow: "shadow-[0_0_0_1px_oklch(0.75_0.15_200_/_0.4),inset_4px_0_0_0_oklch(0.75_0.15_200)]",
    tag: "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/40",
  },
  amber: {
    stripe: "bg-amber-400",
    header: "text-amber-300",
    glow: "shadow-[0_0_0_1px_oklch(0.8_0.16_75_/_0.4),inset_4px_0_0_0_oklch(0.8_0.16_75)]",
    tag: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40",
  },
} as const;

export type AccentKey = keyof typeof ACCENTS;

export function BusPanel({
  stopId,
  serviceNos,
  title,
  accent = "cyan",
}: {
  stopId: string;
  serviceNos: string[];
  title: string;
  accent?: AccentKey;
}) {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["arrivals", stopId],
    queryFn: () => fetchArrivals(stopId),
    refetchInterval: 15000,
  });

  const services = (data ?? []).filter((s) => serviceNos.includes(s.no));
  const a = ACCENTS[accent];

  return (
    <section className={cn("flex flex-col gap-3 self-start rounded-3xl bg-card p-4 md:flex-1 md:self-stretch w-full", a.glow)}>
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", a.tag)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", a.stripe)} />
            Stop {stopId}
          </span>
          <h2 className={cn("mt-1.5 truncate text-lg font-extrabold uppercase tracking-wide", a.header)}>
            {title}
          </h2>
        </div>
        {dataUpdatedAt > 0 && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {new Date(dataUpdatedAt).toLocaleTimeString("en-SG", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </header>

      {isLoading && (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading arrivals…</p>
      )}
      {isError && (
        <p className="py-8 text-center text-sm text-destructive">
          Couldn't load arrivals. Retrying…
        </p>
      )}
      {!isLoading && !isError && services.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No upcoming buses for {serviceNos.join(" / ")}.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {services.map((s) => (
          <ServiceRow key={s.no} service={s} />
        ))}
      </div>

      <p className="mt-auto text-[10px] text-muted-foreground">
        Yellow flash: under 5 min · Red flash: under 3 min — time to go!
      </p>
    </section>
  );
}
