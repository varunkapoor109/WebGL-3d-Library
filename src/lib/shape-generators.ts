export function generateSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random());
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

export function generateExpanded(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2 + Math.random() * 4;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

export function generatePolygonEdges(
  count: number,
  sides: number,
  radius: number
): Float32Array {
  const positions = new Float32Array(count * 3);
  const vertices: [number, number][] = [];
  for (let s = 0; s < sides; s++) {
    const angle = (s / sides) * Math.PI * 2 - Math.PI / 2;
    vertices.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  for (let i = 0; i < count; i++) {
    const edge = i % sides;
    const next = (edge + 1) % sides;
    const t = Math.random();
    const x = vertices[edge][0] + (vertices[next][0] - vertices[edge][0]) * t;
    const y = vertices[edge][1] + (vertices[next][1] - vertices[edge][1]) * t;
    const z = (Math.random() - 0.5) * 0.5;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

export function generateStar(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const points = 5;
  const innerRadius = radius * 0.4;
  const vertices: [number, number][] = [];
  for (let s = 0; s < points * 2; s++) {
    const angle = (s / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = s % 2 === 0 ? radius : innerRadius;
    vertices.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  const totalEdges = vertices.length;
  for (let i = 0; i < count; i++) {
    const edge = i % totalEdges;
    const next = (edge + 1) % totalEdges;
    const t = Math.random();
    const x = vertices[edge][0] + (vertices[next][0] - vertices[edge][0]) * t;
    const y = vertices[edge][1] + (vertices[next][1] - vertices[edge][1]) * t;
    const z = (Math.random() - 0.5) * 0.5;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}
