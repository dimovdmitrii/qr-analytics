"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type QrRow = {
  id: string;
  label: string;
  targetUrl: string;
  shortCode: string;
  status: string;
  createdAt: Date;
  _count: { scanEvents: number };
};

export function QrTable({ codes, appUrl }: { codes: QrRow[]; appUrl: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyLink(id: string, shortCode: string) {
    navigator.clipboard.writeText(`${appUrl}/r/${shortCode}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (codes.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No QR codes yet — create your first one to start tracking scans.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2 pr-4 font-medium">Label</th>
            <th className="py-2 pr-4 font-medium">Destination</th>
            <th className="py-2 pr-4 font-medium">Scans</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {codes.map((qr) => (
            <tr key={qr.id}>
              <td className="py-3 pr-4 font-medium">{qr.label}</td>
              <td className="max-w-[220px] truncate py-3 pr-4 text-muted">
                <a href={qr.targetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                  {qr.targetUrl}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </td>
              <td className="py-3 pr-4">{qr._count.scanEvents}</td>
              <td className="py-3 pr-4">
                <Badge status={qr.status}>{qr.status}</Badge>
              </td>
              <td className="py-3 pr-4">
                <Button variant="outline" size="sm" onClick={() => copyLink(qr.id, qr.shortCode)}>
                  {copiedId === qr.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedId === qr.id ? "Copied!" : "Copy link"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
