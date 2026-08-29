"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Action {
  label: string;
  body: Record<string, unknown>;
  /** If set, prompt the operator and add the value to the body under this key. */
  promptKey?: string;
  promptText?: string;
  primary?: boolean;
}

/** POSTs an admin decision to `url`, then refreshes the server component. */
export function AdminAction(props: { url: string; actions: Action[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(a: Action): Promise<void> {
    let body: Record<string, unknown> = a.body;
    if (a.promptKey) {
      const v = window.prompt(a.promptText ?? "");
      if (v === null) return;
      body = { ...body, [a.promptKey]: v };
    }
    setBusy(true);
    try {
      const res = await fetch(props.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="adminActionBtns">
      {props.actions.map((a) => (
        <button
          key={a.label}
          type="button"
          disabled={busy}
          className={`button buttonCompact ${a.primary ? "buttonPrimary" : "buttonQuiet"}`}
          onClick={() => run(a)}
        >
          {a.label}
        </button>
      ))}
    </span>
  );
}
