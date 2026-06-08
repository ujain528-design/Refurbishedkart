"use client";

// Any button on the page can open the Bulk Enquiry modal by dispatching this event.
export const OPEN_BULK_MODAL_EVENT = "rk:open-bulk-modal";

export default function BulkEnquiryTrigger({ className = "", children }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_BULK_MODAL_EVENT))}
    >
      {children}
    </button>
  );
}
