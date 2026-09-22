// WhatsApp deep-link helpers.
// Number lives in one place: VITE_WHATSAPP_NUMBER (digits only, with country code).
// Falls back to the studio number already used across the site.
const RAW = (import.meta.env.VITE_WHATSAPP_NUMBER || "260970000000").replace(/\D/g, "");

export const waLink = (message) =>
  `https://wa.me/${RAW}?text=${encodeURIComponent(message)}`;

export const bookingMsg = (b) =>
  [
    "Hello OPULUXE! I just booked an appointment:",
    "",
    `Reference: ${b.reference}`,
    `Service: ${b.serviceName}`,
    `Date: ${b.date}`,
    `Time: ${b.time}`,
    `Name: ${b.customerName}`,
    "",
    "Please confirm my booking. Thank you!",
  ].join("\n");
