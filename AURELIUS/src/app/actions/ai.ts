"use server";

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || "",
});

export interface AIResponse {
  success: boolean;
  message: string;
  intent?: string;
  data?: any;
}

export async function processAgroVoiceCommand(tenantId: string, text: string): Promise<AIResponse> {
  try {
    if (!text || text.trim() === "") {
      return { success: false, message: "Comando vazio ou inválido." };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback response for mock if API key is not present
      return simulateMockResponse(tenantId, text);
    }

    // Call Claude Sonnet to parse the command
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      temperature: 0,
      system: `Você é o AgriIA, o assistente de inteligência artificial do sistema Aurelius de gestão agrícola.
Sua tarefa é extrair dados estruturados de comandos de voz ou texto enviados pelo produtor em campo.

Regras de Extração:
1. Retorne APENAS um objeto JSON válido.
2. Campos obrigatórios: intent, data, confidence.
3. Intents suportados:
   - EXPENSE: Compras de insumos, pagamentos, peças. (campos: amount, category [SEEDS, FERTILIZER, PESTICIDE, FUEL, MAINTENANCE, LABOR, OTHER], description, field_name?)
   - HARVEST: Registro de colheita. (campos: quantity_tons, crop, field_name)
   - FUEL: Abastecimento de máquinas. (campos: liters, machinery_name, field_name?)
   - STOCK: Ajuste de estoque de insumos. (campos: item_name, quantity, type ['IN', 'OUT'])
   - FIELD: Cadastro de nova área ou talhão. (campos: name, area_ha, soil_type?)
   
Exemplo: "Registrar gasto de 1500 com fertilizante para o Talhão Sul"
Resposta: { "intent": "EXPENSE", "data": { "amount": 1500, "category": "FERTILIZER", "field_name": "Talhão Sul", "description": "Fertilizante" }, "confidence": 0.95 }`,
      messages: [{ role: "user", content: text }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return { success: false, message: "Formato de resposta inesperado do Claude." };
    }

    const parsed = JSON.parse(content.text);
    const { intent, data, confidence } = parsed;

    if (confidence < 0.5) {
      return { success: false, message: "Não consegui entender a intenção com clareza suficiente." };
    }

    // Record the raw intent log
    await prisma.aIInput.create({
      data: {
        tenantId,
        inputText: text,
        intent: intent,
        status: "pending",
      },
    });

    // Execute actions based on intent
    switch (intent) {
      case "FIELD": {
        const newField = await prisma.field.create({
          data: {
            tenantId,
            name: data.name,
            areaHectares: data.area_ha,
            soilType: data.soil_type || "Argiloso",
            status: "active",
          },
        });
        return {
          success: true,
          message: `Talhão **${newField.name}** (${newField.areaHectares} ha) cadastrado com sucesso!`,
          intent,
          data: newField,
        };
      }
      
      case "EXPENSE": {
        // Resolve field if name provided
        let resolvedField: any = null;
        if (data.field_name) {
          resolvedField = await prisma.field.findFirst({
            where: {
              tenantId,
              name: { contains: data.field_name, mode: "insensitive" },
            },
          });
        }

        // Create transaction / commercial invoice representation of expense
        const invoice = await prisma.commercialInvoice.create({
          data: {
            tenantId,
            type: "PURCHASE",
            status: "APPROVED",
            totalAmount: data.amount,
            notes: `${data.description || "Despesa via AgriIA"} ${resolvedField ? `no talhão ${resolvedField.name}` : ""}`,
            currency: "PYG",
          },
        });

        return {
          success: true,
          message: `Despesa de **${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(data.amount)}** registrada com sucesso${resolvedField ? ` para o talhão ${resolvedField.name}` : ""}.`,
          intent,
          data: invoice,
        };
      }

      case "FUEL": {
        // Find machinery
        let resolvedMachinery: any = null;
        if (data.machinery_name) {
          resolvedMachinery = await prisma.machinery.findFirst({
            where: {
              tenantId,
              name: { contains: data.machinery_name, mode: "insensitive" },
            },
          });
        }

        if (!resolvedMachinery) {
          // Auto create machinery if doesn't exist to make it robust
          resolvedMachinery = await prisma.machinery.create({
            data: {
              tenantId,
              name: data.machinery_name || "Trator Geral",
              type: "Trator",
            },
          });
        }

        // Resolve field if name provided
        let resolvedField: any = null;
        if (data.field_name) {
          resolvedField = await prisma.field.findFirst({
            where: {
              tenantId,
              name: { contains: data.field_name, mode: "insensitive" },
            },
          });
        }

        if (!resolvedField) {
          resolvedField = await prisma.field.findFirst({ where: { tenantId } });
        }

        // Create a default crop season to link if none exists
        let resolvedSeason = await prisma.cropSeason.findFirst({
          where: { tenantId, status: "active" },
        });

        if (!resolvedSeason) {
          resolvedSeason = await prisma.cropSeason.create({
            data: {
              tenantId,
              name: "Safra Principal",
              crop: "Soja",
              startDate: new Date(),
              status: "active",
            },
          });
        }

        // Log field operation for fuel spraying/refueling
        const op = await prisma.fieldOperation.create({
          data: {
            tenantId,
            fieldId: resolvedField!.id,
            cropSeasonId: resolvedSeason.id,
            machineryId: resolvedMachinery.id,
            operationType: "Spraying",
            notes: `Refuel ${data.liters}L via AgriIA command`,
          },
        });

        return {
          success: true,
          message: `Registrado abastecimento de **${data.liters} litros** para a máquina **${resolvedMachinery.name}** no talhão **${resolvedField?.name || "Principal"}**.`,
          intent,
          data: op,
        };
      }

      case "HARVEST": {
        // Resolve field
        let resolvedField: any = await prisma.field.findFirst({
          where: {
            tenantId,
            name: { contains: data.field_name, mode: "insensitive" },
          },
        });

        if (!resolvedField) {
          resolvedField = await prisma.field.findFirst({ where: { tenantId } });
        }

        if (!resolvedField) {
          return { success: false, message: `Não encontrei nenhum talhão correspondente a "${data.field_name || ""}"` };
        }

        let resolvedSeason = await prisma.cropSeason.findFirst({
          where: { tenantId, status: "active" },
        });

        if (!resolvedSeason) {
          resolvedSeason = await prisma.cropSeason.create({
            data: {
              tenantId,
              name: "Safra Colheita",
              crop: data.crop || "Soja",
              startDate: new Date(),
              status: "active",
            },
          });
        }

        const op = await prisma.fieldOperation.create({
          data: {
            tenantId,
            fieldId: resolvedField.id,
            cropSeasonId: resolvedSeason.id,
            operationType: "Harvesting",
            notes: `Colheita de ${data.quantity_tons} tons de ${data.crop || "Soja"} via AgriIA`,
          },
        });

        return {
          success: true,
          message: `Colheita de **${data.quantity_tons} toneladas** de **${data.crop || "Soja"}** no talhão **${resolvedField.name}** registrada com sucesso!`,
          intent,
          data: op,
        };
      }

      default:
        return { success: false, message: `Comando interpretado como "${intent}", mas ação correspondente não está implementada.` };
    }
  } catch (error: any) {
    console.error("AI Action Error: ", error);
    return { success: false, message: `Falha ao processar comando IA: ${error.message}` };
  }
}

