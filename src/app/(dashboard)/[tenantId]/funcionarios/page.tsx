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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground text-sm">Gerencie os funcionários da fazenda e seus cargos</p>
        </div>
        <EmployeeSheet tenantId={tenantId} />
      </div>

      <EmployeeList employees={employees} tenantId={tenantId} />
    </div>
  );
}
