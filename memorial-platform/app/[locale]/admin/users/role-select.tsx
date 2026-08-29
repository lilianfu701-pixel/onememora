"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Inline role picker that saves on change; reverts on failure. */
export function RoleSelect(props: { userId: string; role: string }) {
  const router = useRouter();
  const [value, setValue] = useState(props.role);
  const [busy, setBusy] = useState(false);

  async function change(
    event: React.ChangeEvent<HTMLSelectElement>,
  ): Promise<void> {
    const next = event.target.value;
    setValue(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${props.userId}/role`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setValue(props.role);
      }
    } catch {
      setValue(props.role);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select className="input" value={value} disabled={busy} onChange={change}>
      <option value="user">user</option>
      <option value="reviewer">reviewer</option>
      <option value="super_admin">super_admin</option>
    </select>
  );
}
