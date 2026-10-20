import type { Case } from "@/shared/api/types";
import { Badge, Icon } from "@/shared/design-system/ui";
import { date, label } from "@/shared/design-system/format";

const columns = [
  { name: "Critical", priority: "URGENT", tone: "critical" },
  { name: "High", priority: "HIGH", tone: "high" },
  { name: "Normal", priority: "NORMAL", tone: "normal" },
  { name: "Low", priority: "LOW", tone: "low" },
];

export default function ExceptionBoard({ items, onOpen }: { items: Case[]; onOpen: (id: string) => void }) {
  return <div className="exception-board" aria-label="Exceptions by priority">
    {columns.map(column => {
      const tickets = items.filter(item => item.priority === column.priority && item.status !== "RESOLVED")
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      return <section key={column.priority} className={`exception-column exception-column--${column.tone}`} aria-label={`${column.name} tickets`}>
        <div className="exception-column-heading"><h2><span className="queue-priority-dot" />{column.name}</h2><span className="count" aria-label={`${tickets.length} tickets`}>{tickets.length}</span></div>
        <p className="queue-column-note">{column.name === "Critical" ? "Highest priority · urgent cases" : "Oldest reports first"}</p>
        <div className="exception-tickets">
          {tickets.map(item => <article className="exception-ticket" key={item.id}>
            <div className="exception-ticket-top"><strong className="tracking">{item.tracking_id}</strong><span className="subtle">#{item.id.slice(0, 8)}</span></div>
            <h3>{label(item.category)}</h3><p>{item.shipment_label}</p>
            <Badge value={item.status} />
            <dl><div><dt>Owner</dt><dd>{item.owner || "Unassigned"}</dd></div><div><dt>Reported</dt><dd><time dateTime={item.created_at}>{date(item.created_at)} MMT</time></dd></div></dl>
            <button className="button secondary" onClick={() => onOpen(item.id)} aria-label={`Take action on ${item.tracking_id}, case ${item.id.slice(0,8)}`}>Take action <Icon name="arrow" size={16} /></button>
          </article>)}
          {!tickets.length && <div className="queue-column-empty"><Icon name="check" size={20} /><p>No {column.name.toLowerCase()} tickets on this page.</p></div>}
        </div>
      </section>;
    })}
  </div>;
}
