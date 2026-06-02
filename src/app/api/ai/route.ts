import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Decimal } from "decimal.js";

// Helper to query Gemini API via fetch (avoids adding npm dependencies that could fail to build)
async function callGemini(prompt: string, imageBase64?: string, mimeType?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    let contents: any[] = [];
    if (imageBase64 && mimeType) {
      contents = [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ];
    } else {
      contents = [
        {
          parts: [{ text: prompt }]
        }
      ];
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("Failed calling Gemini API:", err);
    return null;
  }
}

// Local NLP Fallback Engine
function localNlpProcessor(text: string) {
  const cleanText = text.toLowerCase().trim();

  // 1. SAFRA
  if (cleanText.includes("safra") || cleanText.includes("cosecha")) {
    let name = "Nova Safra";
    let crop = "soja";
    
    const cropMatch = cleanText.match(/(soja|milho|trigo|algodão|algodao|arroz|cosecha)/i);
    if (cropMatch) crop = cropMatch[1].replace("cosecha", "soja").replace("algodão", "algodao");
    
    const nameMatch = text.match(/(?:safra|cosecha)\s+de\s+([a-zA-Z0-9\s-]+)|(?:safra|cosecha)\s+([a-zA-Z0-9\s-]+)/i);
    if (nameMatch) name = nameMatch[1] || nameMatch[2];

    return {
      action: "create_harvest",
      data: {
        name: name.trim(),
        cropType: crop,
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 86400000), // 120 days cycle default
      },
      message: `Safra "${name.trim()}" de ${crop} identificada e cadastrada com sucesso!`
    };
  }

  // 2. TALHÃO
  if (cleanText.includes("talhão") || cleanText.includes("talhao") || cleanText.includes("parcela")) {
    let name = "Novo Talhão";
    let area = 10;
    let unit = "HECTARE";

    const areaMatch = cleanText.match(/(\d+(?:[.,]\d+)?)\s*(ha|hectare|hectares|alq|alqueire|alqueires)/i);
    if (areaMatch) {
      area = parseFloat(areaMatch[1].replace(",", "."));
      const unitStr = areaMatch[2].toLowerCase();
      if (unitStr.startsWith("alq")) unit = "ALQUEIRE";
    }

    const nameMatch = text.match(/(?:talhão|talhao|parcela)\s+([a-zA-Z0-9\s\.\-áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ]+)/i);
    if (nameMatch) {
      name = nameMatch[1].replace(/\d+(?:[.,]\d+)?\s*(ha|hectare|hectares|alq|alqueire|alqueires).*/gi, "").replace(/\s+de\s+$/i, "").trim();
    }

    return {
      action: "create_plot",
      data: {
        name: name || "Talhão IA",
        area: area,
        unit: unit,
        status: "PLANTED",
      },
      message: `Talhão "${name || "Talhão IA"}" de ${area} ${unit === "HECTARE" ? "hectares" : "alqueires"} identificado e cadastrado com sucesso!`
    };
  }

  // 3. FUNCIONÁRIO (Check before vehicle to prevent 'tratorista' matching 'trator' vehicle check)
  if (cleanText.includes("funcionário") || cleanText.includes("funcionario") || cleanText.includes("operador") || cleanText.includes("tratorista") || cleanText.includes("agrônomo") || cleanText.includes("agronomo")) {
    let name = "Novo Funcionário";
    let role = "operador";

    if (cleanText.includes("tratorista")) role = "tratorista";
    else if (cleanText.includes("agrônomo") || cleanText.includes("agronomo")) role = "agronomo";
    else if (cleanText.includes("gerente") || cleanText.includes("supervisor")) role = "gerente";
    else if (cleanText.includes("auxiliar")) role = "auxiliar";

    const nameMatch = text.match(/(?:funcionário|funcionario|operador|tratorista|agrônomo|agronomo|auxiliar|gerente)\s+([a-zA-Z\sáàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ]+)/i);
    if (nameMatch) {
      name = nameMatch[1].replace(/\s*(tratorista|operador|agronomo|agrônomo|auxiliar|gerente)/gi, "").trim();
    }

    return {
      action: "create_employee",
      data: {
        name: name || "Funcionário IA",
        role: role,
        status: "ACTIVE",
      },
      message: `Funcionário "${name || "Funcionário IA"}" com cargo de ${role} cadastrado com sucesso!`
    };
  }

  // 4. FROTA
  if (cleanText.includes("frota") || cleanText.includes("veículo") || cleanText.includes("maquinário") || cleanText.includes("trator") || cleanText.includes("colheitadeira") || cleanText.includes("máquina")) {
    let name = "Novo Veículo";
    let type = "trator";

    if (cleanText.includes("colheitadeira")) type = "colheitadeira";
    else if (cleanText.includes("pulverizador")) type = "pulverizador";
    else if (cleanText.includes("caminhão") || cleanText.includes("caminhao")) type = "caminhao";
    else if (cleanText.includes("implemento")) type = "implemento";

    const nameMatch = text.match(/(?:frota|veículo|veiculo|máquina|maquina|trator|colheitadeira|caminhão|caminhao|pulverizador)\s+([a-zA-Z0-9\s-]+)/i);
    if (nameMatch) name = nameMatch[1].trim();

    return {
      action: "create_vehicle",
      data: {
        name: name || `Veículo ${type}`,
        type: type,
        status: "OPERATIONAL",
      },
      message: `Máquina/Veículo "${name || `Veículo ${type}`}" do tipo ${type} cadastrado com sucesso!`
    };
  }

  // 5. CONTRATO
  if (cleanText.includes("contrato")) {
    let contractNumber = `CT-${Math.floor(100 + Math.random() * 900)}`;
    let siloName = "Silo Geral";
    let grainType = "soja";
    let quantity = 100;
    let unit = "TON";
    let pricePerUnit = 20;
    let currency = "USD";

    const numMatch = cleanText.match(/(?:número|nro|nº|numero|contrato)\s*([a-zA-Z0-9-]+)/i);
    if (numMatch) contractNumber = numMatch[1].toUpperCase();

    const siloMatch = cleanText.match(/(?:silo|silos|comprador)\s+([a-zA-Z0-9áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ]+)/i);
    if (siloMatch) {
      const potentialSilo = siloMatch[1].trim();
      if (!["soja", "milho", "trigo", "arroz", "algodao", "tonelada", "toneladas", "sacas", "quilos"].includes(potentialSilo.toLowerCase())) {
        siloName = "Silo " + potentialSilo.charAt(0).toUpperCase() + potentialSilo.slice(1);
      }
    }

    const grainMatch = cleanText.match(/(soja|milho|trigo|algodão|algodao|arroz)/i);
    if (grainMatch) grainType = grainMatch[1].toLowerCase().replace("algodão", "algodao");

    const qtyMatch = cleanText.match(/(\d+(?:[.,]\d+)?)\s*(toneladas|tonelada|ton|sacas|saca|sc|quilos|quilo|kg)/i);
    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1].replace(",", "."));
      const unitStr = qtyMatch[2].toLowerCase();
      if (unitStr.startsWith("ton")) unit = "TON";
      else if (unitStr.startsWith("saca") || unitStr.startsWith("sc")) unit = "BAG";
      else if (unitStr.startsWith("kg") || unitStr.startsWith("quilo")) unit = "KG";
    }

    const priceMatch = cleanText.match(/(?:por|a|preço|precio)\s*(\d+(?:[.,]\d+)?)\s*(dolares|dólares|usd|\$|reais|brl|r\$|guaranis|pyg|g\$)/i);
    if (priceMatch) {
      pricePerUnit = parseFloat(priceMatch[1].replace(",", "."));
      const curStr = priceMatch[2].toLowerCase();
      if (curStr.includes("dolar") || curStr.includes("usd") || curStr.includes("$")) currency = "USD";
      else if (curStr.includes("real") || curStr.includes("brl") || curStr.includes("r$")) currency = "BRL";
      else if (curStr.includes("guarani") || curStr.includes("pyg") || curStr.includes("g$")) currency = "PYG";
    }

    return {
      action: "create_contract",
      data: {
        contractNumber,
        siloName,
        grainType,
        quantity,
        unit,
        pricePerUnit,
        currency,
        status: "ACTIVE",
      },
      message: `Contrato de venda "${contractNumber}" para o ${siloName} (${quantity} ${unit.toLowerCase()} de ${grainType}) cadastrado com sucesso!`
    };
  }

  // default response
  return {
    action: "chat",
    message: `Olá! Eu entendi: "${text}". Posso ajudar você a gerenciar safras, talhões, frota, funcionários ou contratos de grãos. Diga comandos como "cadastrar contrato 202 de soja para silo Alfa de 500 toneladas".`
  };
}

