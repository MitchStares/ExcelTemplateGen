import { NextRequest, NextResponse } from "next/server";
import { generateWorkbook, templateMap } from "@/lib/templates";
import type { GenerateRequest } from "@/types/templates";

export async function POST(request: NextRequest) {
  let body: GenerateRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { templateId, config } = body;

  if (!templateId || typeof templateId !== "string") {
    return NextResponse.json({ error: "Missing or invalid templateId" }, { status: 400 });
  }

  if (!templateMap[templateId]) {
    return NextResponse.json({ error: `Unknown template: ${templateId}` }, { status: 404 });
  }

  if (!config || typeof config !== "object") {
    return NextResponse.json({ error: "Missing or invalid config" }, { status: 400 });
  }

  try {
    const workbook = await generateWorkbook(templateId, config);

    // Write workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const templateName = templateMap[templateId].name.replace(/[^a-z0-9]/gi, "_");
    const filename = `${templateName}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[generate] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to generate workbook: ${message}` }, { status: 500 });
  }
}
