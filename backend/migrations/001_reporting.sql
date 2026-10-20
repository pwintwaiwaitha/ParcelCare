-- Initial reporting schema. All business access goes through FastAPI.

CREATE TABLE profiles (
	id VARCHAR(36) NOT NULL,
	email VARCHAR(254) NOT NULL,
	name VARCHAR(100) NOT NULL,
	role VARCHAR(20) NOT NULL,
	PRIMARY KEY (id),
	CHECK (role IN ('customer','rider','staff')),
	UNIQUE (email)
)

;


CREATE TABLE mutation_receipts (
	id VARCHAR(36) NOT NULL,
	actor_id VARCHAR(36) NOT NULL,
	action VARCHAR(100) NOT NULL,
	key VARCHAR(100) NOT NULL,
	fingerprint VARCHAR(64) NOT NULL,
	result_id VARCHAR(36) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (actor_id, action, key),
	FOREIGN KEY(actor_id) REFERENCES profiles (id)
)

;


CREATE TABLE shipments (
	id VARCHAR(36) NOT NULL,
	tracking_id VARCHAR(40) NOT NULL,
	customer_id VARCHAR(36) NOT NULL,
	rider_id VARCHAR(36) NOT NULL,
	label VARCHAR(150) NOT NULL,
	destination VARCHAR(200) NOT NULL,
	status VARCHAR(30) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (tracking_id),
	FOREIGN KEY(customer_id) REFERENCES profiles (id),
	FOREIGN KEY(rider_id) REFERENCES profiles (id)
)

;


CREATE TABLE cases (
	id VARCHAR(36) NOT NULL,
	shipment_id VARCHAR(36) NOT NULL,
	category VARCHAR(50) NOT NULL,
	status VARCHAR(30) NOT NULL,
	priority VARCHAR(20) NOT NULL,
	owner_id VARCHAR(36),
	version INTEGER NOT NULL,
	created_at VARCHAR(40) NOT NULL,
	updated_at VARCHAR(40) NOT NULL,
	PRIMARY KEY (id),
	CHECK (status IN ('OPEN','TRIAGED','IN_PROGRESS','WAITING_CUSTOMER','WAITING_RIDER','ESCALATED','RESOLVED','REOPENED')),
	CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
	FOREIGN KEY(shipment_id) REFERENCES shipments (id),
	FOREIGN KEY(owner_id) REFERENCES profiles (id)
)

;


CREATE TABLE case_events (
	id VARCHAR(36) NOT NULL,
	case_id VARCHAR(36) NOT NULL,
	actor_id VARCHAR(36) NOT NULL,
	text TEXT NOT NULL,
	visibility VARCHAR(20) NOT NULL,
	created_at VARCHAR(40) NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(case_id) REFERENCES cases (id),
	FOREIGN KEY(actor_id) REFERENCES profiles (id)
)

;


CREATE TABLE evidence (
	id VARCHAR(36) NOT NULL,
	case_id VARCHAR(36) NOT NULL,
	uploader_id VARCHAR(36) NOT NULL,
	name VARCHAR(150) NOT NULL,
	mime VARCHAR(50) NOT NULL,
	object_key VARCHAR(200) NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(case_id) REFERENCES cases (id),
	FOREIGN KEY(uploader_id) REFERENCES profiles (id),
	UNIQUE (object_key)
)

;


CREATE TABLE reports (
	id VARCHAR(36) NOT NULL,
	case_id VARCHAR(36) NOT NULL,
	reporter_id VARCHAR(36) NOT NULL,
	description TEXT NOT NULL,
	created_at VARCHAR(40) NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(case_id) REFERENCES cases (id),
	FOREIGN KEY(reporter_id) REFERENCES profiles (id)
)

;

CREATE INDEX ix_case_events_case_id ON case_events (case_id);

CREATE INDEX ix_reports_reporter_id ON reports (reporter_id);

CREATE INDEX ix_reports_case_id ON reports (case_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

ALTER TABLE public.mutation_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mutation_receipts FROM anon, authenticated;

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.shipments FROM anon, authenticated;

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cases FROM anon, authenticated;

ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.case_events FROM anon, authenticated;

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.evidence FROM anon, authenticated;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.reports FROM anon, authenticated;
