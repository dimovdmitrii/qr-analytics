import { formatDistanceToNow } from "date-fns";

type ScanRow = {
  id: string;
  scannedAt: Date;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  qrCode: { label: string };
};

export function RecentScans({ scans }: { scans: ScanRow[] }) {
  if (scans.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No scans yet — share a QR code to see activity here.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {scans.map((scan) => (
        <div key={scan.id} className="flex items-center justify-between py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="live-pulse h-2 w-2 rounded-full bg-primary" />
            <span className="font-medium">{scan.qrCode.label}</span>
            <span className="text-muted">
              {[scan.city, scan.country].filter(Boolean).join(", ") || "Unknown location"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{scan.deviceType ?? "unknown"} · {scan.browser ?? "unknown"}</span>
            <span>{formatDistanceToNow(scan.scannedAt, { addSuffix: true })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
