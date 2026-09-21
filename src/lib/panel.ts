import { ACCENT_KEYS, type AccentKey } from "@/components/BusPanel";
import { STOP_ID_RE } from "@/lib/bus";

export type PanelConfig = {
  stopId: string;
  serviceNos: string[];
  title: string;
  accent?: AccentKey | undefined;
};

const SERVICE_RE = /^[A-Za-z0-9]{1,5}$/;
const MAX_SERVICES = 12;

/** Panel format: "stopId:svc1,svc2[:accent]" e.g. "14141:100:cyan" */
export function parsePanel(raw: string): PanelConfig | null {
  if (typeof raw !== "string" || raw.length > 120) return null;
  const [stopId, services, accent] = raw.split(":");
  if (!stopId || !STOP_ID_RE.test(stopId)) return null;

  const serviceNos = Array.from(
    new Set(
      (services ?? "")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => SERVICE_RE.test(s)),
    ),
  ).slice(0, MAX_SERVICES);
  if (serviceNos.length === 0) return null;

  return {
    stopId,
    serviceNos,
    title: serviceNos.length === 1 ? `Bus ${serviceNos[0]}` : `Bus ${serviceNos.join(" & ")}`,
    accent: ACCENT_KEYS.includes(accent as AccentKey) ? (accent as AccentKey) : undefined,
  };
}

export function serializePanel(stopId: string, serviceNos: string[], accent: AccentKey): string {
  return `${stopId}:${serviceNos.join(",")}:${accent}`;
}
