export function generateCode(settings: { blur: number; color: string; intensity: number; angleX: number; angleY: number; angleZ: number; particleCount: number; svgRaw: string | null }): string {
  const particleCount = settings.particleCount;
  const size = (0.04 + (settings.blur / 100) * 0.1).toFixed(3);
  const baseColor = settings.color;
  const blurPx = ((settings.blur / 100) * 12).toFixed(1);
  const twinkleAmp = (0.3 * settings.intensity / 100).toFixed(3);
  const rotX = ((settings.angleX * Math.PI) / 180).toFixed(4);
  const rotY = ((settings.angleY * Math.PI) / 180).toFixed(4);
  const rotZ = ((settings.angleZ * Math.PI) / 180).toFixed(4);
  const svgRaw = settings.svgRaw;

  const svgEmbedded = svgRaw
    ? `    const SVG_RAW = ${JSON.stringify(svgRaw)};`
    : "";

  const parserCode = svgRaw
    ? `
    function parseSvgToPoints(svgText, count) {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.visibility = "hidden";
      container.innerHTML = svgText;
      document.body.appendChild(container);
      const svg = container.querySelector("svg");
      if (!svg) { document.body.removeChild(container); return new Float32Array(count * 3); }
      const elements = svg.querySelectorAll("path, circle, rect, line, polygon, polyline, ellipse");
      const paths = [];
      const lengths = [];
      let totalLength = 0;
      elements.forEach((el) => {
        if (typeof el.getTotalLength === "function") {
          const len = el.getTotalLength();
          if (len > 0) { paths.push(el); lengths.push(len); totalLength += len; }
        }
      });
      if (paths.length === 0 || totalLength === 0) { document.body.removeChild(container); return new Float32Array(count * 3); }
      const rawPoints = [];
      for (let p = 0; p < paths.length; p++) {
        const pathCount = Math.max(1, Math.round((lengths[p] / totalLength) * count));
        for (let i = 0; i < pathCount; i++) {
          const t = (i / pathCount) * lengths[p];
          const pt = paths[p].getPointAtLength(t);
          rawPoints.push({ x: pt.x, y: pt.y });
        }
      }
      document.body.removeChild(container);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const pt of rawPoints) { if (pt.x < minX) minX = pt.x; if (pt.x > maxX) maxX = pt.x; if (pt.y < minY) minY = pt.y; if (pt.y > maxY) maxY = pt.y; }
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const maxRange = Math.max(maxX - minX || 1, maxY - minY || 1);
      const scale = 6 / maxRange;
      const result = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const pt = rawPoints[i % rawPoints.length];
        const jitterX = (Math.random() - 0.5) * 0.15;
        const jitterY = (Math.random() - 0.5) * 0.15;
        result[i * 3] = (pt.x - cx) * scale + jitterX;
        result[i * 3 + 1] = -(pt.y - cy) * scale + jitterY;
        const z1 = Math.random(), z2 = Math.random();
        result[i * 3 + 2] = (z1 + z2 - 1.0) * 1.2;
      }
      return result;
    }
`
    : "";

  const targetInit = svgRaw
    ? `    const svgTargets = parseSvgToPoints(SVG_RAW, PARTICLE_COUNT);`
    : `    const svgTargets = null;`;

  const ambientStart = Math.floor(particleCount * 0.85);

  const frameLogic = svgRaw
    ? `      // Shape particles — lerp toward SVG targets + drift
      const AMBIENT_START = ${ambientStart};
      for (let i = 0; i < AMBIENT_START; i++) {
        const i3 = i * 3;
        const driftX = Math.sin(t * 0.8 + phases[i]) * 0.04;
        const driftY = Math.cos(t * 0.6 + phases[i] + 1.0) * 0.04;
        pos[i3] += (svgTargets[i3] + driftX - pos[i3]) * 0.03;
        pos[i3 + 1] += (svgTargets[i3 + 1] + driftY - pos[i3 + 1]) * 0.03;
        pos[i3 + 2] += (svgTargets[i3 + 2] - pos[i3 + 2]) * 0.03;
      }
      // Ambient stardust — float lazily around the scene
      for (let i = AMBIENT_START; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const speed = 0.15 + phases[i] * 0.02;
        const orbitR = 4 + Math.sin(phases[i]) * 2;
        const angle = t * speed + phases[i];
        pos[i3] += (Math.cos(angle) * orbitR - pos[i3]) * 0.008;
        pos[i3 + 1] += (Math.sin(t * 0.3 + phases[i]) * 3 - pos[i3 + 1]) * 0.008;
        pos[i3 + 2] += (Math.sin(angle) * orbitR - pos[i3 + 2]) * 0.008;
      }`
    : `      // Gentle wave motion
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3 + 1] += Math.sin(t + pos[i * 3]) * 0.001;
      }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SVG Particles</title>
  <style>body { margin: 0; overflow: hidden; background: #000; }</style>
</head>
<body>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/"
      }
    }
  </script>
  <script type="module">
    import * as THREE from "three";
    import { OrbitControls } from "three/addons/controls/OrbitControls.js";

    const PARTICLE_COUNT = ${particleCount};
    const ROT_X = ${rotX};
    const ROT_Y = ${rotY};
    const ROT_Z = ${rotZ};

${svgEmbedded}
${parserCode}
${targetInit}

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    function createGlowTexture() {
      const s = 128;
      const canvas = document.createElement("canvas");
      canvas.width = s;
      canvas.height = s;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, s, s);
      ctx.filter = "blur(${blurPx}px)";
      ctx.fillStyle = "#ffffff";
      const cx = s / 2, cy = s / 2, r = Math.max(4, s / 2 - 4 - ${blurPx});
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(canvas);
    }

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const base = new THREE.Color("${baseColor}");
    const hsl = { h: 0, s: 0, l: 0 };
    base.getHSL(hsl);
    const palette = [
      base,
      new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.12)),
      new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.24)),
      new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, hsl.l + 0.36)),
    ];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 5;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const baseColors = new Float32Array(colors);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      map: createGlowTexture(),
      size: ${size},
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Rotation + gentle breathing pulse
      points.rotation.x = ROT_X;
      points.rotation.y = ROT_Y;
      points.rotation.z = ROT_Z;
      const pulse = 1.0 + Math.sin(t * 0.8) * 0.02;
      points.scale.setScalar(pulse);

      const pos = geometry.attributes.position.array;

${frameLogic}
      geometry.attributes.position.needsUpdate = true;

      // Twinkling + depth brightness
      const col = geometry.attributes.color.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const twinkle = 1.0 + Math.sin(t * 1.5 + phases[i]) * ${twinkleAmp};
        const z = pos[i3 + 2];
        const depthBright = 0.6 + 0.4 * ((z + 2) / 4);${svgRaw ? `\n        const ambientDim = i >= ${ambientStart} ? 0.35 : 1.0;` : `\n        const ambientDim = 1.0;`}
        const brightness = twinkle * depthBright * ambientDim;
        col[i3] = baseColors[i3] * brightness;
        col[i3 + 1] = baseColors[i3 + 1] * brightness;
        col[i3 + 2] = baseColors[i3 + 2] * brightness;
      }
      geometry.attributes.color.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
  </script>
</body>
</html>`;
}
