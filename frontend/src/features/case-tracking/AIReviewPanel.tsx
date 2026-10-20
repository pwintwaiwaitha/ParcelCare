"use client";
import { useEffect, useRef, useState } from "react";
import { api, mutation } from "@/shared/api/client";
type Finding = { finding: string; uncertainty: string; report_ids: string[] };
const checks = ["classification", "summary", "priority", "missing_data", "duplicates", "evidence_consistency", "next_action"] as const;
type Review = {
  id: string; status: string; model: string; stale: boolean; error: string | null;
  result: Record<typeof checks[number], Finding> & { suggested_category: string; suggested_priority: string; duplicate_case_ids: string[] } | null;
};
export default function AIReviewPanel({ caseId, version }: { caseId: string; version: number }) {
  const [review, setReview] = useState<Review | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const retryKey = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    retryKey.current = null;
    setReview(null); setLoading(true); setError("");
    const load = () => api<{ configured: boolean; review: Review | null }>(`/cases/${caseId}/ai-review`)
      .then(data => { if (active) { setConfigured(data.configured); setReview(data.review); setError(""); } })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    load();
    const timer = setInterval(load, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [caseId, version]);
  async function run() {
    setRunning(true); setError("");
    retryKey.current ||= crypto.randomUUID();
    try {
      const data = await api<Review>(`/cases/${caseId}/ai-review`, mutation({ version }, retryKey.current));
      setReview(data); retryKey.current = null;
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load AI review."); }
    finally { setRunning(false); }
  }
  return <section className="panel detail-panel" aria-label="AI triage review">
    <h2>AI triage review</h2>
    <p className="subtle">Seven advisory checks. Staff decides what happens next. Photos require manual assessment.</p>
    {loading && <p role="status">Loading review…</p>}
    {!loading && !configured && <p>AI is not configured yet. Continue using staff triage.</p>}
    {error && <p role="alert">{error}</p>}
    {review && <div aria-live="polite">
      <p><strong>{review.status.replaceAll("_", " ")}</strong> · {review.model}</p>
      {review.stale && <p className="manual-banner">Case information changed. Request a new review before relying on these findings.</p>}
      {review.error && <p role="alert">{review.error}</p>}
      {review.result && <>
        <p>Suggested category: <strong>{review.result.suggested_category.replaceAll("_", " ")}</strong><br />Suggested priority: <strong>{review.result.suggested_priority}</strong></p>
        {checks.map((key, index) => {
          const finding = review.result![key];
          return <div className="report-text" key={key}>
            <h3>{index + 1}. {key.replaceAll("_", " ")}</h3>
            <p>{finding.finding}</p><p className="subtle">Uncertainty: {finding.uncertainty}</p>
            {finding.report_ids.length > 0 && <p className="subtle">Reports: {finding.report_ids.map(id => id.slice(0, 8)).join(", ")}</p>}
            {key === "duplicates" && review.result!.duplicate_case_ids.map(id => <p key={id}><a href={`/staff/cases/${id}`}>Review candidate {id.slice(0, 8)}</a></p>)}
          </div>;
        })}
      </>}
    </div>}
    <button className="button primary" type="button" onClick={run} disabled={loading || !configured || running || review?.status === "PENDING"}>
      {running || review?.status === "PENDING" ? "Review in progress…" : review ? "Request new AI review" : "Run seven AI checks"}
    </button>
  </section>;
}
