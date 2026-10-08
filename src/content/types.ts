/**
 * The content model. Every page, every machine-readable file and every test
 * derives from the records typed here. Nothing on the site states a research
 * claim that is not one of these records.
 */

export type EvidenceStatus =
  | "OBSERVED"
  | "IMPLEMENTED"
  | "TESTED"
  | "REPRODUCED"
  | "PROPOSED"
  | "HYPOTHESIS"
  | "OPEN";

/** The three-state grouping used throughout the site. */
export type Tier = "demonstrated" | "proposed" | "open";

export interface Repository {
  id: string;
  /** owner/name on GitHub */
  slug: string;
  url: string;
  /** commit the description on this site was written against */
  commit: string;
  visibility: "public";
}

export interface EvidenceRecord {
  id: string;
  title: string;
  status: EvidenceStatus;
  /** who or what produced the evidence */
  observer: string;
  date: string;
  repository?: string;
  commit?: string;
  command?: string;
  environment?: string;
  result: string;
  /** what this evidence does NOT show */
  caveat?: string;
}

export interface Claim {
  id: string;
  node: string;
  statement: string;
  status: EvidenceStatus;
  evidence: string[];
}

export interface DocumentRef {
  label: string;
  path: string;
}

export interface ResearchNode {
  id: string;
  name: string;
  /** a one-line definition */
  line: string;
  kind: "thesis" | "protocol" | "instrument" | "surface" | "notebook";
  repository?: string;
  /** the machine representation shown beside the human heading */
  substrate: string[];
  what: string;
  why: string;
  implementation: string[];
  demonstrated: string[];
  proposed: string[];
  open: string[];
  limitations: string[];
  documents: DocumentRef[];
  experiments: string[];
  researchQuestion: string;
  /** coordinates on the constellation, 0..100 */
  position: { x: number; y: number };
}

export interface Relation {
  from: string;
  to: string;
  label: string;
  /** where in a repository the relation is stated */
  source: string;
}

export interface Experiment {
  id: string;
  name: string;
  question: string;
  status: EvidenceStatus;
  /** what a visitor or agent may run */
  permitted: string[];
  forbidden: string[];
  entry: string;
  evidence: string[];
  reproduce: string;
}

export interface CareerItem {
  period?: string;
  role: string;
  organisation: string;
  detail: string;
}
