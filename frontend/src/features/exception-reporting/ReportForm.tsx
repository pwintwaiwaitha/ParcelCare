"use client";
import { useState, useRef } from "react";
import { api, mutation } from "@/shared/api/client";
import { Icon, ErrorNotice } from "@/shared/design-system/ui";
import { label } from "@/shared/design-system/format";
import type { User, Shipment } from "@/shared/api/types";
export default function ReportForm({
  user,
  shipments,
  onSaved,
  onDirty,
}: {
  user: User;
  shipments: Shipment[];
  onSaved: (id: string) => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [tracking, setTracking] = useState(""),
    [category, setCategory] = useState(""),
    [description, setDescription] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [savedId, setSavedId] = useState("");
  const attempt = useRef({ body: "", key: "" }),
    uploadKey = useRef("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let id = savedId;
      if (!id) {
        const body = { tracking_id: tracking, category, description };
        const serialized = JSON.stringify(body);
        if (attempt.current.body !== serialized)
          attempt.current = { body: serialized, key: crypto.randomUUID() };
        const result = await api<{ case_id: string }>(
          "/reports",
          mutation(body, attempt.current.key),
        );
        id = result.case_id;
        setSavedId(id);
      }
      if (file) {
        if (!uploadKey.current) uploadKey.current = crypto.randomUUID();
        const data = new FormData();
        data.append("file", file);
        await api(`/cases/${id}/evidence`, {
          method: "POST",
          body: data,
          headers: { "Idempotency-Key": uploadKey.current },
        });
      }
      onSaved(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="narrow">
      <div className="eyebrow">LET’S GET THE DETAILS RIGHT.</div>
      <h1>Report an exception</h1>
      <p className="page-description">
        Tell us what happened. Your support team will take it from here.
      </p>
      <form
        className="panel form-panel"
        onSubmit={submit}
        onChange={() => onDirty(true)}
      >
        <ErrorNotice message={error} />
        {savedId && (
          <div role="status" className="notice success">
            Your report is saved. The photo still needs to finish uploading.
            Retry below, or open the case without the photo.
          </div>
        )}
        <fieldset disabled={busy || !!savedId}>
          <div className="form-section-title">
            <span>01</span>
            <div>
              <h2>Shipment & issue</h2>
              <p>Select a shipment available to your account.</p>
            </div>
          </div>
          <label>
            Tracking ID
            <select
              required
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            >
              <option value="">Choose a shipment</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.tracking_id}>
                  {s.tracking_id} — {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            What went wrong?
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Choose an issue</option>
              {user.categories.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </label>
          <p className="field-help">
            Your support team will review your report and keep you updated.
          </p>
          <div className="form-section-title second">
            <span>02</span>
            <div>
              <h2>A little more context</h2>
              <p>Include the details that will help the team understand.</p>
            </div>
          </div>
          <label>
            What happened?
            <textarea
              required
              minLength={10}
              maxLength={3000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For example: the delivery address is missing my apartment number…"
            />
          </label>
          <span className="field-help">
            {description.length}/3,000 characters · Please avoid payment details
            or passwords.
          </span>
        </fieldset>
        <label className="upload-zone">
          Photo evidence <span className="optional">optional</span>
          <span>PNG or JPEG · up to 5 MB</span>
          <input
            type="file"
            disabled={busy}
            accept="image/png,image/jpeg"
            onChange={(e) => {
              const picked = e.target.files?.[0] || null;
              if (picked && picked.size > 5 * 1024 * 1024) {
                setError("Choose an image smaller than 5 MB.");
                e.target.value = "";
                setFile(null);
                return;
              }
              setError("");
              setFile(picked);
              uploadKey.current = "";
              onDirty(true);
            }}
          />
        </label>
        <div className="form-bottom">
          <span>
            <Icon name="shield" size={16} />
            Only you and authorized staff can view your report.
          </span>
          <button
            disabled={busy || (!savedId && (!tracking || !category))}
            className="button primary"
          >
            {busy
              ? savedId
                ? "Uploading photo…"
                : "Saving report…"
              : savedId
                ? "Retry photo upload"
                : "Submit report"}
            <Icon name="arrow" size={17} />
          </button>
        </div>
        {savedId && (
          <button
            type="button"
            className="back-link"
            disabled={busy}
            onClick={() => onSaved(savedId)}
          >
            Open saved case without photo →
          </button>
        )}
      </form>
    </div>
  );
}
