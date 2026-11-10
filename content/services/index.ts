import { facts } from "@/content/facts";
import { offers, type OfferSlug } from "@/lib/config/offers";

import { agentDevelopment } from "./agent-development";
import { aiEnablement } from "./ai-enablement";
import { aiEngineering } from "./ai-engineering";
import { answerEngine } from "./answer-engine";
import { catalogReadiness } from "./catalog-readiness";
import { fitCall } from "./fit-call";
import { fractionalSe } from "./fractional-se";
import { managedOps } from "./managed-ops";
import { opportunityAssessment } from "./opportunity-assessment";
import { pilotSprint } from "./pilot-sprint";
import { pilotTriage } from "./pilot-triage";
import { safeStart } from "./safe-start";
import { serviceContentSchema, type ServiceContent } from "./types";

const list: ServiceContent[] = [
  aiEngineering,
  agentDevelopment,
  aiEnablement,
  fitCall,
  safeStart,
  opportunityAssessment,
  pilotSprint,
  pilotTriage,
  answerEngine,
  catalogReadiness,
  managedOps,
  fractionalSe,
];

const proofIds = new Set<string>(facts.proofPoints.map((p) => p.id));
const offerSlugs = new Set<string>(offers.map((o) => o.slug));

for (const item of list) {
  serviceContentSchema.parse(item);
  for (const id of item.proof) {
    if (!proofIds.has(id)) throw new Error(`${item.slug}: unknown proof point ${id}`);
  }
  for (const slug of [item.slug, ...item.related]) {
    if (!offerSlugs.has(slug)) throw new Error(`${item.slug}: unknown offer ${slug}`);
  }
}

export const services: readonly ServiceContent[] = list;

export function getService(slug: OfferSlug): ServiceContent | undefined {
  return services.find((s) => s.slug === slug);
}
