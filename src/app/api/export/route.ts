import { NextRequest, NextResponse } from "next/server";
import { ExportService, ExportOptions } from "@/lib/services/export";
import { ExportOptionsSchema, validateRequestBody } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(ExportOptionsSchema, body);

    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const options: ExportOptions = validation.data;

    const result = await ExportService.exportCampaign(options);

    // Set appropriate headers based on format
    const headers: Record<string, string> = {};

    switch (options.format) {
      case "pdf":
        headers["Content-Type"] = "application/pdf";
        headers["Content-Disposition"] =
          `attachment; filename="campaign-export.pdf"`;
        break;
      case "markdown":
        headers["Content-Type"] = "text/markdown";
        headers["Content-Disposition"] =
          `attachment; filename="campaign-export.md"`;
        break;
      case "html":
        headers["Content-Type"] = "text/html";
        headers["Content-Disposition"] =
          `attachment; filename="campaign-export.html"`;
        break;
      case "json":
        headers["Content-Type"] = "application/json";
        headers["Content-Disposition"] =
          `attachment; filename="campaign-export.json"`;
        break;
    }

    // Handle different return types
    if (options.format === "pdf" && result instanceof Buffer) {
      return new Response(new Uint8Array(result), { headers });
    } else {
      return NextResponse.json(
        { success: true, data: typeof result === "string" ? { content: result } : result },
        { headers },
      );
    }
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
