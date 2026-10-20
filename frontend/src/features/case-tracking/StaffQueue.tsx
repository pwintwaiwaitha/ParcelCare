import type { Case } from "@/shared/api/types";
import { Badge, Icon } from "@/shared/design-system/ui";
import { date, label } from "@/shared/design-system/format";

export default function StaffQueue({
  items,
  onOpen,
}: {
  items: Case[];
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <div className="staff-queue-table">
        <table>
          <caption className="sr-only">
            Reported exceptions on the current page. Open a case to review its
            reports and update triage.
          </caption>
          <thead>
            <tr>
              <th scope="col">Tracking ID</th>
              <th scope="col">Issue</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col" className="queue-owner">
                Owner
              </th>
              <th scope="col" className="queue-updated">
                Updated
              </th>
              <th scope="col">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong className="tracking">{item.tracking_id}</strong>
                  <span className="table-secondary">{item.shipment_label}</span>
                </td>
                <td>
                  <strong>{label(item.category)}</strong>
                </td>
                <td>
                  <span
                    className={`priority priority-${item.priority.toLowerCase()}`}
                  >
                    {label(item.priority)}
                  </span>
                </td>
                <td>
                  <Badge value={item.status} />
                </td>
                <td className="queue-owner">{item.owner || "Unassigned"}</td>
                <td className="queue-updated">
                  <time dateTime={item.updated_at}>
                    {date(item.updated_at)}
                    <span className="table-secondary">Myanmar time</span>
                  </time>
                </td>
                <td>
                  <button
                    className="button secondary queue-open"
                    aria-label={`Open case ${item.id.slice(0, 8)} for ${item.tracking_id}`}
                    onClick={() => onOpen(item.id)}
                  >
                    Open <Icon name="arrow" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="staff-case-cards">
        {items.map((item) => (
          <button
            className="case-row"
            key={item.id}
            onClick={() => onOpen(item.id)}
          >
            <span className="case-primary">
              <strong>{label(item.category)}</strong>
              <small>
                {item.tracking_id} · {item.owner || "Unassigned"}
              </small>
            </span>
            <span className="case-status">
              <Badge value={item.status} />
              <span
                className={`priority priority-${item.priority.toLowerCase()}`}
              >
                {label(item.priority)}
              </span>
              <small>{date(item.updated_at)} MMT</small>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
