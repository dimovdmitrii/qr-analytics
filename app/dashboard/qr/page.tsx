import { requireTenant } from "@/lib/tenant";
import { listQrCodes } from "@/lib/data/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrTable } from "@/components/dashboard/qr-table";
import { CreateQrDialog } from "@/components/dashboard/create-qr-dialog";

export const dynamic = "force-dynamic";

export default async function QrManagerPage() {
  const { tenantId } = await requireTenant();
  const codes = await listQrCodes(tenantId!);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">QR codes</h1>
          <p className="text-sm text-muted">Manage the codes linked to your account.</p>
        </div>
        <CreateQrDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-sm">All QR codes ({codes.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <QrTable codes={codes as never} appUrl={appUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
