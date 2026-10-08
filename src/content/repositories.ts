import type { Repository } from "./types";

const gh = (slug: string) => `https://github.com/${slug}`;

/** Commits are the ones read and re-run on 2026-10-08. */
export const REPOSITORIES: Repository[] = [
  { id: "acsp", slug: "akadaan310/NetGovComEduGovOrgEduGovComNet", url: gh("akadaan310/NetGovComEduGovOrgEduGovComNet"), commit: "9fcf2e1da3ce01a4e66eb5be5e2249b1f211878b", visibility: "public" },
  { id: "purl", slug: "akadaan310/purl", url: gh("akadaan310/purl"), commit: "3df4452a3624b3f5492bf23c2dacc49d8d2b33c7", visibility: "public" },
  { id: "seurl", slug: "akadaan310/seurl", url: gh("akadaan310/seurl"), commit: "620ff955b87857c3eb7a7700a81b6a4d0217400a", visibility: "public" },
  { id: "golden-surface", slug: "akadaan310/golden-surface", url: gh("akadaan310/golden-surface"), commit: "b11371878e8bda63b45848d42d41351fdaa273a8", visibility: "public" },
  { id: "netscape-surface", slug: "akadaan310/netscape-surface", url: gh("akadaan310/netscape-surface"), commit: "dcda42667bd8e6a90e7ebc9abf26b9a59dd048e9", visibility: "public" },
  { id: "substrateio", slug: "akadaan310/substrateIO", url: gh("akadaan310/substrateIO"), commit: "7ace119a544fc736f0d4ec1d72cded9dad0a83e3", visibility: "public" },
  { id: "musa", slug: "akadaan310/MUSA", url: gh("akadaan310/MUSA"), commit: "d797135727787124d18193f04af26d6c3fed03a5", visibility: "public" },
  { id: "pearl-substrate", slug: "akadaan310/pearl-substrate", url: gh("akadaan310/pearl-substrate"), commit: "e79edac4ecbebf9eeee84f8a16ce5e91842a0891", visibility: "public" },
  { id: "site", slug: "akadaan310/aanebed", url: gh("akadaan310/aanebed"), commit: "HEAD", visibility: "public" },
];

export function repo(id: string): Repository {
  const r = REPOSITORIES.find((x) => x.id === id);
  if (!r) throw new Error(`unknown repository ${id}`);
  return r;
}

/** A link to a file in a repository at the commit this site was written against. */
export function blob(id: string, path: string): string {
  const r = repo(id);
  return `${r.url}/blob/${r.commit}/${path}`;
}
