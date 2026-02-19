export const code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hand Gesture Particles</title>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    #pip { position: absolute; bottom: 16px; left: 16px; width: 200px; height: 150px; border-radius: 12px; overflow: hidden; border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 4px 24px rgba(0,0,0,0.5); z-index: 20; }
    #pip video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
    #status { position: absolute; bottom: 16px; left: 16px; z-index: 20; padding: 8px 16px; border-radius: 8px; background: rgba(0,0,0,0.7); color: #a78bfa; font: 13px sans-serif; }
  </style>
</head>
<body>
  <video id="cam" playsinline muted style="display:none"></video>
  <div id="pip" style="display:none"><video id="pipVideo" playsinline muted></video></div>
  <div id="status">Loading hand tracking...</div>

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

    const COUNT = 3000;

    // Hand state
    const hand = { tracking: false, gesture: "none", tx: 0, ty: 0 };

    function classify(n) {
      if (n === 0) return "fist";
      if (n === 2) return "two";
      if (n === 3) return "three";
      if (n === 4) return "four";
      if (n >= 5) return "open";
      return "none";
    }

    // Shape generators
    function sphere(count, radius) {
      const p = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = radius * Math.cbrt(Math.random());
        p[i*3] = r * Math.sin(ph) * Math.cos(th);
        p[i*3+1] = r * Math.sin(ph) * Math.sin(th);
        p[i*3+2] = r * Math.cos(ph);
      }
      return p;
    }

    function expanded(count) {
      const p = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 2 + Math.random() * 4;
        p[i*3] = r * Math.sin(ph) * Math.cos(th);
        p[i*3+1] = r * Math.sin(ph) * Math.sin(th);
        p[i*3+2] = r * Math.cos(ph);
      }
      return p;
    }

    function polygon(count, sides, radius) {
      const p = new Float32Array(count * 3);
      const v = [];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 - Math.PI / 2;
        v.push([Math.cos(a) * radius, Math.sin(a) * radius]);
      }
      for (let i = 0; i < count; i++) {
        const e = i % sides, n = (e+1) % sides, t = Math.random();
        p[i*3] = v[e][0] + (v[n][0] - v[e][0]) * t;
        p[i*3+1] = v[e][1] + (v[n][1] - v[e][1]) * t;
        p[i*3+2] = (Math.random() - 0.5) * 0.5;
      }
      return p;
    }

    function star(count, radius) {
      const p = new Float32Array(count * 3);
      const inner = radius * 0.4;
      const v = [];
      for (let s = 0; s < 10; s++) {
        const a = (s / 10) * Math.PI * 2 - Math.PI / 2;
        v.push([Math.cos(a) * (s % 2 === 0 ? radius : inner), Math.sin(a) * (s % 2 === 0 ? radius : inner)]);
      }
      for (let i = 0; i < count; i++) {
        const e = i % 10, n = (e+1) % 10, t = Math.random();
        p[i*3] = v[e][0] + (v[n][0] - v[e][0]) * t;
        p[i*3+1] = v[e][1] + (v[n][1] - v[e][1]) * t;
        p[i*3+2] = (Math.random() - 0.5) * 0.5;
      }
      return p;
    }

    const cool = [0x6366f1, 0x8b5cf6, 0x7c3aed, 0xa78bfa].map(c => new THREE.Color(c));
    const warm = [0xf97316, 0xfb923c, 0xfbbf24, 0xf59e0b].map(c => new THREE.Color(c));
    const shape = [0x06b6d4, 0x22d3ee, 0x3b82f6, 0x0ea5e9].map(c => new THREE.Color(c));

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Particles
    const positions = new Float32Array(sphere(COUNT, 1.5));
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const c = cool[i % cool.length];
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }

    const targets = {
      sphere: sphere(COUNT, 1.5),
      expanded: expanded(COUNT),
      triangle: polygon(COUNT, 3, 3),
      pentagon: polygon(COUNT, 5, 2.5),
      star: star(COUNT, 3),
    };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      const pa = geo.attributes.position.array;
      const ca = geo.attributes.color.array;
      let tp, pal;
      switch (hand.gesture) {
        case "open": tp = targets.expanded; pal = warm; break;
        case "fist": tp = targets.sphere; pal = cool; break;
        case "two": tp = targets.triangle; pal = shape; break;
        case "three": tp = targets.pentagon; pal = shape; break;
        case "four": tp = targets.star; pal = shape; break;
        default: tp = targets.sphere; pal = cool;
      }
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        let tx = tp[i3], ty = tp[i3+1], tz = tp[i3+2];
        if (hand.tracking) { tx += hand.tx * 0.3; ty += hand.ty * 0.3; }
        tx += Math.sin(i * 0.1 + performance.now() * 0.001) * 0.02;
        pa[i3] += (tx - pa[i3]) * 0.03;
        pa[i3+1] += (ty - pa[i3+1]) * 0.03;
        pa[i3+2] += (tz - pa[i3+2]) * 0.03;
        const tc = pal[i % pal.length];
        ca[i3] += (tc.r - ca[i3]) * 0.02;
        ca[i3+1] += (tc.g - ca[i3+1]) * 0.02;
        ca[i3+2] += (tc.b - ca[i3+2]) * 0.02;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // Hand tracking init
    async function initHandTracking() {
      try {
        const { HandLandmarker, FilesetResolver } = await import(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest"
        );
        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const detector = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        const cam = document.getElementById("cam");
        cam.srcObject = stream;
        await cam.play();

        const pipEl = document.getElementById("pip");
        const pipVideo = document.getElementById("pipVideo");
        pipVideo.srcObject = stream;
        pipVideo.play();
        pipEl.style.display = "block";
        document.getElementById("status").style.display = "none";

        let lastTime = -1;
        function detect() {
          requestAnimationFrame(detect);
          if (cam.readyState < 2) return;
          const now = performance.now();
          if (now === lastTime) return;
          lastTime = now;
          const result = detector.detectForVideo(cam, now);
          if (result.landmarks && result.landmarks.length > 0) {
            const lm = result.landmarks[0];
            let count = 0;
            const w = lm[0];
            const td = Math.hypot(lm[4].x - w.x, lm[4].y - w.y);
            const id = Math.hypot(lm[3].x - w.x, lm[3].y - w.y);
            if (td > id * 1.1) count++;
            if (lm[8].y < lm[6].y) count++;
            if (lm[12].y < lm[10].y) count++;
            if (lm[16].y < lm[14].y) count++;
            if (lm[20].y < lm[18].y) count++;
            hand.tracking = true;
            hand.gesture = classify(count);
            hand.tx = (w.x - 0.5) * 10;
            hand.ty = -(w.y - 0.5) * 8;
          } else {
            hand.tracking = false;
            hand.gesture = "none";
          }
        }
        detect();
      } catch (err) {
        const el = document.getElementById("status");
        el.textContent = err.message.includes("Permission") ? "Camera access denied" : "Hand tracking unavailable";
        el.style.color = "#f87171";
      }
    }
    initHandTracking();
  </script>
</body>
</html>`;
