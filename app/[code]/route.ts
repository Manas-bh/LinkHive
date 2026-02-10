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
      return new NextResponse(renderErrorPage(error.message), {
        status: error.status,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }

    console.error("Redirect error:", error);
    return new NextResponse(renderErrorPage("Something went wrong."), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }
}

function renderErrorPage(message: string) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>LinkHive</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #05060a; color: #f5f5f5; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { background: rgba(255,255,255,0.03); padding: 32px; border-radius: 16px; text-align: center; border: 1px solid rgba(255,255,255,0.1); max-width: 420px; }
        h1 { margin: 0 0 12px; font-size: 1.5rem; }
        p { margin: 0 0 24px; color: #c7c7d2; }
        a { color: #7ab8ff; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Unable to redirect</h1>
        <p>${message}</p>
        <a href="/">Return to LinkHive</a>
      </div>
    </body>
  </html>`;
}
