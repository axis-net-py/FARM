"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSeasons(tenantId: string) {
  try {
    return await prisma.cropSeason.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
    });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    throw new Error("Erro ao carregar safras");
  }
}

export async function createSeason(tenantId: string, data: { name: string; crop: string; startDate: string; endDate?: string }) {
  try {
    const season = await prisma.cropSeason.create({
      data: {
        tenantId,
        name: data.name,
        crop: data.crop,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: "active",
      },
    });
    revalidatePath(`/${tenantId}/seasons`);
    return season;
  } catch (error) {
    console.error("Error creating season:", error);
    throw new Error("Erro ao criar safra");
  }
}

export async function deleteSeason(tenantId: string, id: string) {
  try {
    await prisma.cropSeason.delete({
      where: { id },
    });
    revalidatePath(`/${tenantId}/seasons`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting season:", error);
    throw new Error("Erro ao deletar safra");
  }
}
