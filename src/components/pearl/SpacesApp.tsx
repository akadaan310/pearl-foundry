"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWorkspace, download } from "./useWorkspace";
import { PearlGlyphClient } from "./PearlGlyphClient";
import { CopyButton } from "@/components/CopyPrompt";
import { TYPE_INFO } from "@/lib/pearl/model";
import { encodePortable } from "@/lib/pearl/portable";
import { composeCollection, type CollectionPlan } from "@/lib/pearl/collection";
import {
  createSpace, renameSpace, deleteSpace, exportWorkspace, planImport, applyImport, updatePearlMeta,
  type ImportPlan, type Space,
} from "@/lib/pearl/workspace";

const SUGGESTIONS = ["My Life", "Creative Studio", "Cooking", "Study", "Work"];
const TINTS = ["#0e6b50", "#2a4fa8", "#b4532a", "#8a5a06", "#5b3fa0", "#1f5f6b", "#6b4a2a"];
const tint = (s: Space) => TINTS[[...s.id].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

/**
 * Spaces: places for Pearls. Everything is kept in this browser; a space can be
 * exported, imported, and composed into one collection Pearl you can carry.
 */
export function SpacesApp() {
  const { ws, ready, available, update } = useWorkspace();
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 3000); };

  useEffect(() => { const s = new URLSearchParams(location.search).get("space"); if (s) setOpen(s); }, []);
  const choose = (id: string | null) => { setOpen(id); history.replaceState(null, "", id ? `?space=${encodeURIComponent(id)}` : location.pathname); };

  const add = (n: string) => {
    if (!n.trim()) return;
    if (ws.spaces.some((s) => s.name.toLowerCase() === n.trim().toLowerCase())) { say(`You already have a space called “${n.trim()}”.`); return; }
    const r = update((w) => createSpace(w, n));
    say(r.ok ? `Space “${n.trim()}” created.` : r.error ?? "Could not create the space.");
    setName("");
  };

  if (!ready) return <p className="py-10 text-ink-3">Reading this browser&apos;s spaces…</p>;
  if (!available) return <p className="py-10 text-refuse">This browser does not allow local storage for this site, so spaces cannot be kept here.</p>;

  const current = ws.spaces.find((s) => s.id === open);
  return (
    <div>
      {flash && <p role="status" className="mb-4 text-[0.9rem] text-emerald">{flash}</p>}
      {current ? <SpaceView space={current} back={() => choose(null)} say={say} /> : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Your spaces">
            {ws.spaces.map((s) => {
              const pearls = ws.pearls.filter((p) => p.spaceId === s.id);
              const projects = ws.projects.filter((p) => p.spaceId === s.id).length;
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => choose(s.id)} className="card card-lift block w-full overflow-hidden text-left">
                    <span className="block h-1.5" style={{ background: tint(s) }} aria-hidden="true" />
                    <span className="block p-5">
                      <span className="block font-serif text-2xl">{s.name}</span>
                      <span className="mt-1 block text-[0.88rem] text-ink-2">{pearls.length} {pearls.length === 1 ? "Pearl" : "Pearls"}{projects ? ` · ${projects} ${projects === 1 ? "project" : "projects"}` : ""}</span>
                      <span className="mt-3 flex min-h-6 gap-1.5" aria-hidden="true">
                        {pearls.slice(0, 6).map((p) => <PearlGlyphClient key={p.id} size={22} />)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <form className="card mt-8 p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); add(name); }}>
            <label htmlFor="new-space" className="font-serif text-xl">Make a new space</label>
            <p className="mt-1 text-[0.9rem] text-ink-2">A space is a place for Pearls that belong together: a life, a kitchen, a course, a project.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input id="new-space" className="field !w-auto min-w-0 flex-1 !rounded-full !font-sans" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name your space" />
              <button type="submit" className="btn-solid">Create space</button>
            </div>
            <p className="mt-4 text-[0.82rem] text-ink-3">Or start from one of these:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTIONS.filter((s) => !ws.spaces.some((x) => x.name.toLowerCase() === s.toLowerCase())).map((s) => (
                <button key={s} type="button" className="btn-soft !min-h-9 !px-3 !py-1 text-[0.85rem]" onClick={() => add(s)}>+ {s}</button>
              ))}
            </div>
          </form>

          <ImportBox say={say} />
          <p className="mt-8 text-[0.85rem] text-ink-3">Spaces live in this browser only. They do not sync to other devices; export a space to carry it. <Link className="underline" href="/workspace#backup">Back up everything</Link>.</p>
        </>
      )}
    </div>
  );
}

