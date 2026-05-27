"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMachineries(tenantId: string) {
  try {
    return await prisma.machinery.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching machinery:", error);
    throw new Error("Erro ao carregar maquinários");
  }
}

export async function createMachinery(tenantId: string, data: { name: string; type?: string; brand?: string; model?: string; year?: number; currentHours?: number }) {
  try {
    const machine = await prisma.machinery.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type || "Trator",
        brand: data.brand || null,
        model: data.model || null,
        year: data.year || null,
        currentHours: data.currentHours || null,
      },
    });
    revalidatePath(`/${tenantId}/fleet`);
    return machine;
  } catch (error) {
    console.error("Error creating machinery:", error);
    throw new Error("Erro ao criar maquinário");
  }
}

export async function deleteMachinery(tenantId: string, id: string) {
  try {
    await prisma.machinery.delete({
      where: { id },
    });
    revalidatePath(`/${tenantId}/fleet`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting machinery:", error);
    throw new Error("Erro ao deletar maquinário");
  }
}
