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

export function BusPanel({
  stopId,
  serviceNos,
  title,
}: {
  stopId: string;
  serviceNos: string[];
  title: string;
}) {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["arrivals", stopId],
    queryFn: () => fetchArrivals(stopId),
    refetchInterval: 15000,
  });

  const services = (data ?? []).filter((s) => serviceNos.includes(s.no));

  return (
    <section className="flex flex-1 flex-col gap-3 rounded-3xl border border-border bg-card p-4">
      <header className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">Stop {stopId}</p>
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
