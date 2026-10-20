import { label } from "./format";
export function Icon({
  name = "box",
  size = 20,
}: {
  name?: string;
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    box: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    logout: (
      <>
        <path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.box}
    </svg>
  );
}
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Icon size={25} />
      </span>
      <span>
        parcel<span className="brand-light">care</span>
        <small>EXCEPTION MANAGEMENT</small>
      </span>
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge badge-${value.toLowerCase()}`}>{label(value)}</span>
  );
}
export function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="notice error">
      {message}
    </div>
  ) : null;
}

export function Stat({
  title,
  value,
  icon,
  note,
}: {
  title: string;
  value: number;
  icon: string;
  note: string;
}) {
  return (
    <article className="stat">
      <div>
        <p>{title}</p>
        <strong>{value.toString().padStart(2, "0")}</strong>
        <small>{note}</small>
      </div>
      <span className="stat-icon">
        <Icon name={icon} />
      </span>
    </article>
  );
}
