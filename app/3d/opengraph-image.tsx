import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ARTVERSE / 3D — A gallery without walls. Original art by woxiwaldie in a floating aqua world.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Module-scope reads keep this metadata image independent of request data.
const [characterData, companionData] = await Promise.all([
  readFile(join(process.cwd(), "public", "artworks", "art1.png"), "base64"),
  readFile(join(process.cwd(), "public", "artworks", "compart1.png"), "base64"),
]);

const glyphs: Record<string, string[]> = {
  A: ["01110", "11011", "11011", "11111", "11011", "11011", "11011"],
  R: ["11110", "11011", "11011", "11110", "11100", "11010", "11011"],
  T: ["11111", "11111", "01110", "01110", "01110", "01110", "01110"],
  V: ["11011", "11011", "11011", "11011", "11011", "01110", "00100"],
  E: ["11111", "11000", "11000", "11110", "11000", "11000", "11111"],
  S: ["01111", "11000", "11000", "01110", "00011", "00011", "11110"],
  D: ["11110", "11011", "11011", "11011", "11011", "11011", "11110"],
  "3": ["11110", "00011", "00011", "01110", "00011", "00011", "11110"],
  "/": ["00001", "00011", "00110", "01100", "11000", "10000", "00000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

function PixelTitle({ text, scale, color }: { text: string; scale: number; color: string }) {
  return (
    <svg width={text.length * 6 * scale} height={7 * scale} viewBox={`0 0 ${text.length * 6} 7`}>
      {text.split("").flatMap((character, index) => glyphs[character].flatMap((row, y) => row.split("").map((pixel, x) => pixel === "1" ? <rect key={`${index}-${x}-${y}`} x={index * 6 + x} y={y} width="1" height="1" fill={color} /> : null)))}
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "linear-gradient(140deg, #e9f8fb 5%, #d8f2f5 48%, #b8e6ee 100%)", color: "#153b55", fontFamily: "sans-serif" }}>
      <div style={{ position: "absolute", top: 24, left: 24, right: 24, bottom: 24, border: "1px solid #ffffff", display: "flex" }} />
      <svg width="1200" height="630" style={{ position: "absolute", top: 0, left: 0 }} viewBox="0 0 1200 630">
        <path d="M580 514 L1049 514 L1175 444" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.55" />
        <path d="M658 533 L1066 533 L1185 465" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
        <path d="M762 84 L754 84 M758 80 L758 88 M530 369 L518 369 M524 363 L524 375 M1152 273 L1138 273 M1145 266 L1145 280" stroke="#2f4ff0" strokeWidth="3" />
        <rect x="588" y="146" width="6" height="6" fill="#9bafff" />
        <rect x="1133" y="102" width="8" height="8" fill="#9bafff" />
        <rect x="441" y="105" width="5" height="5" fill="#7ac8d8" />
        <rect x="549" y="517" width="7" height="7" fill="#2f4ff0" opacity="0.4" />
        <rect x="1053" y="568" width="6" height="6" fill="#85a0fa" />

        <polygon points="675,229 831,264 927,207 771,173" fill="#ddfbff" fillOpacity="0.82" stroke="#ffffff" strokeWidth="2" />
        <polygon points="675,229 831,264 831,476 675,441" fill="#68b4c9" fillOpacity="0.46" stroke="#ffffff" strokeWidth="2" />
        <polygon points="831,264 927,207 927,419 831,476" fill="#78b9ce" fillOpacity="0.56" stroke="#ffffff" strokeWidth="2" />
        <polygon points="835,328 958,355 1054,298 931,271" fill="#e3fcff" fillOpacity="0.84" stroke="#ffffff" strokeWidth="2" />
        <polygon points="835,328 958,355 958,490 835,463" fill="#65b2c9" fillOpacity="0.46" stroke="#ffffff" strokeWidth="2" />
        <polygon points="958,355 1054,298 1054,433 958,490" fill="#7cbccd" fillOpacity="0.55" stroke="#ffffff" strokeWidth="2" />
        <polygon points="967,409 1087,436 1163,391 1043,364" fill="#e4fdff" fillOpacity="0.84" stroke="#ffffff" strokeWidth="2" />
        <polygon points="967,409 1087,436 1087,512 967,485" fill="#74bace" fillOpacity="0.46" stroke="#ffffff" strokeWidth="2" />
        <polygon points="1087,436 1163,391 1163,467 1087,512" fill="#8ac4d3" fillOpacity="0.55" stroke="#ffffff" strokeWidth="2" />

        <polygon points="960,79 1001,159 925,159" fill="#b4df66" />
        <polygon points="925,159 1001,159 964,233" fill="#86c753" />
        <polygon points="960,79 925,159 936,159" fill="#e7ff91" />
        <polygon points="1123,187 1150,240 1099,240" fill="#51c4b2" />
        <polygon points="1099,240 1150,240 1126,290" fill="#39ae9f" />
        <polygon points="622,277 645,320 602,320" fill="#d7b6e9" />
        <polygon points="602,320 645,320 623,363" fill="#ac91d1" />
        <polygon points="999,478 1029,535 971,535" fill="#d5f38e" />
        <polygon points="971,535 1029,535 1001,587" fill="#a2d165" />
        <polygon points="861,468 879,501 845,501" fill="#ffa8d9" />
        <polygon points="845,501 879,501 863,532" fill="#e483c2" />
      </svg>

      <div style={{ position: "absolute", left: 68, top: 66, display: "flex", alignItems: "center", fontSize: 17, letterSpacing: 3 }}><span style={{ width: 9, height: 9, backgroundColor: "#82c653", marginRight: 13 }} />WORLD 01 / PIXEL DAYDREAM</div>
      <div style={{ position: "absolute", left: 68, top: 180, display: "flex" }}><PixelTitle text="ARTVERSE" scale={9} color="#153b55" /></div>
      <div style={{ position: "absolute", left: 68, top: 274, display: "flex" }}><PixelTitle text="/ 3D" scale={10} color="#2f4ff0" /></div>
      <div style={{ position: "absolute", left: 68, top: 384, display: "flex", fontSize: 30 }}>A gallery without walls.</div>
      <div style={{ position: "absolute", left: 68, top: 435, display: "flex", fontSize: 17, color: "#426980" }}>Original pixels. Painted stories. A world to explore.</div>
      <div style={{ position: "absolute", left: 68, bottom: 65, display: "flex", alignItems: "center", borderTop: "1px solid #87b8ca", paddingTop: 18, width: 422, fontSize: 14, letterSpacing: 2 }}>BY WOXIWALDIE<span style={{ marginLeft: "auto", color: "#2f4ff0" }}>DRAG · DISCOVER</span></div>

      <div style={{ position: "absolute", left: 761, top: 238, display: "flex", width: 234, height: 244, padding: 11, backgroundColor: "#2f4ff0", transform: "rotate(8deg)", boxShadow: "9px 9px 0 rgba(47,79,240,0.18)" }}>
        {/* ImageResponse requires an img element for embedded local artwork. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${characterData}`} alt="" width={212} height={222} style={{ objectFit: "contain", backgroundColor: "#d6f7f7" }} />
      </div>
      <div style={{ position: "absolute", left: 603, top: 397, display: "flex", width: 165, height: 176, padding: 8, backgroundColor: "#2f4ff0", transform: "rotate(-8deg)", boxShadow: "7px 7px 0 rgba(47,79,240,0.18)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${companionData}`} alt="" width={149} height={160} style={{ objectFit: "contain", backgroundColor: "#eff8cc" }} />
      </div>
    </div>,
    size,
  );
}
