import { NextResponse } from "next/server";
import { getLocalPalDetail } from "@/lib/server/pal-detail-local";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const pal = getLocalPalDetail(decoded);

  if (!pal) {
    return NextResponse.json(
      {
        detail: {
          code: "PAL.DETAIL.NOT_FOUND",
          message: `Pal '${decoded}' not found`,
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: pal });
}
