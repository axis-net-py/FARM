import { getSilos } from "@/app/actions/silo";
import { SiloSheet } from "@/components/SiloSheet";
import { SiloList } from "@/components/SiloList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SilosPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const silos = await getSilos();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Silos</h1>
          <p className="text-muted-foreground text-sm">Estoque de grão armazenado na fazenda</p>
        </div>
        <div className="self-start sm:self-auto">
          <SiloSheet />
        </div>
      </div>

      <SiloList silos={silos} tenantId={tenantId} />
    </div>
  );
}
