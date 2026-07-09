import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { tenantId, email, role } = await requireTenant();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId! } }).catch(() => null);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Company profile and account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <Label>Company name</Label>
            <Input defaultValue={tenant?.name ?? ""} disabled />
          </div>
          <div>
            <Label>Plan</Label>
            <Input defaultValue={tenant?.plan ?? "free"} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <Label>Email</Label>
            <Input defaultValue={email} disabled />
          </div>
          <div>
            <Label>Role</Label>
            <Input defaultValue={role} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
