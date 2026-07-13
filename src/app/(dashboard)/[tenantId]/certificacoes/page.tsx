import { getCertifications } from "@/app/actions/certification";
import { CertificationSheet } from "@/components/CertificationSheet";
import { CertificationList } from "@/components/CertificationList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CertificacoesPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const certifications = await getCertifications();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Certificações</h1>
          <p className="text-muted-foreground text-sm">Certificações e validade — orgânico, GLOBALG.A.P e outras</p>
        </div>
        <div className="self-start sm:self-auto">
          <CertificationSheet />
        </div>
      </div>

      <CertificationList certifications={certifications} />
    </div>
  );
}