async function simulateMockResponse(tenantId: string, text: string): Promise<AIResponse> {
  const lowercaseText = text.toLowerCase();
  
  // 1. Check for field registration
  if (lowercaseText.includes("adicionar") && (lowercaseText.includes("talhão") || lowercaseText.includes("talhao"))) {
    const areaMatch = lowercaseText.match(/(\d+)\s*ha/);
    const area = areaMatch ? parseFloat(areaMatch[1]) : 150;
    const nameMatch = lowercaseText.match(/talhã\w*\s+([a-zA-Z\s]+)/i) || lowercaseText.match(/talhao\s+([a-zA-Z\s]+)/i);
    const name = nameMatch ? nameMatch[1].trim() : "Talhão Leste";

    const field = await prisma.field.create({
      data: {
        tenantId,
        name,
        areaHectares: area,
        soilType: "Argiloso",
        status: "active",
      },
    });

    return {
      success: true,
      message: `[Simulação] Talhão **${field.name}** (${field.areaHectares} ha) cadastrado com sucesso!`,
      intent: "FIELD",
      data: field,
    };
  }

  // 2. Check for fuel/refueling
  if (lowercaseText.includes("abastec") || lowercaseText.includes("litro") || lowercaseText.includes("diesel")) {
    const litersMatch = lowercaseText.match(/(\d+)\s*(litros|l)/);
    const liters = litersMatch ? parseFloat(litersMatch[1]) : 50;
    const machineryName = lowercaseText.includes("trator") ? "Trator JD-450" : "Colheitadeira JD-700";

    let resolvedMachinery = await prisma.machinery.findFirst({
      where: { tenantId, name: machineryName },
    });

    if (!resolvedMachinery) {
      resolvedMachinery = await prisma.machinery.create({
        data: {
          tenantId,
          name: machineryName,
          type: "Trator",
        },
      });
    }

    let resolvedField = await prisma.field.findFirst({ where: { tenantId } });
    if (!resolvedField) {
      resolvedField = await prisma.field.create({
        data: {
          tenantId,
          name: "Talhão Sul",
          areaHectares: 120,
          status: "active",
        },
      });
    }

    let resolvedSeason = await prisma.cropSeason.findFirst({ where: { tenantId, status: "active" } });
    if (!resolvedSeason) {
      resolvedSeason = await prisma.cropSeason.create({
        data: {
          tenantId,
          name: "Safra Principal",
          crop: "Soja",
          startDate: new Date(),
          status: "active",
        },
      });
    }

    const op = await prisma.fieldOperation.create({
      data: {
        tenantId,
        fieldId: resolvedField.id,
        cropSeasonId: resolvedSeason.id,
        machineryId: resolvedMachinery.id,
        operationType: "Spraying",
        notes: `Abastecimento de ${liters}L via AgriIA (Mock)`,
      },
    });

    return {
      success: true,
      message: `[Simulação] Abastecimento de **${liters} litros** de diesel para **${resolvedMachinery.name}** no talhão **${resolvedField.name}** registrado com sucesso.`,
      intent: "FUEL",
      data: op,
    };
  }

  // 3. Check for expense
  if (lowercaseText.includes("gastei") || lowercaseText.includes("gasto") || lowercaseText.includes("custo")) {
    const amountMatch = lowercaseText.match(/(\d+(\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 2500;

    const invoice = await prisma.commercialInvoice.create({
      data: {
        tenantId,
        type: "PURCHASE",
        status: "APPROVED",
        totalAmount: amount,
        notes: "Despesa registrada via comando AgriIA (Mock)",
        currency: "PYG",
      },
    });

    return {
      success: true,
      message: `[Simulação] Despesa de **${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(amount)}** registrada com sucesso.`,
      intent: "EXPENSE",
      data: invoice,
    };
  }

  // Default fallback
  return {
    success: false,
    message: "Comando não reconhecido na simulação. Experimente dizer 'adicionar talhão Norte com 200 ha' ou 'abastecer 50 litros no trator'.",
  };
}
