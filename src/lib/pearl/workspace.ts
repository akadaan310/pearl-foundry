/**
 * Pearl Workspace: a browser-local library of typed records.
 *
 * Everything here is pure data and pure functions. Persistence goes through
 * WorkspaceRepository: today a localStorage adapter (local-repository.ts);
 * later a server-backed adapter with the same interface (see
 * docs/architecture/FUTURE_PERSISTENCE.md). Nothing here is a cloud account.
 */

import { parseExperience } from "../experience";
import { pearlDigest, idFromDigest, toPearl, type Pearl } from "./model";
import { pearlQuery } from "./serialize";
import { RESEARCH_IDS } from "./resolve";

export const WORKSPACE_SCHEMA = "pearl-workspace/1" as const;
export const EXPORT_FORMAT = "pearl-export" as const;
export const EXPORT_VERSION = 1;

export interface PearlRecord {
  id: string;
  digest: string;
  pearl: Pearl;
  name: string;                 // a local name; does not change the Pearl or its id
  tags: string[];
  pinned: boolean;
  spaceId: string;
  projectId: string | null;
  source: "pasted" | "opened" | "imported" | "edited";
  origin: string;               // where it came from, e.g. "aanebed.vercel.app/e", "pasted text"
  derivedFrom: string | null;   // id of the Pearl this one updates, if any (versions stay distinct)
  savedAt: string;
  modifiedAt: string;
}
export interface Space { id: string; name: string; createdAt: string }
export interface Project { id: string; name: string; description: string; spaceId: string; createdAt: string; modifiedAt: string }
export interface Note { id: string; target: { kind: "pearl" | "project"; id: string }; text: string; createdAt: string }
export interface Task { id: string; text: string; done: boolean; projectId: string | null; pearlId: string | null; source: "manual" | "pearl"; createdAt: string }

export interface Workspace {
  schema: typeof WORKSPACE_SCHEMA;
  pearls: PearlRecord[];
  spaces: Space[];
  projects: Project[];
  notes: Note[];
  tasks: Task[];
}

/** The persistence boundary. A future server adapter implements the same two methods per user. */
export interface WorkspaceRepository {
  readonly kind: "browser-local" | "server";
  load(): Workspace;
  save(ws: Workspace): void;
}

const now = () => new Date().toISOString();
export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export const DEFAULT_SPACES = ["Personal", "Research", "Projects", "Workflows", "Archive"];

export function emptyWorkspace(): Workspace {
  const t = now();
  return { schema: WORKSPACE_SCHEMA, pearls: [], spaces: DEFAULT_SPACES.map((name) => ({ id: "s_" + name.toLowerCase(), name, createdAt: t })), projects: [], notes: [], tasks: [] };
}

// ------------------------------------------------------------- Pearls

export function addPearl(ws: Workspace, pearl: Pearl, opts: { source: PearlRecord["source"]; origin: string; spaceId?: string; derivedFrom?: string | null }): { ws: Workspace; record: PearlRecord; duplicate: boolean } {
  const digest = pearlDigest(pearl);
  const existing = ws.pearls.find((p) => p.digest === digest);
  if (existing) return { ws, record: existing, duplicate: true };
  const t = now();
  const record: PearlRecord = {
    id: idFromDigest(digest), digest, pearl, name: pearl.title, tags: [], pinned: false,
    spaceId: opts.spaceId && ws.spaces.some((s) => s.id === opts.spaceId) ? opts.spaceId : ws.spaces[0]?.id ?? "s_personal",
    projectId: null, source: opts.source, origin: opts.origin, derivedFrom: opts.derivedFrom ?? null, savedAt: t, modifiedAt: t,
  };
  // Open threads and next actions a Pearl declares become tasks, linked back to it.
  const tasks: Task[] = pearl.blocks.flatMap((b) => (b.type === "c" && (b.kind === "thread" || b.kind === "action")
    ? [{ id: uid("t"), text: b.text, done: false, projectId: null, pearlId: record.id, source: "pearl" as const, createdAt: t }] : []));
  return { ws: { ...ws, pearls: [record, ...ws.pearls], tasks: [...ws.tasks, ...tasks] }, record, duplicate: false };
}

