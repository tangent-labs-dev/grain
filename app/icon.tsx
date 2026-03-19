import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

const PIXEL_G = [
  "01111110",
  "11000011",
  "11000000",
  "11000000",
  "11011110",
  "11000011",
  "11000011",
  "01111110",
];

const PIXEL_SIZE = size.width / PIXEL_G[0].length;
const BACKGROUND_COLOR = "#000000";
const FOREGROUND_COLOR = "#ffffff";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BACKGROUND_COLOR,
        }}
      >
        {PIXEL_G.map((row, y) => (
          <div
            key={y}
            style={{
              display: "flex",
              width: "100%",
              height: PIXEL_SIZE,
            }}
          >
            {row.split("").map((bit, x) => (
              <div
                key={`${y}-${x}`}
                style={{
                  width: PIXEL_SIZE,
                  height: PIXEL_SIZE,
                  background: bit === "1" ? FOREGROUND_COLOR : BACKGROUND_COLOR,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    ),
    {
      ...size,
    },
  );
}
