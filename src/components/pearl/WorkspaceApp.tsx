"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useWorkspace, download } from "./useWorkspace";
import { PearlGlyphClient } from "./PearlGlyphClient";
import { TYPE_INFO } from "@/lib/pearl/model";
import { PEARL_TYPES } from "@/lib/experience";
import { pearlUrl } from "@/lib/pearl/serialize";
import { encodePortable } from "@/lib/pearl/portable";
import {
  updatePearlMeta, removePearl, createSpace, renameSpace, deleteSpace, createProject, removeProject,
  addNote, addTask, toggleTask, exportWorkspace, planImport, applyImport, type PearlRecord, type ImportPlan,
} from "@/lib/pearl/workspace";

type Tab = "library" | "spaces" | "projects" | "tasks" | "backup";
const TABS: { id: Tab; label: string }[] = [
  { id: "library", label: "Library" },
  { id: "spaces", label: "Spaces" },
  { id: "projects", label: "Projects" },
  { id: "tasks", label: "Tasks" },
  { id: "backup", label: "Backup" },
];
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

async function linkFor(rec: PearlRecord) {
  const e = pearlUrl(rec.pearl);
  const p = (await encodePortable(rec.pearl)).url;
  return p.length < e.length ? p : e;
}

type Ctx = ReturnType<typeof useWorkspace> & { setFocus: (id: string | null) => void };
const WsCtx = createContext<Ctx | null>(null);
const useCtx = () => useContext(WsCtx)!;

