export function generateCode(settings: { color: string; shape: string }): string {
  const geometryMap: Record<string, string> = {
    icosahedron: "new THREE.IcosahedronGeometry(2, 30)",
    sphere: "new THREE.SphereGeometry(2, 64, 64)",
    torus: "new THREE.TorusGeometry(1.5, 0.6, 30, 100)",
    octahedron: "new THREE.OctahedronGeometry(2, 6)",
    dodecahedron: "new THREE.DodecahedronGeometry(2, 6)",
  };
  const geometryCode = geometryMap[settings.shape] || geometryMap.icosahedron;
  const color = settings.color;

  // Convert hex to 0x format for vanilla Three.js
  const colorHex = "0x" + color.replace("#", "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wave Sphere</title>
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.PointLight(0xffffff, 1, 100).translateX(10).translateY(10).translateZ(10));

    const geometry = ${geometryCode};
    const original = new Float32Array(geometry.attributes.position.array);
    const material = new THREE.MeshStandardMaterial({ color: ${colorHex}, wireframe: true, emissive: ${colorHex}, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mesh.rotation.y = t * 0.1;
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const ox = original[i], oy = original[i + 1], oz = original[i + 2];
        const offset = Math.sin(ox * 2 + t * 2) * 0.1 + Math.sin(oy * 3 + t * 1.5) * 0.08 + Math.sin(oz * 2.5 + t * 1.8) * 0.06;
        const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
        if (len === 0) continue;
        pos[i] = ox + (ox / len) * offset;
        pos[i + 1] = oy + (oy / len) * offset;
        pos[i + 2] = oz + (oz / len) * offset;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
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
