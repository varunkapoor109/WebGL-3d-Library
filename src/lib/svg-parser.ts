/**
 * Parses an SVG string into evenly-sampled 2D points, normalized to fit
 * within a radius of ~3 centered at the origin, with small random Z offsets.
 */
export function parseSvgToPoints(svgText: string, count: number): Float32Array {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.visibility = "hidden";
  container.innerHTML = svgText;
  document.body.appendChild(container);

  const svg = container.querySelector("svg");
  if (!svg) {
    document.body.removeChild(container);
    return new Float32Array(count * 3);
  }

  // Collect all geometry elements
  const elements = svg.querySelectorAll(
    "path, circle, rect, line, polygon, polyline, ellipse"
  );

  const paths: SVGGeometryElement[] = [];
  const lengths: number[] = [];
  let totalLength = 0;

  elements.forEach((el) => {
    const geom = el as SVGGeometryElement;
    if (typeof geom.getTotalLength === "function") {
      const len = geom.getTotalLength();
      if (len > 0) {
        paths.push(geom);
        lengths.push(len);
        totalLength += len;
      }
    }
  });

  if (paths.length === 0 || totalLength === 0) {
    document.body.removeChild(container);
    return new Float32Array(count * 3);
  }

  // Sample points proportionally across paths by length
  const rawPoints: { x: number; y: number }[] = [];

  for (let p = 0; p < paths.length; p++) {
    const pathCount = Math.max(1, Math.round((lengths[p] / totalLength) * count));
    for (let i = 0; i < pathCount; i++) {
      const t = (i / pathCount) * lengths[p];
      const pt = paths[p].getPointAtLength(t);
      rawPoints.push({ x: pt.x, y: pt.y });
    }
  }

  document.body.removeChild(container);

  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of rawPoints) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const maxRange = Math.max(rangeX, rangeY);
  const scale = 6 / maxRange; // fit within radius ~3

  // Fill output array — cycle through rawPoints with jitter for thickness & depth
  const result = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const pt = rawPoints[i % rawPoints.length];
    // XY jitter spreads particles around path edges → thicker, filled appearance
    const jitterX = (Math.random() - 0.5) * 0.15;
    const jitterY = (Math.random() - 0.5) * 0.15;
    result[i * 3] = (pt.x - cx) * scale + jitterX;
    result[i * 3 + 1] = -(pt.y - cy) * scale + jitterY; // flip Y (SVG Y is down)
    // Gaussian-ish Z spread for volumetric depth (denser near center, thinner at edges)
    const z1 = Math.random();
    const z2 = Math.random();
    result[i * 3 + 2] = (z1 + z2 - 1.0) * 1.2; // triangular distribution, range ~[-1.2, 1.2]
  }

  return result;
}