export function updatePearlMeta(ws: Workspace, id: string, patch: Partial<Pick<PearlRecord, "name" | "tags" | "pinned" | "spaceId" | "projectId">>): Workspace {
  return { ...ws, pearls: ws.pearls.map((p) => (p.id === id ? { ...p, ...patch, tags: (patch.tags ?? p.tags).map((t) => t.trim()).filter(Boolean).slice(0, 12), modifiedAt: now() } : p)) };
}

export function removePearl(ws: Workspace, id: string): Workspace {
  return { ...ws, pearls: ws.pearls.filter((p) => p.id !== id), notes: ws.notes.filter((n) => !(n.target.kind === "pearl" && n.target.id === id)), tasks: ws.tasks.filter((t) => t.pearlId !== id || t.source === "manual") };
}

// ------------------------------------------------------------- spaces

export function createSpace(ws: Workspace, name: string): Workspace {
  const n = name.trim().slice(0, 40);
  if (!n || ws.spaces.some((s) => s.name.toLowerCase() === n.toLowerCase())) return ws;
  return { ...ws, spaces: [...ws.spaces, { id: uid("s"), name: n, createdAt: now() }] };
}
export function renameSpace(ws: Workspace, id: string, name: string): Workspace {
  const n = name.trim().slice(0, 40);
  if (!n) return ws;
  return { ...ws, spaces: ws.spaces.map((s) => (s.id === id ? { ...s, name: n } : s)) };
}
/** Deleting a space never deletes its contents: they move to Archive (or the first remaining space). */
export function deleteSpace(ws: Workspace, id: string): { ws: Workspace; moved: number; to: string } {
  const rest = ws.spaces.filter((s) => s.id !== id);
  if (!rest.length) return { ws, moved: 0, to: "" };
  const to = rest.find((s) => s.name === "Archive") ?? rest[0];
  const moved = ws.pearls.filter((p) => p.spaceId === id).length + ws.projects.filter((p) => p.spaceId === id).length;
  return {
    ws: { ...ws, spaces: rest, pearls: ws.pearls.map((p) => (p.spaceId === id ? { ...p, spaceId: to.id } : p)), projects: ws.projects.map((p) => (p.spaceId === id ? { ...p, spaceId: to.id } : p)) },
    moved, to: to.name,
  };
}

// ------------------------------------------------------------- projects, notes, tasks

