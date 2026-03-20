import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #166534 0%, #14532d 100%)",
          color: "#f8fafc",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 4
        }}
      >
        LLP
      </div>
    ),
    size
  );
}
