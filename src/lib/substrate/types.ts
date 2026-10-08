/**
 * Types for the Pearl Runtime Substrate API (akadaan310/pearl-substrate,
 * src/pearl_runtime/api/routes.py at e79edac). Only shapes that exist there.
 */
export type SubstrateStatusKind = "not_configured" | "unreachable" | "connected";

/** The structured error envelope (errors.py): {error_id, code, message, retryable, request_id, details}. */
export interface SubstrateErrorBody { error_id?: string; code: string; message: string; retryable?: boolean; request_id?: string; details?: unknown }

export interface Health { ok: boolean; version?: string }
export interface Discovery { name: string; version: string; phase: string; api_base: string; auth: string[]; primitives: string[]; capabilities: string; openapi: string; pearl_protocol: string; note?: string }
export interface CapabilitySummary { id: string; version: string; status: string; description?: string; address_grammar?: string | null }

/** POST /api/v1/pearls */
export interface CreatedPearl { id: string; digest: string; created: boolean; warnings: string[] }
/** POST /api/v1/pearls/{id}/fork */
export interface ForkedPearl { id: string; digest: string; parent_id: string; parent_digest: string; warnings: string[] }
/** GET /api/v1/pearls/{id} */
export interface StoredPearl {
  id: string; digest: string; format: string; type: string; title: string; pearl: Record<string, unknown>; visibility: "private" | "shared" | "public";
  provenance: { created_at: string; created_by: { type: string; id: string } };
  lineage: unknown;
}
/** POST /api/v1/auth/ai/return: an identity verdict with an explicit uncertainty note (identity/ai.py). */
export type ReturnVerdict = "SAME_IDENTITY_NEW_SESSION" | "NEW_INSTANCE_KNOWN_MODEL" | "UNKNOWN_IDENTITY" | "POSSIBLE_IMPERSONATION" | "INVALID_CREDENTIAL";
export interface AIReturn { verdict: ReturnVerdict; uncertainty?: string; [k: string]: unknown }
/** GET /api/v1/auth/whoami */
export interface WhoAmI { actor: { type: string; id: string | null }; authenticated_as: string; authorized_capabilities: string[]; available_capabilities: string[]; note: string }

export interface SubstrateStatus {
  kind: SubstrateStatusKind;
  checked_at: string;
  base?: string;               // shown only as "configured", never the raw URL to the browser
  health?: Health;
  discovery?: Pick<Discovery, "name" | "version" | "phase" | "primitives" | "pearl_protocol">;
  capabilities?: CapabilitySummary[];
  reason?: string;
}