export function createProject(ws: Workspace, name: string, description = "", spaceId?: string): Workspace {
  const n = name.trim().slice(0, 80);
  if (!n) return ws;
  const t = now();
  return { ...ws, projects: [...ws.projects, { id: uid("pr"), name: n, description: description.slice(0, 500), spaceId: spaceId ?? ws.spaces.find((s) => s.name === "Projects")?.id ?? ws.spaces[0].id, createdAt: t, modifiedAt: t }] };
}
export function removeProject(ws: Workspace, id: string): Workspace {
  return { ...ws, projects: ws.projects.filter((p) => p.id !== id), pearls: ws.pearls.map((p) => (p.projectId === id ? { ...p, projectId: null } : p)), tasks: ws.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)), notes: ws.notes.filter((n) => !(n.target.kind === "project" && n.target.id === id)) };
}
export function addNote(ws: Workspace, target: Note["target"], text: string): Workspace {
  const v = text.trim().slice(0, 2000);
  return v ? { ...ws, notes: [...ws.notes, { id: uid("n"), target, text: v, createdAt: now() }] } : ws;
}
export function addTask(ws: Workspace, text: string, projectId: string | null = null): Workspace {
  const v = text.trim().slice(0, 300);
  return v ? { ...ws, tasks: [...ws.tasks, { id: uid("t"), text: v, done: false, projectId, pearlId: null, source: "manual", createdAt: now() }] } : ws;
}
export function toggleTask(ws: Workspace, id: string): Workspace {
  return { ...ws, tasks: ws.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
}

// ------------------------------------------------------------- export / import

export interface ExportDoc {
  format: typeof EXPORT_FORMAT;
  version: number;
  exported_at: string;
  scope: "workspace" | "space" | "project";
  note: string;
  pearls: PearlRecord[];
  spaces: Space[];
  projects: Project[];
  notes: Note[];
  tasks: Task[];
}

export function exportWorkspace(ws: Workspace, scope: ExportDoc["scope"] = "workspace", filter?: { spaceId?: string; projectId?: string }): ExportDoc {
  let pearls = ws.pearls, spaces = ws.spaces, projects = ws.projects;
  if (filter?.spaceId) { pearls = pearls.filter((p) => p.spaceId === filter.spaceId); spaces = spaces.filter((s) => s.id === filter.spaceId); projects = projects.filter((p) => p.spaceId === filter.spaceId); }
  if (filter?.projectId) { pearls = pearls.filter((p) => p.projectId === filter.projectId); projects = projects.filter((p) => p.id === filter.projectId); spaces = spaces.filter((s) => projects.some((p) => p.spaceId === s.id) || pearls.some((p) => p.spaceId === s.id)); }
  const ids = new Set([...pearls.map((p) => p.id), ...projects.map((p) => p.id)]);
  return {
    format: EXPORT_FORMAT, version: EXPORT_VERSION, exported_at: now(), scope,
    note: "A Pearl library exported from a browser. Each Pearl's id and digest are recomputed on import; content that does not match is rejected.",
    pearls, spaces, projects,
    notes: ws.notes.filter((n) => ids.has(n.target.id)),
    tasks: ws.tasks.filter((t) => (t.projectId && ids.has(t.projectId)) || (t.pearlId && ids.has(t.pearlId)) || (!filter && !t.projectId && !t.pearlId)),
  };
}

/** Re-validate a Pearl from scratch: serialise, parse with the one parser, recompute digest and id. */
export function revalidate(p: unknown): { pearl: Pearl; digest: string; id: string } | { error: string } {
  if (!p || typeof p !== "object" || (p as Pearl).format !== "pearl/1" || !Array.isArray((p as Pearl).blocks)) return { error: "not a pearl/1 record" };
  try {
    const r = parseExperience(pearlQuery(p as Pearl), new Set(RESEARCH_IDS));
    if (r.errors.length) return { error: r.errors.join("; ") };
    const pearl = toPearl(r.doc);
    const digest = pearlDigest(pearl);
    return { pearl, digest, id: idFromDigest(digest) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export interface ImportPlan {
  ok: boolean;
  errors: string[];
  add: PearlRecord[];
  duplicates: string[];          // same content already in the library
  conflicts: { id: string; reason: string }[];
  rejected: { id: string; reason: string }[];
  spaces: Space[];
  projects: Project[];
  notes: Note[];
  tasks: Task[];
}

export function planImport(ws: Workspace, json: string): ImportPlan {
  const plan: ImportPlan = { ok: false, errors: [], add: [], duplicates: [], conflicts: [], rejected: [], spaces: [], projects: [], notes: [], tasks: [] };
  let doc: ExportDoc;
  try { doc = JSON.parse(json); } catch { plan.errors.push("The file is not JSON."); return plan; }
  if (doc?.format !== EXPORT_FORMAT) { plan.errors.push("This is not a Pearl export (format must be \"pearl-export\")."); return plan; }
  if (typeof doc.version !== "number" || Math.floor(doc.version) !== EXPORT_VERSION) { plan.errors.push(`Unsupported export version ${String(doc.version)}; this site reads version ${EXPORT_VERSION}.`); return plan; }
  if (!Array.isArray(doc.pearls)) { plan.errors.push("The export has no pearls array."); return plan; }
  if (doc.pearls.length > 5000) { plan.errors.push("Too many Pearls in one import (limit 5,000)."); return plan; }

  const byDigest = new Map(ws.pearls.map((p) => [p.digest, p]));
  const byId = new Map(ws.pearls.map((p) => [p.id, p]));
  const seen = new Set<string>();
  for (const rec of doc.pearls) {
    const v = revalidate(rec?.pearl);
    const claimed = typeof rec?.id === "string" ? rec.id : "(no id)";
    if ("error" in v) { plan.rejected.push({ id: claimed, reason: v.error }); continue; }
    if (rec.digest !== v.digest || rec.id !== v.id) { plan.rejected.push({ id: claimed, reason: "its content does not hash to its id: corrupted or edited" }); continue; }
    if (seen.has(v.digest)) { plan.duplicates.push(v.id); continue; }
    seen.add(v.digest);
    if (byDigest.has(v.digest)) { plan.duplicates.push(v.id); continue; }
    if (byId.has(v.id)) { plan.conflicts.push({ id: v.id, reason: "same short id, different content (an 80-bit prefix collision): not imported" }); continue; }
    plan.add.push({
      id: v.id, digest: v.digest, pearl: v.pearl,
      name: typeof rec.name === "string" ? rec.name.slice(0, 140) : v.pearl.title,
      tags: Array.isArray(rec.tags) ? rec.tags.filter((t: unknown) => typeof t === "string").slice(0, 12) : [],
      pinned: rec.pinned === true,
      spaceId: typeof rec.spaceId === "string" ? rec.spaceId : ws.spaces[0].id,
      projectId: typeof rec.projectId === "string" ? rec.projectId : null,
      source: "imported", origin: typeof rec.origin === "string" ? rec.origin.slice(0, 120) : "import",
      derivedFrom: typeof rec.derivedFrom === "string" ? rec.derivedFrom : null,
      savedAt: typeof rec.savedAt === "string" ? rec.savedAt : now(), modifiedAt: now(),
    });
  }
  const spaceIds = new Set(ws.spaces.map((s) => s.id));
  plan.spaces = (Array.isArray(doc.spaces) ? doc.spaces : []).filter((s) => s && typeof s.id === "string" && typeof s.name === "string" && !spaceIds.has(s.id)).map((s) => ({ id: s.id, name: s.name.slice(0, 40), createdAt: s.createdAt ?? now() }));
  const projIds = new Set(ws.projects.map((p) => p.id));
  plan.projects = (Array.isArray(doc.projects) ? doc.projects : []).filter((p) => p && typeof p.id === "string" && typeof p.name === "string" && !projIds.has(p.id)).map((p) => ({ id: p.id, name: p.name.slice(0, 80), description: String(p.description ?? "").slice(0, 500), spaceId: String(p.spaceId ?? ws.spaces[0].id), createdAt: p.createdAt ?? now(), modifiedAt: now() }));
  const noteIds = new Set(ws.notes.map((n) => n.id));
  plan.notes = (Array.isArray(doc.notes) ? doc.notes : []).filter((n) => n && typeof n.id === "string" && !noteIds.has(n.id) && typeof n.text === "string" && n.target && (n.target.kind === "pearl" || n.target.kind === "project"));
  const taskIds = new Set(ws.tasks.map((t) => t.id));
  plan.tasks = (Array.isArray(doc.tasks) ? doc.tasks : []).filter((t) => t && typeof t.id === "string" && !taskIds.has(t.id) && typeof t.text === "string");
  plan.ok = plan.errors.length === 0;
  return plan;
}

/** Apply a confirmed plan in one step: the returned workspace is written once. */
export function applyImport(ws: Workspace, plan: ImportPlan): Workspace {
  if (!plan.ok) return ws;
  const spaces = [...ws.spaces, ...plan.spaces];
  const spaceIds = new Set(spaces.map((s) => s.id));
  const fallback = spaces[0].id;
  return {
    ...ws,
    spaces,
    projects: [...ws.projects, ...plan.projects.map((p) => ({ ...p, spaceId: spaceIds.has(p.spaceId) ? p.spaceId : fallback }))],
    pearls: [...plan.add.map((p) => ({ ...p, spaceId: spaceIds.has(p.spaceId) ? p.spaceId : fallback })), ...ws.pearls],
    notes: [...ws.notes, ...plan.notes],
    tasks: [...ws.tasks, ...plan.tasks],
  };
}

/** Accept only well-formed workspace data; anything else is reported, never silently trusted. */
export function coerceWorkspace(v: unknown): Workspace | null {
  const w = v as Workspace;
  if (!w || w.schema !== WORKSPACE_SCHEMA || !Array.isArray(w.pearls) || !Array.isArray(w.spaces) || !w.spaces.length) return null;
  return { schema: WORKSPACE_SCHEMA, pearls: w.pearls, spaces: w.spaces, projects: Array.isArray(w.projects) ? w.projects : [], notes: Array.isArray(w.notes) ? w.notes : [], tasks: Array.isArray(w.tasks) ? w.tasks : [] };
}
