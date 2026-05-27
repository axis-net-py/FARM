"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFields(tenantId: string) {
  try {
    return await prisma.field.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching fields:", error);
    throw new Error("Erro ao carregar talhões");
  }
}

export async function createField(tenantId: string, data: { name: string; areaHectares: number; soilType?: string }) {
  try {
    const field = await prisma.field.create({
      data: {
        tenantId,
        name: data.name,
        areaHectares: data.areaHectares,
        soilType: data.soilType || "Argiloso",
        status: "active",
      },
    });
    revalidatePath(`/${tenantId}/fields`);
    return field;
  } catch (error) {
    console.error("Error creating field:", error);
    throw new Error("Erro ao criar talhão");
  }
}

export async function deleteField(tenantId: string, id: string) {
  try {
    await prisma.field.delete({
      where: { id },
    });
    revalidatePath(`/${tenantId}/fields`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting field:", error);
    throw new Error("Erro ao deletar talhão");
  }
}
