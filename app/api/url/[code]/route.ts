import { NextRequest, NextResponse } from "next/server";
import { resolveLinkAndTrack, LinkRedirectError } from "@/lib/linkRedirect";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const destination = await resolveLinkAndTrack(code, request);
    return NextResponse.redirect(destination, { status: 302 });
  } catch (error: any) {
    if (error instanceof LinkRedirectError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Redirect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
