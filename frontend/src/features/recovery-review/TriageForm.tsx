"use client";
import { useState, useRef } from "react";
import { api, mutation } from "@/shared/api/client";
import { Icon, ErrorNotice } from "@/shared/design-system/ui";
import { label } from "@/shared/design-system/format";
import type { Detail } from "@/shared/api/types";
export default function TriageForm({
  item,
  onUpdated,
  onDirty,
}: {
  item: Detail;
  onUpdated: () => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [status, setStatus] = useState(
      item.status === "OPEN" ? "TRIAGED" : item.status,
    ),
    [priority, setPriority] = useState(item.priority),
    [update, setUpdate] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const attempt = useRef({ body: "", key: "" });
  const [version, setVersion] = useState(item.version);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { version, status, priority, update, internal_note: note };
      const serialized = JSON.stringify(body);
      if (attempt.current.body !== serialized)
        attempt.current = { body: serialized, key: crypto.randomUUID() };
      const saved = await api<Detail>(
        `/cases/${item.id}/triage`,
        mutation(body, attempt.current.key),
      );
      setVersion(saved.version);
      setStatus(saved.status);
      setPriority(saved.priority);
      setUpdate("");
      setNote("");
      onDirty(false);
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="panel detail-panel triage-form"
      onSubmit={submit}
      onChange={() => onDirty(true)}
    >
      <div className="eyebrow">STAFF ACTION</div>
      <h2>Set the next step</h2>
      <p>
        Saving assigns this case to you. Add a clear update for the reporter.
      </p>
      <ErrorNotice message={error} />
      {item.version !== version && (
        <div className="notice error">
          This case has a newer update. Your draft is preserved.
          <button
            type="button"
            onClick={() => {
              setVersion(item.version);
              setStatus(item.status);
              setPriority(item.priority);
              setError("");
            }}
          >
            Use latest case state
          </button>
        </div>
      )}
      <fieldset disabled={busy}>
        <label>
          Case status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {item.allowed_statuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {["LOW", "NORMAL", "HIGH", "URGENT"].map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Update for the reporter
          <textarea
            rows={4}
            required
            minLength={5}
            maxLength={2000}
            value={update}
            onChange={(e) => setUpdate(e.target.value)}
            placeholder="What is being checked, and what happens next?"
          />
        </label>
        <label>
          Internal note <span className="optional">optional</span>
          <textarea
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Visible only to staff"
          />
        </label>
        <button className="button primary" disabled={busy}>
          {busy ? "Saving update…" : "Save triage & update"}
          <Icon name="check" size={17} />
        </button>
      </fieldset>
      <div className="field-help">
        Resolution is available only after verified recovery, in a later
        milestone.
      </div>
    </form>
  );
}
