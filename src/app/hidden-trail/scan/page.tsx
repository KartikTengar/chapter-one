import { Metadata } from "next";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";
import { HiddenTrailScannerClient } from "@/components/hidden-trail/HiddenTrailScannerClient";

export const metadata: Metadata = {
  title: "Scan Marker | Chapter One",
  description: "Scan your Hidden Trail marker",
};

export default function ScanPage() {
  return (
    <HiddenTrailShell>
      <HiddenTrailScannerClient />
    </HiddenTrailShell>
  );
}
