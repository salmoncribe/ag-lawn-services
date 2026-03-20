import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          position: "relative",
          background:
            "linear-gradient(135deg, rgba(8,20,13,0.92), rgba(20,83,45,0.8)), linear-gradient(180deg, #1d4d2e 0%, #102f1d 100%)",
          color: "white",
          padding: "64px",
          fontFamily: "sans-serif"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(246,232,207,0.2), transparent 35%), radial-gradient(circle at bottom right, rgba(163,230,53,0.18), transparent 28%)"
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            width: "100%"
          }}
        >
          <div
            style={{
              fontSize: 24,
              textTransform: "uppercase",
              letterSpacing: "0.4em",
              color: "#d9ffb0"
            }}
          >
            Billy & Josh • Lubbock, Texas
          </div>
          <div style={{ maxWidth: 920, display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                fontSize: 86,
                lineHeight: 0.95,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 800
              }}
            >
              Same-Day Mowing &amp; Expert Treatments in Lubbock
            </div>
            <div
              style={{
                fontSize: 34,
                color: "rgba(255,255,255,0.78)"
              }}
            >
              Book in 60 seconds with Lubbock Lawn Pros
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 24,
              color: "#fff7e7"
            }}
          >
            <span>Lubbock&apos;s #1 Rated</span>
            <span>•</span>
            <span>Same-Day Available</span>
            <span>•</span>
            <span>100% Satisfaction Guarantee</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
