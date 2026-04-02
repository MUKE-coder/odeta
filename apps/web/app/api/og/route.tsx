import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") || "Odeta"
  const description =
    searchParams.get("description") || "AI-powered app builder for developers"

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            O
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            Odeta
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.2,
            marginBottom: "20px",
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          {description}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "18px",
            color: "#71717a",
          }}
        >
          odeta.gritcms.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
