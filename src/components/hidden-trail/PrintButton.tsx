"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  const handlePrint = () => window.print();
  return (
    <button
      type="button"
      onClick={handlePrint}
      className="ht-poster-btn ht-poster-btn-primary"
    >
      <Printer aria-hidden="true" size={16} />
      {label}
    </button>
  );
}