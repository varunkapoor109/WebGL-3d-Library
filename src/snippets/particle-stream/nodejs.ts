export function generateCode(settings: { colorTop: string; colorBottom: string; speed: number; particleCount: number; motionBlur: number }): string {
  const { colorTop, colorBottom, speed, particleCount, motionBlur } = settings;

  const totalSpan = (motionBlur / 100) * 0.10;
  const trailStep = (totalSpan / 39).toFixed(6);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Particle Stream</title>
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

    const N = ${particleCount};
    const TC = 40, TS = ${trailStep};
    const TOP_Y = 7, GND_Y = -2, COL_W = 1.5, SPD = ${speed};

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 2, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const cv = document.createElement("canvas"); cv.width = cv.height = 64;
    const cx2 = cv.getContext("2d"), h = 32;
    const g = cx2.createRadialGradient(h,h,0,h,h,h);
    g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(0.3,"rgba(255,255,255,0.7)");
    g.addColorStop(0.6,"rgba(255,255,255,0.3)"); g.addColorStop(1,"rgba(255,255,255,0)");
    cx2.fillStyle = g; cx2.fillRect(0,0,64,64);
    const tex = new THREE.CanvasTexture(cv);

    const ph = new Float32Array(N), cX = new Float32Array(N);
    const oA = new Float32Array(N), oR = new Float32Array(N);
    const fS = new Float32Array(N), wP = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      ph[i] = Math.random();
      const g1 = Math.random(), g2 = Math.random();
      cX[i] = (g1 + g2 - 1) * COL_W;
      oA[i] = Math.random() * Math.PI * 2;
      oR[i] = 2 + Math.random() * 5;
      fS[i] = 0.6 + Math.random() * 0.8;
      wP[i] = Math.random() * Math.PI * 2;
    }

    function gp(t, i, time) {
      if (t < 0) t = 0; if (t > 0.999) t = 0.999;
      const eX = Math.cos(oA[i]) * oR[i], eZ = Math.sin(oA[i]) * oR[i] * 0.7;
      const mt = 1-t, mt2 = mt*mt, mt3 = mt2*mt, t2 = t*t, t3 = t2*t;
      const c1 = 3*mt2*t, c2 = 3*mt*t2;
      const x = mt3*cX[i] + c1*cX[i]*0.9 + c2*eX*0.4 + t3*eX + Math.sin(time*0.3+wP[i]*6)*0.01;
      const y = mt3*TOP_Y + c1*(GND_Y+1) + c2*GND_Y + t3*GND_Y;
      const z = c2*eZ*0.4 + t3*eZ;
      return [x, y, z];
    }

    const total = N * TC;
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      map: tex, vertexColors: true, transparent: true, opacity: 0.9,
      size: 0.08, sizeAttenuation: true,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(geometry, material));

    const cT = new THREE.Color("${colorTop}"), cB = new THREE.Color("${colorBottom}");
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const p = geometry.attributes.position.array;
      const c = geometry.attributes.color.array;
      for (let i = 0; i < N; i++) {
        const hT = (time * SPD * fS[i] * 0.2 + ph[i]) % 1;
        for (let j = 0; j < TC; j++) {
          const idx = i * TC + j, v = idx * 3;
          let t = hT - j * TS; if (t < 0) t += 1;
          const [px,py,pz] = gp(t, i, time);
          p[v]=px; p[v+1]=py; p[v+2]=pz;
          const fade = 1 - j / TC;
          c[v]=(cT.r+(cB.r-cT.r)*t)*fade; c[v+1]=(cT.g+(cB.g-cT.g)*t)*fade; c[v+2]=(cT.b+(cB.b-cT.b)*t)*fade;
        }
      }
      geometry.attributes.position.needsUpdate = true;
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
