import { NextResponse } from "next/server";
import { getLocalPalLocationSummary } from "@/lib/server/pal-detail-local";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const location = getLocalPalLocationSummary(decoded);

  if (!location) {
    return NextResponse.json(
      {
        detail: {
          code: "PAL.LOCATION.NOT_FOUND",
          message: `No location data for '${decoded}'`,
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: location });
}
