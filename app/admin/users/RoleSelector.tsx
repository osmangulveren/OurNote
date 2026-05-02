"use client";

import { useTransition } from "react";
import { Role } from "@prisma/client";
import { updateAdminUserRole } from "@/lib/users/actions";
import { ROLE_LABEL } from "@/lib/auth/permissions";

const OPTIONS = Object.entries(ROLE_LABEL).filter(([k]) => k !== "CUSTOMER");

export default function RoleSelector({ userId, role }: { userId: string; role: Role }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => start(async () => { await updateAdminUserRole(userId, e.target.value as Role); })}
      className="rounded border border-slate-300 px-2 py-1 text-xs bg-white"
    >
      {OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
    </select>
  );
}
