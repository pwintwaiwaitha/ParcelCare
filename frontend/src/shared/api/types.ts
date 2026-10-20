export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  local_demo: boolean;
  categories: string[];
};
export type Shipment = {
  id: string;
  tracking_id: string;
  label: string;
  destination: string;
  status: string;
};
export type Case = {
  id: string;
  tracking_id: string;
  shipment_label: string;
  category: string;
  status: string;
  priority: string;
  owner: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  manual_only: boolean;
};
export type Detail = Case & {
  related_cases: { id: string; status: string }[];
  reports: {
    id: string;
    description: string;
    source: string;
    created_at: string;
  }[];
  events: {
    id: string;
    text: string;
    visibility: string;
    created_at: string;
  }[];
  evidence: { id: string; name: string }[];
  allowed_statuses: string[];
};