function SpaceView({ space, back, say }: { space: Space; back: () => void; say: (m: string) => void }) {
  const { ws, update } = useWorkspace();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(space.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [collection, setCollection] = useState<CollectionPlan | null>(null);
  const pearls = useMemo(() => ws.pearls.filter((p) => p.spaceId === space.id).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.modifiedAt.localeCompare(a.modifiedAt)), [ws.pearls, space.id]);
  const projects = ws.projects.filter((p) => p.spaceId === space.id);
  const others = ws.pearls.filter((p) => p.spaceId !== space.id);

  const compose = async () => {
    const members = await Promise.all(pearls.map(async (p) => ({ title: p.name || p.pearl.title, href: new URL((await encodePortable(p.pearl)).url).pathname })));
    setCollection(composeCollection(space.name, `Pearls from my ${space.name} space.`, members));
  };

  return (
    <section aria-labelledby="space-title">
      <button type="button" onClick={back} className="text-[0.9rem] text-ink-2 hover:text-ink">← All spaces</button>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        {renaming ? (
          <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const r = update((w) => renameSpace(w, space.id, newName)); setRenaming(false); say(r.ok ? "Renamed." : r.error ?? "Could not rename."); }}>
            <label htmlFor="rename-space" className="sr-only">Space name</label>
            <input id="rename-space" className="field !w-auto !rounded-full !font-sans" maxLength={40} value={newName} onChange={(e) => setNewName(e.target.value)} />
            <button type="submit" className="btn-solid">Save</button>
            <button type="button" className="btn-soft" onClick={() => setRenaming(false)}>Cancel</button>
          </form>
        ) : <h2 id="space-title" className="font-serif text-4xl">{space.name}</h2>}
        <div className="flex flex-wrap gap-2">
          {!renaming && <button type="button" className="btn-soft !min-h-10 !py-1 text-[0.88rem]" onClick={() => { setNewName(space.name); setRenaming(true); }}>Rename</button>}
          <button type="button" className="btn-soft !min-h-10 !py-1 text-[0.88rem]" onClick={() => download(`pearls-space-${space.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`, exportWorkspace(ws, "space", { spaceId: space.id }))}>Export space</button>
          {space.name !== "Archive" && ws.spaces.length > 1 && <button type="button" className="btn-soft !min-h-10 !py-1 text-[0.88rem]" onClick={() => setConfirmDelete(true)}>Delete</button>}
        </div>
      </div>

      {confirmDelete && (
        <div role="alertdialog" aria-labelledby="del-title" className="card mt-4 p-4">
          <p id="del-title" className="text-[0.95rem]">Delete the space “{space.name}”? Its {pearls.length} Pearl(s) and {projects.length} project(s) are not deleted: they move to Archive.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-solid" onClick={() => { let msg = ""; const r = update((w) => { const d = deleteSpace(w, space.id); msg = `Deleted. ${d.moved} item(s) moved to ${d.to}.`; return d.ws; }); say(r.ok ? msg : r.error ?? "Could not delete."); back(); }}>Delete space</button>
            <button type="button" className="btn-soft" onClick={() => setConfirmDelete(false)}>Keep it</button>
          </div>
        </div>
      )}

      {pearls.length === 0 ? (
        <div className="card mt-6 p-6">
          <p className="font-serif text-xl">Nothing here yet.</p>
          <p className="mt-1 text-ink-2">Bring a Pearl from your AI, make one, or move one in from another space.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link href="/#first" className="btn-solid">Bring a Pearl</Link><Link href="/create" className="btn-soft">Create one</Link></div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-label={`Pearls in ${space.name}`}>
          {pearls.map((p) => (
            <li key={p.id} className="card flex items-start gap-3 p-4">
              <PearlGlyphClient size={36} />
              <div className="min-w-0 flex-1">
                <Link href={`/workspace?pearl=${p.id}`} className="block truncate font-medium hover:underline">{p.name || p.pearl.title}</Link>
                <p className="text-[0.82rem] text-ink-3">{TYPE_INFO[p.pearl.type].label} · {p.pearl.blocks.length} parts{p.pinned ? " · pinned" : ""}</p>
                <label className="mt-2 block text-[0.78rem] text-ink-3">Move to{" "}
                  <select className="ml-1 rounded border border-rule bg-panel px-1 py-0.5 text-ink" value={p.spaceId} onChange={(e) => { update((w) => updatePearlMeta(w, p.id, { spaceId: e.target.value })); say("Moved."); }}>
                    {ws.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-[0.9rem] text-ink-2 hover:text-ink">Add Pearls from other spaces ({others.length})</summary>
          <ul className="mt-3 space-y-2">
            {others.slice(0, 50).map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-[0.9rem]">
                <PearlGlyphClient size={20} />
                <span className="min-w-0 flex-1 truncate">{p.name || p.pearl.title} <span className="text-ink-3">· {ws.spaces.find((s) => s.id === p.spaceId)?.name}</span></span>
                <button type="button" className="btn-soft !min-h-8 !px-3 !py-0.5 text-[0.8rem]" onClick={() => { update((w) => updatePearlMeta(w, p.id, { spaceId: space.id })); say(`Moved into ${space.name}.`); }}>Move here</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {pearls.length > 0 && (
        <div className="card mt-8 p-5 sm:p-6">
          <p className="font-serif text-xl">Carry this space as one Pearl</p>
          <p className="mt-1 text-[0.9rem] text-ink-2">Makes a collection Pearl: one link that points to every Pearl here. Give it to your AI, or open it anywhere.</p>
          {!collection ? <button type="button" className="btn-solid mt-4" onClick={compose}>Make a collection Pearl</button> : (
            <div className="mt-4 space-y-3" aria-live="polite">
              <p className="text-[0.9rem] text-emerald">✓ {collection.included.length} of {pearls.length} Pearl(s) included.</p>
              {collection.omitted.length > 0 && <ul className="space-y-1 text-[0.82rem] text-gold">{collection.omitted.map((o, i) => <li key={i}>Left out “{o.title}”: {o.reason}.</li>)}</ul>}
              <p className="break-all rounded-lg bg-raised px-3 py-2 font-mono text-[0.7rem] text-ink-2">{collection.url}</p>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={collection.url} label="Copy collection link" />
                <a className="btn !min-h-9 !py-1 text-[0.8rem]" href={collection.url.replace(/^https?:\/\/[^/]+/, "")}>Open it</a>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ImportBox({ say }: { say: (m: string) => void }) {
  const { ws, update } = useWorkspace();
  const [text, setText] = useState<string | null>(null);
  const plan: ImportPlan | null = useMemo(() => (text === null ? null : planImport(ws, text)), [ws, text]);
  return (
    <div className="card mt-6 p-5 sm:p-6">
      <p className="font-serif text-xl">Import a space</p>
      <p className="mt-1 text-[0.9rem] text-ink-2">Choose a space or library file exported from Pearls. Every Pearl is re-checked against its id before anything is added.</p>
      <label className="btn-soft mt-3 cursor-pointer !min-h-10 text-[0.88rem]">Choose a file
        <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = ""; }} />
      </label>
      {plan && (
        <div className="mt-4 text-[0.9rem]" role="status">
          {!plan.ok ? <ul className="text-refuse">{plan.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : (
            <>
              <p>{plan.add.length} new Pearl(s), {plan.spaces.length} new space(s), {plan.duplicates.length} already here{plan.rejected.length ? `, ${plan.rejected.length} rejected` : ""}{plan.conflicts.length ? `, ${plan.conflicts.length} conflicting` : ""}.</p>
              {plan.rejected.length > 0 && <ul className="mt-1 text-[0.82rem] text-refuse">{plan.rejected.slice(0, 5).map((r, i) => <li key={i}>{r.id}: {r.reason}</li>)}</ul>}
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-solid" disabled={!plan.add.length && !plan.spaces.length} onClick={() => { const r = update((w) => applyImport(w, planImport(w, text!))); say(r.ok ? `Imported ${plan.add.length} Pearl(s).` : r.error ?? "Import failed."); setText(null); }}>Confirm import</button>
                <button type="button" className="btn-soft" onClick={() => setText(null)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
