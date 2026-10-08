/**
 * A small JSON Schema (2020-12) subset validator: type, required, properties,
 * items, enum, const, pattern, minItems and local $ref. Enough to validate
 * the research manifest against its published schema with no dependency.
 */
type S = Record<string, any>;

const typeOf = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);

export function validate(schema: S, value: unknown, root: S = schema, at = "$"): string[] {
  if (schema.$ref) {
    const ref = (schema.$ref as string).replace(/^#\//, "").split("/").reduce((o: S, k: string) => o?.[k], root);
    return validate(ref, value, root, at);
  }
  const errs: string[] = [];
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const t = typeOf(value);
    if (!types.some((x: string) => x === t || (x === "number" && t === "integer"))) return [`${at}: expected ${types.join("|")}, got ${t}`];
  }
  if ("const" in schema && JSON.stringify(schema.const) !== JSON.stringify(value)) errs.push(`${at}: expected const ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((e: unknown) => JSON.stringify(e) === JSON.stringify(value))) errs.push(`${at}: ${JSON.stringify(value)} not in enum`);
  if (schema.pattern && typeof value === "string" && !new RegExp(schema.pattern).test(value)) errs.push(`${at}: does not match ${schema.pattern}`);
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) errs.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.items) value.forEach((v, i) => errs.push(...validate(schema.items, v, root, `${at}[${i}]`)));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    for (const k of schema.required ?? []) if (!(k in o)) errs.push(`${at}: missing ${k}`);
    for (const [k, sub] of Object.entries(schema.properties ?? {})) if (k in o) errs.push(...validate(sub as S, o[k], root, `${at}.${k}`));
  }
  return errs;
}
