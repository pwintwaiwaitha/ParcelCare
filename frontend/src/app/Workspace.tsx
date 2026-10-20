"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError, mutation } from "@/shared/api/client";
import type { User, Shipment, Case, Detail } from "@/shared/api/types";
import {
  Icon,
  Brand,
  Badge,
  ErrorNotice,
  Stat,
} from "@/shared/design-system/ui";
import { label, date, initials } from "@/shared/design-system/format";
import Login from "@/shared/design-system/Login";
import ReportForm from "@/features/exception-reporting/ReportForm";
import TriageForm from "@/features/recovery-review/TriageForm";
import CaseDetail from "@/features/case-tracking/CaseDetail";
import StaffQueue from "@/features/case-tracking/StaffQueue";
import ThemeToggle from "@/shared/design-system/ThemeToggle";

export default function Workspace({ expectedRole }: { expectedRole?: string }) {
  const router = useRouter(),
    pathname = usePathname();
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [cases, setCases] = useState<Case[]>([]),
    [shipments, setShipments] = useState<Shipment[]>([]),
    [detail, setDetail] = useState<Detail | null>(null);
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false);
  const [offset, setOffset] = useState(0),
    [more, setMore] = useState(false);
  const selected = pathname.split("/cases/")[1]?.split("/")[0];
  const reporting = pathname.endsWith("/reports/new");
  const activeRequest = useRef(0);
  const navigate = useCallback(
    (path: string) => {
      if (
        dirty &&
        !window.confirm("Leave this form? Unsaved details will be lost.")
      )
        return;
      setDirty(false);
      setError("");
      setDetail(null);
      router.push(path);
    },
    [dirty, router],
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    let cancelled = false;
    api<User>("/me")
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        if (!expectedRole || u.role !== expectedRole)
          router.replace(`/${u.role}`);
      })
      .catch((e) => {
        if (!cancelled && e.status !== 401) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expectedRole, router]);
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [list, ships] = await Promise.all([
        api<Case[]>(`/cases?offset=${offset}&limit=50`),
        api<Shipment[]>("/shipments"),
      ]);
      setCases(list);
      setMore(list.length === 50);
      setShipments(ships);
      setError("");
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
      if (err.status === 401) {
        setUser(null);
        setCases([]);
        setShipments([]);
        setDetail(null);
      }
    }
  }, [user, offset]);
  useEffect(() => {
    if (!user) return;
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    return () => clearInterval(timer);
  }, [user, refresh]);
  const loadDetail = useCallback(async () => {
    const request = ++activeRequest.current;
    if (!user || !selected) {
      setDetail(null);
      return;
    }
    try {
      const item = await api<Detail>(`/cases/${selected}`);
      if (request === activeRequest.current) setDetail(item);
    } catch (e) {
      if (request === activeRequest.current) {
        setError((e as Error).message);
        setDetail(null);
      }
    }
  }, [selected, user]);
  useEffect(() => {
    void loadDetail();
    if (!selected) return;
    const timer = setInterval(() => void loadDetail(), 10000);
    return () => {
      clearInterval(timer);
      activeRequest.current++;
    };
  }, [loadDetail, selected]);
  async function signOut() {
    if (dirty && !window.confirm("Sign out and discard unsaved details?"))
      return;
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setCases([]);
      setDetail(null);
      setDirty(false);
      router.push("/");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (loading)
    return (
      <div className="boot">
        <Brand />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!user)
    return (
      <Login
        initialError={error}
        onLogin={(u) => {
          setError("");
          setUser(u);
          router.replace(`/${u.role}`);
        }}
      />
    );
  const staff = user.role === "staff";
  const visible = cases.filter(
    (c) =>
      (filter === "ALL" || c.status === filter) &&
      `${c.tracking_id} ${label(c.category)} ${c.id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const base = `/${user.role}`;
  return (
    <div
      className={`app-shell ${staff ? "app-shell--staff" : "app-shell--reporter"}`}
    >
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">
          {staff
            ? "OPERATIONS WORKSPACE"
            : `${user.role.toUpperCase()} WORKSPACE`}
        </div>
        <nav aria-label="Main navigation">
          <button
            className={!reporting ? "nav-item active" : "nav-item"}
            onClick={() => navigate(base)}
          >
            <Icon name="grid" />
            {staff ? "Case workspace" : "My cases"}
            <span>{cases.length}</span>
          </button>
          {!staff && (
            <button
              className={reporting ? "nav-item active" : "nav-item"}
              onClick={() => navigate(`${base}/reports/new`)}
            >
              <Icon name="plus" />
              Report an exception
            </button>
          )}
        </nav>
        <div className="sidebar-note">
          <Icon name="shield" />
          <strong>Support workspace</strong>
          <p>
            Review cases and keep
            <br />
            reporters informed.
          </p>
        </div>
        <div className="profile">
          <span className="avatar">{initials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={signOut}
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>
              {reporting
                ? "New report"
                : selected
                  ? "Case details"
                  : staff
                    ? "Exception queue"
                    : "My cases"}
            </strong>
          </span>
          <div className="topbar-actions">
            <div className="live-indicator">
              <i />
              {user.local_demo ? "Local test mode" : "Shared workspace"}
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main>
          <ErrorNotice message={error} />
          {notice && (
            <div role="status" className="notice success">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}
          {reporting && !staff ? (
            <ReportForm
              user={user}
              shipments={shipments}
              onDirty={setDirty}
              onSaved={(id) => {
                setDirty(false);
                setNotice("Your report is saved. You can follow updates here.");
                void refresh();
                router.push(`${base}/cases/${id}`);
              }}
            />
          ) : selected ? (
            <>
              <button className="back-link" onClick={() => navigate(base)}>
                ← Back to {staff ? "queue" : "my cases"}
              </button>
              {detail ? (
                <CaseDetail
                  item={detail}
                  staff={staff}
                  staffAction={
                    <TriageForm
                      key={detail.id}
                      item={detail}
                      onDirty={setDirty}
                      onUpdated={() => {
                        setDirty(false);
                        setNotice(
                          "Triage saved. The reporter can see your update.",
                        );
                        void refresh();
                        void loadDetail();
                      }}
                    />
                  }
                />
              ) : (
                <div className="panel empty">
                  <Icon name="clock" />
                  <h2>{error ? "Case unavailable" : "Loading case…"}</h2>
                  <button
                    className="button secondary"
                    onClick={() => void loadDetail()}
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {staff ? "OPERATIONS" : "DELIVERY SUPPORT"}
                  </div>
                  <h1>{staff ? "Exception workspace" : "My cases"}</h1>
                  <p>
                    {staff
                      ? "Review reports, set priorities, and keep everyone in the loop."
                      : "Report an issue and follow your support team’s progress, all in one place."}
                  </p>
                </div>
                {!staff && (
                  <button
                    className="button primary"
                    onClick={() => navigate(`${base}/reports/new`)}
                  >
                    <Icon name="plus" />
                    Report an exception
                  </button>
                )}
              </div>
              <section className="stats" aria-label="Case summary">
                <Stat
                  title="Cases on this page"
                  value={cases.length}
                  icon="box"
                  note="Saved reports"
                />
                <Stat
                  title="Awaiting triage"
                  value={cases.filter((c) => c.status === "OPEN").length}
                  icon="clock"
                  note="Ready for a first look"
                />
                <Stat
                  title="Being handled"
                  value={
                    cases.filter(
                      (c) => c.status !== "OPEN" && c.status !== "RESOLVED",
                    ).length
                  }
                  icon="shield"
                  note="Assigned or under review"
                />
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {staff ? "Exception queue" : "Your cases"}{" "}
                      <span className="count">{cases.length}</span>
                    </h2>
                    <p>
                      {staff
                        ? "Start with a report. Leave a clear next step."
                        : "Select a case to see its latest update."}
                    </p>
                  </div>
                  <span className="subtle desktop-only">
                    Updates every 10 seconds
                  </span>
                </div>
                <div className="toolbar">
                  <div className="search-field">
                    <Icon name="search" />
                    <input
                      aria-label="Search cases on this page"
                      placeholder="Search this page by tracking ID or issue…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Filter by status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    {[
                      "OPEN",
                      "TRIAGED",
                      "IN_PROGRESS",
                      "WAITING_CUSTOMER",
                      "WAITING_RIDER",
                      "ESCALATED",
                      "RESOLVED",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="button secondary"
                    onClick={() => void refresh()}
                  >
                    Refresh
                  </button>
                </div>
                {visible.length ? (
                  staff ? (
                    <StaffQueue
                      items={visible}
                      onOpen={(id) => navigate(`${base}/cases/${id}`)}
                    />
                  ) : (
                    <div className="case-list">
                      {visible.map((c) => (
                        <button
                          className="case-row"
                          key={c.id}
                          onClick={() => navigate(`${base}/cases/${c.id}`)}
                        >
                          <span className="case-symbol">
                            <Icon />
                          </span>
                          <span className="case-primary">
                            <strong>{label(c.category)}</strong>
                            <small>
                              {c.tracking_id} <span>·</span> {c.shipment_label}
                            </small>
                          </span>
                          <span className="case-status">
                            <Badge value={c.status} />
                            <small>{date(c.updated_at)} MMT</small>
                          </span>
                          <span
                            className={`priority priority-${c.priority.toLowerCase()}`}
                          >
                            {label(c.priority)}
                          </span>
                          <Icon name="arrow" size={18} />
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="empty">
                    <span className="empty-icon">
                      <Icon size={30} />
                    </span>
                    <h3>
                      {cases.length ? "No matching cases" : "A fresh start."}
                    </h3>
                    <p>
                      {cases.length
                        ? "Try another search or status."
                        : staff
                          ? "New customer and rider reports will appear here."
                          : "When you report a delivery issue, its progress will appear here."}
                    </p>
                    {!staff && !cases.length && (
                      <button
                        className="button secondary"
                        onClick={() => navigate(`${base}/reports/new`)}
                      >
                        Create your first report <Icon name="arrow" size={16} />
                      </button>
                    )}
                  </div>
                )}
                <div className="list-footer">
                  <span>
                    {visible.length} visible · Times shown in Myanmar time
                  </span>
                  <div className="inline-actions">
                    <button
                      disabled={!offset}
                      onClick={() => setOffset(Math.max(0, offset - 50))}
                    >
                      Previous
                    </button>
                    <button
                      disabled={!more}
                      onClick={() => setOffset(offset + 50)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
              {!staff && (
                <section className="shipment-section">
                  <h2>
                    {user.role === "rider"
                      ? "Your assigned shipments"
                      : "Your shipments"}
                  </h2>
                  <div className="shipment-grid">
                    {shipments.map((s) => (
                      <article key={s.id} className="shipment-card">
                        <div className="shipment-card-top">
                          <Icon />
                          <Badge value={s.status} />
                        </div>
                        <h3>{s.label}</h3>
                        <strong className="tracking">{s.tracking_id}</strong>
                        <p>{s.destination}</p>
                      </article>
                    ))}
                    {!shipments.length && (
                      <p className="subtle">
                        No shipments are available for this account.
                      </p>
                    )}
                  </div>
                </section>
              )}
              <div className="bottom-note">
                <Icon name="shield" size={16} /> Reports and updates are visible
                only to authorized people.
              </div>
            </>
          )}
        </main>
        <footer>
          ParcelCare <span>Thoughtful support. Traceable progress.</span>
        </footer>
      </div>
    </div>
  );
}