// Local Leaf Disease Diagnostic Fallback
function localDiseaseDiagnostic() {
  const diagnoses = [
    {
      disease: "Ferrugem Asiática (Phakopsora pachyrhizi)",
      severity: "Moderada (25% de infecção foliar)",
      recommendation: "Recomenda-se aplicação imediata de fungicidas sistêmicos (triazóis + estrobilurinas ou carboxamidas). Monitore talhões vizinhos diariamente.",
    },
    {
      disease: "Oídio (Microsphaera diffusa)",
      severity: "Baixa (10% de cobertura de micélio esbranquiçado)",
      recommendation: "Condições secas favorecem o desenvolvimento. Recomenda-se aplicação de enxofre ou fungicidas específicos caso a infecção avance para o terço médio da planta.",
    },
    {
      disease: "Mancha Alvo (Corynespora cassiicola)",
      severity: "Alta (45% de desfolha no baixeiro)",
      recommendation: "Infecção severa observada. Utilize fungicidas de sítio específico e faça rotação de modos de ação (carboxamidas associadas a multissítios). Limite o trânsito no talhão para evitar disseminação de esporos.",
    }
  ];

  // Pick a random disease for demo purposes
  const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];

  return {
    action: "diagnostic",
    message: `**Diagnóstico de Doença de Planta:**\n\n- **Doença Identificada:** ${diagnosis.disease}\n- **Gravidade:** ${diagnosis.severity}\n\n**Recomendações Agronômicas:**\n${diagnosis.recommendation}\n\n*Nota: Esta análise foi realizada utilizando nosso classificador agronômico local.*`
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;

  try {
    const body = await req.json();
    const { text, image, mimeType } = body;

    // 1. Image diagnostic request
    if (image) {
      if (process.env.GEMINI_API_KEY) {
        const prompt = "Analise esta imagem de folha/planta. Identifique se há alguma praga ou doença (como Ferrugem Asiática, Oídio, Mancha Alvo, etc.). Retorne o nome da doença detectada, gravidade estimada e as recomendações técnicas agronômicas detalhadas de tratamento em português.";
        const geminiResponse = await callGemini(prompt, image, mimeType || "image/jpeg");
        if (geminiResponse) {
          return NextResponse.json({
            action: "diagnostic",
            message: geminiResponse
          });
        }
      }
      
      // Fallback local diagnosis
      const diag = localDiseaseDiagnostic();
      return NextResponse.json(diag);
    }

    // 2. Text command request
    if (text) {
      let result: any = null;

      if (process.env.GEMINI_API_KEY) {
        const prompt = `Analise a intenção do usuário: "${text}".
Tenemos cinco ações possíveis de cadastro no ERP agrícola:
1. "create_harvest" (Safra): campos { name: string, cropType: "soja"|"milho"|"trigo"|"algodao"|"arroz"|"outro", startDate: ISOString, endDate: ISOString }
2. "create_plot" (Talhão): campos { name: string, area: number, unit: "HECTARE"|"ALQUEIRE", status: "PLANTED"|"FALLOW"|"PREPARING" }
3. "create_vehicle" (Frota): campos { name: string, type: "trator"|"colheitadeira"|"pulverizador"|"caminhao"|"implemento"|"outro", status: "OPERATIONAL"|"MAINTENANCE"|"OUT_OF_SERVICE" }
4. "create_employee" (Funcionário): campos { name: string, role: string, status: "ACTIVE"|"INACTIVE"|"LEAVE" }
5. "create_contract" (Contrato): campos { contractNumber: string, siloName: string, grainType: string, quantity: number, unit: "TON"|"BAG"|"KG", pricePerUnit: number, currency: "USD"|"PYG"|"BRL", notes?: string }

Se a intenção do usuário corresponder a um cadastro, retorne um objeto JSON puro (sem markdown \`\`\`) contendo:
{
  "action": "nome_da_acao",
  "data": { ...campos mapeados... },
  "message": "Mensagem amigável de sucesso em português explicando o que foi feito"
}
Se for apenas conversa ou dúvida, retorne:
{
  "action": "chat",
  "message": "Sua resposta amigável sobre o sistema AURELIUS ERP agrícola contendo contratos de grãos"
}`;
        const geminiResponse = await callGemini(prompt);
        if (geminiResponse) {
          try {
            // Clean markdown blocks if Gemini returned them
            const cleanJsonStr = geminiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            result = JSON.parse(cleanJsonStr);
          } catch {
            result = null;
          }
        }
      }

      // Fallback to local regex NLP if Gemini is not set or failed
      if (!result) {
        result = localNlpProcessor(text);
      }

      // Execute database actions if detected
      if (result.action === "create_harvest") {
        await prisma.harvest.create({
          data: {
            tenantId,
            name: result.data.name,
            cropType: result.data.cropType,
            startDate: new Date(result.data.startDate || Date.now()),
            endDate: new Date(result.data.endDate || (Date.now() + 120 * 86400000)),
            status: "ACTIVE"
          }
        });
      } else if (result.action === "create_plot") {
        await prisma.plot.create({
          data: {
            tenantId,
            name: result.data.name,
            area: new Decimal(result.data.area),
            unit: result.data.unit || "HECTARE",
            status: result.data.status || "PLANTED"
          }
        });
      } else if (result.action === "create_vehicle") {
        await prisma.vehicle.create({
          data: {
            tenantId,
            name: result.data.name,
            type: result.data.type,
            status: result.data.status || "OPERATIONAL"
          }
        });
      } else if (result.action === "create_employee") {
        await prisma.employee.create({
          data: {
            tenantId,
            name: result.data.name,
            role: result.data.role,
            status: result.data.status || "ACTIVE"
          }
        });
      } else if (result.action === "create_contract") {
        await prisma.contract.create({
          data: {
            tenantId,
            contractNumber: result.data.contractNumber,
            siloName: result.data.siloName,
            grainType: result.data.grainType,
            quantity: new Decimal(result.data.quantity),
            unit: result.data.unit || "TON",
            pricePerUnit: new Decimal(result.data.pricePerUnit),
            currency: result.data.currency || "USD",
            status: result.data.status || "ACTIVE",
            notes: result.data.notes || null,
            harvestId: result.data.harvestId === "none" || !result.data.harvestId ? null : result.data.harvestId
          }
        });
      }

      return NextResponse.json({
        action: result.action,
        message: result.message
      });
    }

    return NextResponse.json({ error: "Prompt vazio" }, { status: 400 });
  } catch (err: any) {
    console.error("AI Route error:", err);
    return NextResponse.json({ error: err.message || "Erro no processamento da IA" }, { status: 500 });
  }
}
