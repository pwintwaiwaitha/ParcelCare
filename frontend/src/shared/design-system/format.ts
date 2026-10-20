export const LABELS: Record<string, string> = {
  WRONG_ADDRESS: "Wrong or incomplete address",
  WRONG_ITEM: "Wrong item",
  DAMAGED: "Damaged parcel",
  DELAYED: "Delivery delayed",
  MISSING: "Missing parcel",
  NOT_RECEIVED: "Delivered but not received",
  RESCHEDULE: "Reschedule delivery",
  CUSTOMER_UNAVAILABLE: "Customer unavailable",
  CUSTOMER_UNREACHABLE: "Customer unreachable",
  REFUSED: "Delivery refused",
  ACCIDENT: "Rider accident",
  BREAKDOWN: "Vehicle breakdown",
  LOST: "Parcel lost",
  ACCESS: "Delivery access issue",
};
export const label = (value: string) =>
  LABELS[value] || value.toLowerCase().replaceAll("_", " ");
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Rangoon",
  }).format(new Date(value));
export const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
