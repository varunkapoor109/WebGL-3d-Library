export function generateCode(settings: { shape: string; blur: number; color: string; glow?: boolean; intensity?: number }): string {
  const baseColor = settings.color;
  const shape = settings.shape || "circle";
  const blur = settings.blur;
  const blurPx = ((blur / 100) * 12).toFixed(1);
  const glow = settings.glow ?? false;
  const intensity = settings.intensity ?? 50;

  const size = glow
    ? (0.08 + (blur / 100) * 0.14).toFixed(3)
    : (0.04 + (blur / 100) * 0.1).toFixed(3);

  const twinkleAmp = glow ? (0.5 * intensity / 100).toFixed(3) : "0";

  let shapeDrawCode: string;
  switch (shape) {
    case "triangle":
      shapeDrawCode = `      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();`;
      break;
    case "square":
      shapeDrawCode = `      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();`;
      break;
    case "pentagon":
      shapeDrawCode = `      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();`;
      break;
    case "star":
      shapeDrawCode = `      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.4;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();`;
      break;
    default:
      shapeDrawCode = `      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();`;
      break;
  }

  const textureFunction = glow
    ? `    function createParticleTexture() {
      const s = 128;
      const canvas = document.createElement("canvas");
      canvas.width = s;
      canvas.height = s;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, s, s);
      const cx = s / 2, cy = s / 2;
      const outerRadius = cx * ${(0.6 + (blur / 100) * 0.4).toFixed(2)};
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
      gradient.addColorStop(0, "rgba(255,255,255,1.0)");
      gradient.addColorStop(0.1, "rgba(255,255,255,0.8)");
      gradient.addColorStop(0.4, "rgba(255,255,255,0.3)");
      gradient.addColorStop(0.7, "rgba(255,255,255,0.08)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, s, s);
      return new THREE.CanvasTexture(canvas);
    }`
    : `    function createParticleTexture() {
      const s = 128;
      const canvas = document.createElement("canvas");
      canvas.width = s;
      canvas.height = s;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, s, s);
      ctx.filter = "blur(${blurPx}px)";
      ctx.fillStyle = "#ffffff";
      const cx = s / 2, cy = s / 2, r = Math.max(4, s / 2 - 4 - ${blurPx});
${shapeDrawCode}
      return new THREE.CanvasTexture(canvas);
    }`;

  const phasesInit = glow
    ? `    const phases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) phases[i] = Math.random() * Math.PI * 2;`
    : "";

  const twinkleCode = glow
    ? `
      // Twinkling
      const col = geometry.attributes.color.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const twinkle = 1.0 + Math.sin(t * 1.5 + phases[i]) * ${twinkleAmp};
        col[i * 3] = baseColors[i * 3] * twinkle;
        col[i * 3 + 1] = baseColors[i * 3 + 1] * twinkle;
        col[i * 3 + 2] = baseColors[i * 3 + 2] * twinkle;
      }
      geometry.attributes.color.needsUpdate = true;`
    : "";

  const baseColorsLine = glow ? `\n    const baseColors = new Float32Array(colors);` : "";
  const blendingLine = glow ? `\n      blending: THREE.AdditiveBlending,` : "";
  const opacityVal = glow ? "0.9" : "0.8";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Particle Field</title>
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

    const PARTICLE_COUNT = 2000;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

${textureFunction}

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
${phasesInit}
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
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
${baseColorsLine}
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      map: createParticleTexture(),
      size: ${size},
      vertexColors: true,
      transparent: true,
      opacity: ${opacityVal},
      depthWrite: false,${blendingLine}
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.05;
      points.rotation.x = Math.sin(t * 0.03) * 0.2;
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3 + 1] += Math.sin(t + pos[i * 3]) * 0.001;
      }
      geometry.attributes.position.needsUpdate = true;${twinkleCode}
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
