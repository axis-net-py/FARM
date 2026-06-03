import { getEmployees } from "@/app/actions/funcionario";
import { EmployeeSheet } from "@/components/EmployeeSheet";
import { EmployeeList } from "@/components/EmployeeList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function FuncionariosPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const employees = await getEmployees();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Funcionários</h1>
          <p className="text-muted-foreground text-sm">Gerencie os funcionários da fazenda e seus cargos</p>
        </div>
        <div className="self-start sm:self-auto">
          <EmployeeSheet tenantId={tenantId} />
        </div>
      </div>

      <EmployeeList employees={employees} tenantId={tenantId} />
    </div>
  );
}
