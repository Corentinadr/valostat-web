import { useEffect, useRef } from "react";
import * as THREE from "three";

// Hero 3D "Radar tactique" : sphère filaire avec balayage rotatif et blips
// pulsants — le thème du tracking, littéralement.
export default function Hero3D() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const W = el.clientWidth, H = el.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 1.4, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.x = 0.28;
    scene.add(group);

    // Sphère filaire (le globe radar)
    const globe = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(2.1, 20, 12)),
      new THREE.LineBasicMaterial({ color: 0x35e0c2, transparent: true, opacity: 0.16 })
    );
    group.add(globe);

    // Anneau équatorial rouge
    const equator = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 90 }, (_, i) => {
          const a = (i / 90) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1);
        })
      ),
      new THREE.LineBasicMaterial({ color: 0xff4655, transparent: true, opacity: 0.8 })
    );
    group.add(equator);

    // Balayage radar : secteur semi-transparent qui tourne sur l'équateur
    const sweep = new THREE.Mesh(
      new THREE.CircleGeometry(2.08, 24, 0, 0.7),
      new THREE.MeshBasicMaterial({
        color: 0x35e0c2, transparent: true, opacity: 0.14,
        side: THREE.DoubleSide, depthWrite: false,
      })
    );
    sweep.rotation.x = -Math.PI / 2;
    group.add(sweep);

    // Ligne de tête du balayage
    const sweepLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(2.08, 0, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x35e0c2, transparent: true, opacity: 0.9 })
    );
    sweep.add(sweepLine);

    // Blips : cibles rouges pulsantes sur la sphère
    const blips = [];
    const blipGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const blipPositions = [
      [1.2, 0.9, 1.3], [-1.5, 0.4, 1.1], [0.6, -0.8, -1.7],
      [-0.9, 1.4, -1.0], [1.7, -0.3, 0.8],
    ];
    for (const [x, y, z] of blipPositions) {
      const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(2.1);
      const b = new THREE.Mesh(
        blipGeo,
        new THREE.MeshBasicMaterial({ color: 0xff4655, transparent: true })
      );
      b.position.copy(v);
      b.userData.phase = Math.random() * Math.PI * 2;
      group.add(b);
      blips.push(b);
    }

    // Poussière d'étoiles
    const N = 400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 3.2 + Math.random() * 2;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(
      new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xece8e1, size: 0.013, transparent: true, opacity: 0.35 }))
    );

    // Parallaxe souris
    let mx = 0, my = 0;
    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.4;
      my = (e.clientY / window.innerHeight - 0.5) * 0.25;
    };
    window.addEventListener("mousemove", onMove);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      const t = clock.getElapsedTime();
      if (!reduced) {
        group.rotation.y += 0.0016;
        sweep.rotation.z = -t * 0.9; // balayage
        for (const b of blips) {
          const pulse = 0.6 + 0.4 * Math.sin(t * 2.4 + b.userData.phase);
          b.material.opacity = pulse;
          b.scale.setScalar(0.8 + 0.5 * pulse);
        }
        group.rotation.y += (mx - group.rotation.y % 0.001) * 0; // stabilité
        camera.position.x += (mx * 2 - camera.position.x) * 0.04;
        camera.position.y += (1.4 - my * 2 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="hero-canvas" aria-hidden="true" />;
}