export function WorkspaceApp() {
  const wsHook = useWorkspace();
  const { ws, ready, available, recovered, update } = wsHook;
  const [tab, setTab] = useState<Tab>("library");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [space, setSpace] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(location.search).get("pearl");
    if (p) setFocus(p);
    const h = location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);
  const go = (t: Tab) => { setTab(t); history.replaceState(null, "", "#" + t); };
  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 2500); };

  const pearls = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ws.pearls
      .filter((p) => !type || p.pearl.type === type)
      .filter((p) => !space || p.spaceId === space)
      .filter((p) => !term || [p.name, p.pearl.title, p.pearl.by ?? "", p.tags.join(" "), p.id, ...p.pearl.blocks.map((b) => JSON.stringify(b))].join(" ").toLowerCase().includes(term))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.modifiedAt.localeCompare(a.modifiedAt));
  }, [ws.pearls, q, type, space]);

  if (!ready) return <p className="py-10 text-ink-3">Reading this browser&apos;s library…</p>;
  if (!available) return <p className="py-10 text-refuse">This browser does not allow local storage for this site (private mode or blocked storage). Pearls can still be opened and copied, but not kept here.</p>;

  return (
    <WsCtx.Provider value={{ ...wsHook, setFocus }}>
    <div>
      {recovered && <p className="mb-6 border-l border-refuse/60 pl-4 text-[0.88rem] text-ink-2">Your stored library could not be read and was set aside under the key <code>{recovered}</code> instead of being deleted. An empty library has been started.</p>}
      <div role="tablist" aria-label="Workspace" className="mb-8 flex flex-wrap gap-1 border-b border-rule">
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} id={`tab-${t.id}`} onClick={() => go(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[0.92rem] ${tab === t.id ? "border-gold text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}>
            {t.label}{t.id === "library" ? ` · ${ws.pearls.length}` : t.id === "tasks" ? ` · ${ws.tasks.filter((x) => !x.done).length}` : ""}
          </button>
        ))}
      </div>
      {flash && <p role="status" className="mb-4 font-mono text-[0.8rem] text-emerald">{flash}</p>}

      {tab === "library" && (
        <section id="panel-library" role="tabpanel" aria-labelledby="tab-library">
          {ws.pearls.length === 0 ? (
            <div className="border border-dashed border-rule-strong p-8">
              <p className="font-serif text-2xl">Your Pearl library is empty.</p>
              <p className="measure mt-3 text-ink-2">A Pearl is a link your AI composes: a continuity checkpoint, a handoff, research, a workflow. Copy a prompt from the <Link href="/prompts">Prompt Laboratory</Link>, paste it into any AI, and bring the link it returns to <Link href="/#bring">Bring your Pearl</Link>. Keep it, and it appears here.</p>
              <p className="mt-3 text-[0.85rem] text-ink-3">The library lives in this browser only. Nothing is uploaded.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <label className="block"><span className="sr-only">Search Pearls</span><input className="field" placeholder="Search names, text, tags, ids" value={q} onChange={(e) => setQ(e.target.value)} /></label>
                <label className="block"><span className="sr-only">Filter by type</span>
                  <select className="field" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{PEARL_TYPES.map((t) => <option key={t} value={t}>{TYPE_INFO[t].label}</option>)}</select></label>
                <label className="block"><span className="sr-only">Filter by space</span>
                  <select className="field" value={space} onChange={(e) => setSpace(e.target.value)}><option value="">All spaces</option>{ws.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              </div>
              <ul className="space-y-3">
                {pearls.map((p) => <PearlRow key={p.id} rec={p} open={focus === p.id} onToggle={() => setFocus(focus === p.id ? null : p.id)} say={say} />)}
                {pearls.length === 0 && <li className="text-ink-3">No Pearls match.</li>}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === "spaces" && <Spaces say={say} />}
      {tab === "projects" && <Projects say={say} />}
      {tab === "tasks" && (
        <section id="panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
          <TaskList projectId={undefined} />
        </section>
      )}
      {tab === "backup" && <Backup say={say} />}
    </div>
    </WsCtx.Provider>
  );
}

  function PearlRow({ rec, open, onToggle, say }: { rec: PearlRecord; open: boolean; onToggle: () => void; say: (m: string) => void }) {
    const { ws, update, setFocus } = useCtx();
    void setFocus;
    const [name, setName] = useState(rec.name);
    const [tags, setTags] = useState(rec.tags.join(", "));
    const [note, setNote] = useState("");
    const notes = ws.notes.filter((n) => n.target.kind === "pearl" && n.target.id === rec.id);
    const parent = rec.derivedFrom ? ws.pearls.find((p) => p.id === rec.derivedFrom) : undefined;
    const children = ws.pearls.filter((p) => p.derivedFrom === rec.id);
    return (
      <li className={`border ${rec.pinned ? "border-gold/50" : "border-rule"} bg-panel`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <PearlGlyphClient />
          <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
            <span className="block truncate font-serif text-lg">{rec.name}</span>
            <span className="block font-mono text-[0.68rem] text-ink-3">{TYPE_INFO[rec.pearl.type].label} · {rec.id} · {ws.spaces.find((s) => s.id === rec.spaceId)?.name} · from {rec.origin} · modified {when(rec.modifiedAt)}</span>
          </button>
          <span className="border border-rule-strong px-1.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-2" title="Saved only in this browser.">Local</span>
          <span className="border border-gold/50 px-1.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-gold" title="Its content can be rebuilt into a self-contained link.">Portable</span>
          <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" aria-pressed={rec.pinned} onClick={() => update((w) => updatePearlMeta(w, rec.id, { pinned: !rec.pinned }))}>{rec.pinned ? "Unpin" : "Pin"}</button>
          <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={async () => { await navigator.clipboard.writeText(await linkFor(rec)).catch(() => {}); say("Pearl link copied."); }}>Copy link</button>
        </div>
        {open && (
          <div className="grid gap-6 border-t border-rule px-4 py-4 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="block"><span className="label">Local name</span>
                <span className="mt-1 flex gap-2"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /><button type="button" className="btn" onClick={() => { update((w) => updatePearlMeta(w, rec.id, { name: name.slice(0, 140) || rec.pearl.title })); say("Renamed (locally; the Pearl and its id are unchanged)."); }}>Rename</button></span></label>
              <label className="block"><span className="label">Tags, comma separated</span>
                <span className="mt-1 flex gap-2"><input className="field" value={tags} onChange={(e) => setTags(e.target.value)} /><button type="button" className="btn" onClick={() => update((w) => updatePearlMeta(w, rec.id, { tags: tags.split(",") }))}>Save tags</button></span></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block"><span className="label">Space</span>
                  <select className="field mt-1" value={rec.spaceId} onChange={(e) => update((w) => updatePearlMeta(w, rec.id, { spaceId: e.target.value }))}>{ws.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                <label className="block"><span className="label">Project</span>
                  <select className="field mt-1" value={rec.projectId ?? ""} onChange={(e) => update((w) => updatePearlMeta(w, rec.id, { projectId: e.target.value || null }))}><option value="">None</option>{ws.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <a className="btn btn-primary" href={pearlUrl(rec.pearl).replace(/^https?:\/\/[^/]+/, "")}>Open</a>
                <button type="button" className="btn" onClick={async () => { location.href = "/?inspect=" + encodeURIComponent(await linkFor(rec)) + "#bring"; }}>Inspect</button>
                <button type="button" className="btn" onClick={() => download(`${rec.id}.pearl.json`, { ...rec.pearl, id: rec.id, digest: rec.digest })}>Export</button>
                <button type="button" className="btn" onClick={() => { if (confirm(`Remove “${rec.name}” from this browser? This cannot be undone unless you have an export.`)) { update((w) => removePearl(w, rec.id)); say("Removed."); } }}>Remove</button>
              </div>
            </div>
            <div className="space-y-3 text-[0.88rem]">
              <p className="text-ink-2">{rec.pearl.blocks.length} blocks · composed by {rec.pearl.by ?? "unnamed"} (asserted) · saved {when(rec.savedAt)}</p>
              <p className="break-all font-mono text-[0.68rem] text-ink-3">sha256:{rec.digest}</p>
              {parent && <p className="text-ink-2">Updates <button type="button" className="underline" onClick={() => setFocus(parent.id)}>{parent.name}</button>. The original is kept unchanged.</p>}
              {children.length > 0 && <p className="text-ink-2">Updated by {children.map((c) => c.name).join(", ")}.</p>}
              <div>
                <p className="label mb-1">Notes</p>
                <ul className="space-y-1 text-ink-2">{notes.map((n) => <li key={n.id}>· {n.text}</li>)}</ul>
                <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); update((w) => addNote(w, { kind: "pearl", id: rec.id }, note)); setNote(""); }}>
                  <label className="sr-only" htmlFor={`note-${rec.id}`}>Add a note</label>
                  <input id={`note-${rec.id}`} className="field" placeholder="Add a note (kept in this browser)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button className="btn" type="submit">Add</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </li>
    );
  }

  function Spaces({ say }: { say: (m: string) => void }) {
    const { ws, update, setFocus } = useCtx();
    void setFocus;
    const [name, setName] = useState("");
    const [edit, setEdit] = useState<Record<string, string>>({});
    return (
      <section id="panel-spaces" role="tabpanel" aria-labelledby="tab-spaces" className="space-y-6">
        <p className="measure text-ink-2">Spaces are named collections in this browser: Personal, Research, Projects, Workflows, Archive, or your own. They are not cloud storage.</p>
        <form className="flex max-w-lg gap-2" onSubmit={(e) => { e.preventDefault(); update((w) => createSpace(w, name)); setName(""); }}>
          <label className="sr-only" htmlFor="new-space">New space name</label>
          <input id="new-space" className="field" placeholder="New space name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-primary" type="submit">Create space</button>
        </form>
        <ul className="divide-y divide-rule border-y border-rule">
          {ws.spaces.map((s) => {
            const n = ws.pearls.filter((p) => p.spaceId === s.id).length;
            const pr = ws.projects.filter((p) => p.spaceId === s.id).length;
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <input aria-label={`Rename ${s.name}`} className="field !w-56" value={edit[s.id] ?? s.name} onChange={(e) => setEdit({ ...edit, [s.id]: e.target.value })} onBlur={() => edit[s.id] && update((w) => renameSpace(w, s.id, edit[s.id]))} />
                <span className="flex-1 text-[0.85rem] text-ink-2">{n} Pearl{n === 1 ? "" : "s"} · {pr} project{pr === 1 ? "" : "s"}</span>
                <button type="button" className="btn" onClick={() => download(`space-${s.name.toLowerCase().replace(/\W+/g, "-")}.pearls.json`, exportWorkspace(ws, "space", { spaceId: s.id }))}>Export</button>
                <button type="button" className="btn" disabled={ws.spaces.length < 2} onClick={() => {
                  if (!confirm(`Delete the space “${s.name}”? Its ${n + pr} item(s) will move to Archive; nothing is deleted.`)) return;
                  let msg = "";
                  update((w) => { const r = deleteSpace(w, s.id); msg = `Deleted. ${r.moved} item(s) moved to ${r.to}.`; return r.ws; });
                  say(msg);
                }}>Delete</button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  function Projects({ say }: { say: (m: string) => void }) {
    const { ws, update, setFocus } = useCtx();
    void setFocus;
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    return (
      <section id="panel-projects" role="tabpanel" aria-labelledby="tab-projects" className="space-y-6">
        <p className="measure text-ink-2">A project groups related Pearls, notes and tasks: a repository, an investigation, a piece of writing. A snapshot exports its portable state.</p>
        <form className="grid max-w-2xl gap-2 sm:grid-cols-[1fr_1.4fr_auto]" onSubmit={(e) => { e.preventDefault(); update((w) => createProject(w, name, desc)); setName(""); setDesc(""); }}>
          <label className="sr-only" htmlFor="pr-name">Project name</label>
          <input id="pr-name" className="field" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="sr-only" htmlFor="pr-desc">Description</label>
          <input id="pr-desc" className="field" placeholder="What is it?" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <button className="btn btn-primary" type="submit">Create project</button>
        </form>
        {ws.projects.length === 0 && <p className="text-ink-3">No projects yet.</p>}
        <ul className="space-y-4">
          {ws.projects.map((p) => {
            const members = ws.pearls.filter((x) => x.projectId === p.id);
            const notes = ws.notes.filter((n) => n.target.kind === "project" && n.target.id === p.id);
            return (
              <li key={p.id} className="border border-rule bg-panel p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div><p className="font-serif text-xl">{p.name}</p><p className="text-[0.88rem] text-ink-2">{p.description}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn" onClick={() => { download(`snapshot-${p.name.toLowerCase().replace(/\W+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pearls.json`, exportWorkspace(ws, "project", { projectId: p.id })); say("Snapshot exported."); }}>Snapshot</button>
                    <button type="button" className="btn" onClick={() => { if (confirm(`Remove the project “${p.name}”? Its Pearls stay in your library.`)) update((w) => removeProject(w, p.id)); }}>Remove</button>
                  </div>
                </div>
                <div className="mt-4 grid gap-6 md:grid-cols-3">
                  <div><p className="label mb-2">Pearls · resources</p>
                    <ul className="space-y-1 text-[0.88rem]">{members.map((m) => <li key={m.id}><a href={pearlUrl(m.pearl).replace(/^https?:\/\/[^/]+/, "")}>{m.name}</a> <span className="font-mono text-[0.66rem] text-ink-3">{TYPE_INFO[m.pearl.type].label}</span></li>)}</ul>
                    <label className="mt-2 block"><span className="sr-only">Add a Pearl to {p.name}</span>
                      <select className="field" value="" onChange={(e) => e.target.value && update((w) => updatePearlMeta(w, e.target.value, { projectId: p.id }))}>
                        <option value="">Add a Pearl…</option>{ws.pearls.filter((x) => x.projectId !== p.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select></label>
                  </div>
                  <div><p className="label mb-2">Notes</p><ul className="space-y-1 text-[0.88rem] text-ink-2">{notes.map((n) => <li key={n.id}>· {n.text}</li>)}</ul><NoteForm id={p.id} /></div>
                  <div><p className="label mb-2">Tasks</p><TaskList projectId={p.id} /></div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  function NoteForm({ id }: { id: string }) {
    const { ws, update, setFocus } = useCtx();
    void setFocus;
    const [t, setT] = useState("");
    return (
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); update((w) => addNote(w, { kind: "project", id }, t)); setT(""); }}>
        <label className="sr-only" htmlFor={`pn-${id}`}>Add a note</label>
        <input id={`pn-${id}`} className="field" placeholder="Add a note" value={t} onChange={(e) => setT(e.target.value)} /><button className="btn" type="submit">Add</button>
      </form>
    );
  }

  function TaskList({ projectId }: { projectId: string | undefined }) {
    const { ws, update, setFocus } = useCtx();
    void setFocus;
    const [t, setT] = useState("");
    const tasks = ws.tasks.filter((x) => projectId === undefined || x.projectId === projectId || (x.pearlId && ws.pearls.find((p) => p.id === x.pearlId)?.projectId === projectId));
    return (
      <div>
        {tasks.length === 0 && <p className="text-[0.88rem] text-ink-3">No tasks. Open threads and next actions in a kept Pearl appear here automatically.</p>}
        <ul className="space-y-1.5">
          {tasks.map((x) => (
            <li key={x.id} className="flex items-start gap-2 text-[0.9rem]">
              <input id={`task-${x.id}`} type="checkbox" checked={x.done} onChange={() => update((w) => toggleTask(w, x.id))} className="mt-1.5 accent-[#74c39c]" />
              <label htmlFor={`task-${x.id}`} className={x.done ? "text-ink-3 line-through" : "text-ink-2"}>{x.text}{x.pearlId && <span className="ml-2 font-mono text-[0.64rem] text-ink-3">from {ws.pearls.find((p) => p.id === x.pearlId)?.name ?? x.pearlId}</span>}</label>
            </li>
          ))}
        </ul>
        <form className="mt-3 flex max-w-lg gap-2" onSubmit={(e) => { e.preventDefault(); update((w) => addTask(w, t, projectId ?? null)); setT(""); }}>
          <label className="sr-only" htmlFor={`nt-${projectId ?? "all"}`}>New task</label>
          <input id={`nt-${projectId ?? "all"}`} className="field" placeholder="New task" value={t} onChange={(e) => setT(e.target.value)} /><button className="btn" type="submit">Add</button>
        </form>
      </div>
    );
  }

  function Backup({ say }: { say: (m: string) => void }) {
    const { ws, update, setFocus } = useCtx();
    void setFocus;
    const [plan, setPlan] = useState<ImportPlan | null>(null);
    const [file, setFile] = useState("");
    return (
      <section id="panel-backup" role="tabpanel" aria-labelledby="tab-backup" className="space-y-8">
        <div>
          <p className="font-serif text-2xl">Export</p>
          <p className="measure mt-2 text-ink-2">A versioned JSON file with every Pearl, its content hash, local names, tags, spaces, projects, notes and tasks. Keep it before clearing browser data. Importing it elsewhere recomputes every hash.</p>
          <button type="button" className="btn btn-primary mt-3" onClick={() => { download(`pearls-${new Date().toISOString().slice(0, 10)}.pearls.json`, exportWorkspace(ws)); say("Library exported."); }} disabled={!ws.pearls.length && !ws.projects.length}>Export my library</button>
        </div>
        <div>
          <p className="font-serif text-2xl">Import</p>
          <p className="measure mt-2 text-ink-2">Choose a .pearls.json export. You will see what it contains before anything changes. Nothing already here is overwritten.</p>
          <label className="mt-3 block max-w-md"><span className="sr-only">Choose an export file</span>
            <input type="file" accept=".json,application/json" className="field" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 5_000_000) { setPlan({ ok: false, errors: ["The file is larger than 5 MB."], add: [], duplicates: [], conflicts: [], rejected: [], spaces: [], projects: [], notes: [], tasks: [] }); return; }
              setFile(f.name);
              setPlan(planImport(ws, await f.text()));
            }} /></label>
          {plan && (
            <div className="mt-4 border border-rule-strong bg-panel p-4" role="status">
              <p className="label mb-2">preview · {file}</p>
              {plan.errors.map((e, i) => <p key={i} className="text-refuse">{e}</p>)}
              {plan.ok && (
                <>
                  <ul className="space-y-1 text-[0.9rem] text-ink-2">
                    <li>{plan.add.length} new Pearl(s) to add</li>
                    <li>{plan.duplicates.length} already in this library (skipped)</li>
                    <li>{plan.conflicts.length} conflicting id(s) (skipped){plan.conflicts.map((c) => ` · ${c.id}: ${c.reason}`).join("")}</li>
                    <li className={plan.rejected.length ? "text-refuse" : ""}>{plan.rejected.length} rejected{plan.rejected.map((r) => ` · ${r.id}: ${r.reason}`).join("")}</li>
                    <li>{plan.spaces.length} space(s), {plan.projects.length} project(s), {plan.notes.length} note(s), {plan.tasks.length} task(s)</li>
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn btn-primary" disabled={!plan.add.length && !plan.projects.length && !plan.spaces.length && !plan.notes.length && !plan.tasks.length}
                      onClick={() => { const r = update((w) => applyImport(w, planImport(w, JSON.stringify(exportShape(plan))))); say(r.ok ? `Imported ${plan.add.length} Pearl(s).` : r.error ?? "Import failed."); setPlan(null); }}>Confirm import</button>
                    <button type="button" className="btn" onClick={() => setPlan(null)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

/** Re-serialise a plan so it can be re-planned against the freshest state at confirm time. */
function exportShape(plan: ImportPlan) {
  return { format: "pearl-export", version: 1, exported_at: new Date().toISOString(), scope: "workspace", note: "", pearls: plan.add, spaces: plan.spaces, projects: plan.projects, notes: plan.notes, tasks: plan.tasks };
}
