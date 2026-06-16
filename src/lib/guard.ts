import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, type PermissionAction } from "@/lib/rbac";
import { getEffectivePermissions } from "@/lib/permissions";

// Live effective permissions from the DB (roles ∪ user-grants − user-revokes),
// deduped per request via React cache. Used so that admin permission changes
// take effect IMMEDIATELY (no re-login needed) — the JWT only carries identity.
const livePermissions = cache(getEffectivePermissions);

// Returns the session or redirects to login. Use in server components/actions.
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

// Requires an APPROVED account; pending/rejected/suspended go to the status page.
// Injects LIVE permissions into the session so every guard/page/action is current.
export async function requireApproved() {
  const session = await requireAuth();
  if (session.user.status !== "APPROVED") redirect("/account/status");
  session.user.permissions = await livePermissions(session.user.id);
  return session;
}

export async function requirePermission(resource: string, action: PermissionAction) {
  const session = await requireApproved();
  if (!can(session.user.permissions, resource, action)) redirect("/dashboard?denied=1");
  return session;
}

export function hasPermission(
  session: { user: { permissions: string[] } } | null,
  resource: string,
  action: PermissionAction,
) {
  if (!session?.user) return false;
  return can(session.user.permissions, resource, action);
}

// Platform-wide admin view (sees all clinics/devices, not just own).
export function isPlatformAdmin(session: { user: { permissions: string[] } }) {
  return can(session.user.permissions, "users", "VIEW");
}
