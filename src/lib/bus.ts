export type BusArrival = {
  time: string;
  duration_ms: number;
  load?: string;
};

export type BusService = {
  no: string;
  next?: BusArrival;
  next2?: BusArrival;
  next3?: BusArrival;
};

export async function fetchArrivals(stopId: string): Promise<BusService[]> {
  const res = await fetch(`https://arrivelah2.busrouter.sg/?id=${stopId}`);
  if (!res.ok) throw new Error("Failed to load arrivals");
  const json = (await res.json()) as { services: BusService[] };
  return json.services ?? [];
}

export function minutesUntil(isoTime?: string): number | null {
  if (!isoTime) return null;
  const ms = new Date(isoTime).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.round(ms / 60000));
}
