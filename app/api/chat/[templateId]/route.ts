import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getServiceCatalogueText } from '@/lib/data/azure-service-catalogue';
import { findPricing, getMonthlyFromHourly } from '@/lib/data/azure-pricing';
import type { AzureResource } from '@/types/templates';

interface ChatRequest {
  message: string;
  config?: Record<string, unknown>;
}

interface AIResourceItem {
  name: string;
  serviceName: string;
  skuName: string;
  environment: string;
  quantity: number;
  category: string;
  notes?: string;
}

interface AIResponse {
  resources: AIResourceItem[];
  summary: string;
}

const AZURE_SYSTEM_PROMPT = `You are an Azure cost estimation assistant. Users describe their Azure infrastructure in plain English. You map their requirements to real Azure services and SKUs from the catalogue provided.

RULES:
1. Return ONLY a valid JSON object — no markdown, no explanation, just the JSON.
2. The JSON must match this exact schema:
{
  "resources": [
    {
      "name": "string (friendly display name for the Excel row)",
      "serviceName": "string (MUST exactly match a service name from the catalogue below)",
      "skuName": "string (MUST exactly match one of that service's SKUs from the catalogue)",
      "environment": "string (e.g. Production, Development, UAT — infer from context, default Production)",
      "quantity": number,
      "category": "string (one of: Compute, Storage, Networking, Databases, AI & ML, Security, Monitoring, Other)"
    }
  ],
  "summary": "string (1-2 sentences explaining what you matched and any assumptions)"
}
3. serviceName and skuName MUST be exact character-for-character matches from the catalogue.
4. If you cannot confidently match a resource, use your best guess and add a "notes" field: "May need manual review — SKU estimated".
5. If the user specifies an environment (prod, dev, uat, staging), map it to the full word (Production, Development, UAT, Staging).
6. If quantity is not specified, default to 1.
7. Do not add resources the user did not mention.

AZURE SERVICE CATALOGUE (ServiceName: sku1, sku2, ...):
`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  // Only azure-calculator has AI support in v1. Future templates add their own handler.
  if (templateId !== 'azure-calculator') {
    return NextResponse.json(
      { error: `AI chat is not yet supported for template: ${templateId}` },
      { status: 400 }
    );
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    const catalogueText = getServiceCatalogueText();
    const systemPrompt = AZURE_SYSTEM_PROMPT + catalogueText;

    const provider = getAIProvider();
    const rawResponse = await provider.complete(
      [{ role: 'user', content: body.message }],
      systemPrompt
    );

    // Strip markdown code fences if the AI wraps its JSON
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim();

    let aiResult: AIResponse;
    try {
      aiResult = JSON.parse(cleaned) as AIResponse;
    } catch {
      console.error('[chat/azure] AI returned non-JSON:', rawResponse);
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try rephrasing your request.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(aiResult.resources)) {
      return NextResponse.json(
        { error: 'AI response missing resources array.' },
        { status: 500 }
      );
    }

    // Resolve real prices server-side — the AI never provides costs
    const resources: AzureResource[] = aiResult.resources.map((r) => {
      const pricing = findPricing(r.serviceName, r.skuName);
      let unitMonthlyCost = 0;
      let notes = r.notes;

      if (pricing) {
        unitMonthlyCost = pricing.unit.includes('Hour')
          ? getMonthlyFromHourly(pricing.price)
          : pricing.price;
      } else {
        const fallback = 'SKU not found in pricing data — enter cost manually';
        notes = notes ? `${notes}; ${fallback}` : fallback;
      }

      return {
        name: r.name,
        serviceName: r.serviceName,
        skuName: r.skuName,
        environment: r.environment,
        quantity: Math.max(1, Math.round(r.quantity)),
        unitMonthlyCost,
        category: r.category,
        ...(notes ? { notes } : {}),
      };
    });

    const totalMonthly = resources.reduce(
      (sum, r) => sum + r.unitMonthlyCost * r.quantity,
      0
    );

    return NextResponse.json({ resources, summary: aiResult.summary, totalMonthly });
  } catch (err) {
    console.error('[chat/azure] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to process request: ${message}` }, { status: 500 });
  }
}
