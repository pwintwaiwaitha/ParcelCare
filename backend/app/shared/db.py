from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import create_engine, ForeignKey, String, Text, Integer, UniqueConstraint, CheckConstraint, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from .config import DATABASE_URL

def uid(): return str(uuid4())
def now(): return datetime.now(timezone.utc).isoformat()

class Base(DeclarativeBase): pass
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={'check_same_thread': False} if DATABASE_URL.startswith('sqlite') else {})
if DATABASE_URL.startswith('sqlite'):
    @event.listens_for(engine, 'connect')
    def sqlite_fk(connection, _): connection.execute('PRAGMA foreign_keys=ON')
Session = sessionmaker(engine, expire_on_commit=False)

class Profile(Base):
    __tablename__ = 'profiles'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20))
    __table_args__ = (CheckConstraint("role IN ('customer','rider','staff')"),)

class Shipment(Base):
    __tablename__ = 'shipments'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    tracking_id: Mapped[str] = mapped_column(String(40), unique=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey('profiles.id'))
    rider_id: Mapped[str] = mapped_column(ForeignKey('profiles.id'))
    label: Mapped[str] = mapped_column(String(150))
    destination: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(30), default='IN_TRANSIT')

class Case(Base):
    __tablename__ = 'cases'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    shipment_id: Mapped[str] = mapped_column(ForeignKey('shipments.id'))
    category: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), default='OPEN')
    priority: Mapped[str] = mapped_column(String(20), default='NORMAL')
    owner_id: Mapped[str | None] = mapped_column(ForeignKey('profiles.id'), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[str] = mapped_column(String(40), default=now)
    updated_at: Mapped[str] = mapped_column(String(40), default=now)
    __table_args__ = (CheckConstraint("status IN ('OPEN','TRIAGED','IN_PROGRESS','WAITING_CUSTOMER','WAITING_RIDER','ESCALATED','RESOLVED','REOPENED')"), CheckConstraint("priority IN ('LOW','NORMAL','HIGH','URGENT')"))

class Report(Base):
    __tablename__ = 'reports'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'), index=True)
    reporter_id: Mapped[str] = mapped_column(ForeignKey('profiles.id'), index=True)
    description: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String(40), default=now)

class CaseEvent(Base):
    __tablename__ = 'case_events'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'), index=True)
    actor_id: Mapped[str] = mapped_column(ForeignKey('profiles.id'))
    text: Mapped[str] = mapped_column(Text)
    visibility: Mapped[str] = mapped_column(String(20), default='public')
    created_at: Mapped[str] = mapped_column(String(40), default=now)

class Receipt(Base):
    __tablename__ = 'mutation_receipts'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    actor_id: Mapped[str] = mapped_column(ForeignKey('profiles.id'))
    action: Mapped[str] = mapped_column(String(100))
    key: Mapped[str] = mapped_column(String(100))
    fingerprint: Mapped[str] = mapped_column(String(64))
    result_id: Mapped[str] = mapped_column(String(36))
    __table_args__ = (UniqueConstraint('actor_id','action','key'),)

class Evidence(Base):
    __tablename__ = 'evidence'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    case_id: Mapped[str] = mapped_column(ForeignKey('cases.id'))
    uploader_id: Mapped[str] = mapped_column(ForeignKey('profiles.id'))
    name: Mapped[str] = mapped_column(String(150))
    mime: Mapped[str] = mapped_column(String(50))
    object_key: Mapped[str] = mapped_column(String(200), unique=True)

def db_session():
    with Session() as session: yield session
