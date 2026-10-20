import type { Detail } from "@/shared/api/types";
import { Icon, Badge } from "@/shared/design-system/ui";
import { label, date } from "@/shared/design-system/format";
import AIReviewPanel from "./AIReviewPanel";
export default function CaseDetail({
  item,
  staff,
  staffAction,
}: {
  item: Detail;
  staff: boolean;
  staffAction: React.ReactNode;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            CASE {item.id.slice(0, 8).toUpperCase()}
          </div>
          <h1>{label(item.category)}</h1>
          <p>
            {item.tracking_id} <span className="dot">·</span>{" "}
            {item.shipment_label}
          </p>
        </div>
        <Badge value={item.status} />
      </div>
      <div className="detail-grid">
        <div>
          <section className="panel detail-panel">
            <h2>Report details</h2>
            <div className="metadata">
              <div>
                <small>PRIORITY</small>
                <Badge value={item.priority} />
              </div>
              <div>
                <small>CASE OWNER</small>
                <strong>{item.owner || "Awaiting assignment"}</strong>
              </div>
              <div>
                <small>REPORTED</small>
                <strong>{date(item.created_at)} MMT</strong>
              </div>
            </div>
          {staff && item.related_cases.length > 0 && (
            <div className="manual-banner">
              Related cases on this shipment need staff review. Reports are kept separate.
              {item.related_cases.map(c => <div key={c.id}><a href={`/staff/cases/${c.id}`}>Case {c.id.slice(0,8)} · {label(c.status)}</a></div>)}
            </div>
          )}
          {item.manual_only && (
              <div className="manual-banner">
                This issue follows the staff-led handling route.
              </div>
            )}
            {item.reports.map((r) => (
              <div key={r.id} className="report-text">
                <span className="report-source">{r.source} report</span>
                <p>{r.description}</p>
              </div>
            ))}
            {item.evidence.length > 0 && (
              <div className="evidence-list">
                <h3>Evidence</h3>
                {item.evidence.map((e) => (
                  <a
                    key={e.id}
                    href={`/api/cases/${item.id}/evidence/${e.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon size={17} />
                    {e.name}
                    <Icon name="arrow" size={15} />
                  </a>
                ))}
              </div>
            )}
          </section>
          {staff && <AIReviewPanel key={item.id} caseId={item.id} version={item.version} />}
          <section className="panel detail-panel timeline-panel">
            <div className="panel-heading">
              <h2>Case timeline</h2>
              <span className="subtle">Auto-updating</span>
            </div>
            <ol className="timeline">
              {item.events.map((e, i) => (
                <li key={e.id}>
                  <span
                    className={`timeline-dot ${i === item.events.length - 1 ? "latest" : ""}`}
                  >
                    <Icon name={i === 0 ? "box" : "check"} size={14} />
                  </span>
                  <div>
                    <div className="event-heading">
                      <strong>
                        {e.visibility === "staff"
                          ? "Internal staff note"
                          : i === 0
                            ? "Report received"
                            : "Progress update"}
                      </strong>
                      <small>{date(e.created_at)} MMT</small>
                    </div>
                    <p>{e.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside>
          {staff ? (
            staffAction
          ) : (
            <section className="panel detail-panel next-step">
              <span className="stat-icon">
                <Icon name="shield" />
              </span>
              <h2>You’re in the loop.</h2>
              <p>
                Your report has been saved. Your support team’s updates will
                appear in the timeline automatically.
              </p>
              <div className="subtle">
                No need to submit the same issue again.
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
