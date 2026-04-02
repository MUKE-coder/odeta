import { NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "jb.desishub.com",
  "better-auth-ui.desishub.com",
  "stripe-ui-component.desishub.com",
  "file-storage-registry.vercel.app",
];

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "no url" }, { status: 400 });
  }

  try {
    const urlObj = new URL(url);
    if (!ALLOWED_DOMAINS.some((d) => urlObj.hostname === d)) {
      return NextResponse.json({ error: "domain not allowed" }, { status: 403 });
    }

    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
