import { coverSweepPath, type CoverSweepGeometry } from "./cover-sweep-geometry";
import "./cover-sweep.css";

export function CoverSweep({ direction, geometry, holding = false, mode }: {
  direction: "left" | "right" | "top" | "bottom";
  geometry: CoverSweepGeometry;
  holding?: boolean;
  mode: "cover" | "reveal";
}) {
  const { width, height, strokeWidth } = geometry;
  const pad = strokeWidth / 2 + 1;
  return <svg className={`cover-sweep is-${mode} from-${direction}${holding ? " is-holding" : ""}`}
    viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"
    style={{ "--cover-sweep-pad-x": `${pad / width * 100}%`, "--cover-sweep-pad-y": `${pad / height * 100}%` } as React.CSSProperties}>
    <path className="cover-sweep__shape" d={coverSweepPath(geometry)}
      fill="#3e4854" stroke="#3e4854" strokeWidth={strokeWidth} strokeLinejoin="round" />
  </svg>;
}
