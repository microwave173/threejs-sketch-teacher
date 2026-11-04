function createAnimation({THREE, scene, camera}) {
  const root = new THREE.Group();
  root.scale.setScalar(1.2);
  root.position.z = 0.16;
  scene.add(root);

  const mat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const meshes = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  function clear() {
    for (let i = 0; i < meshes.length; i++) {
      root.remove(meshes[i]);
      meshes[i].geometry.dispose();
    }
    meshes.length = 0;
  }

  function addTube(pts, r, closed, seg) {
    if (pts.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(pts, !!closed, 'catmullrom', 0.5);
    const geo = new THREE.TubeGeometry(curve, seg || (closed ? 64 : 24), r, 6, !!closed);
    const mesh = new THREE.Mesh(geo, mat);
    root.add(mesh);
    meshes.push(mesh);
  }

  function addLoop(c, a1, a2, r1, r2, n, tubeR) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(c.clone().addScaledVector(a1, Math.cos(a) * r1).addScaledVector(a2, Math.sin(a) * r2));
    }
    addTube(pts, tubeR, true, 72);
  }

  function ik(A, B, L1, L2, hint) {
    const dv = B.clone().sub(A);
    let d = dv.length();
    const dir = d < 1e-6 ? V(1, 0, 0) : dv.clone().divideScalar(d);
    const maxD = (L1 + L2) * 0.999;
    if (d > maxD) d = maxD;
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const C = A.clone().addScaledVector(dir, a);
    const hn = hint.clone().addScaledVector(dir, -hint.dot(dir));
    if (hn.lengthSq() < 1e-8) hn.set(0, 0, 1);
    hn.normalize();
    return C.addScaledVector(hn, h);
  }

  function render(t) {
    clear();

    // slow rise with short holds at both ends
    const u = Math.min(1, Math.max(0, (t - 0.08) / 0.86));
    const s = u * u * (3 - 2 * u);
    const lerp = (a, b) => a + (b - a) * s;

    // ---- woman skeleton ----
    const hip = V(lerp(-0.26, -0.08), 0, lerp(-0.60, -0.46));
    const th = lerp(1.02, 0.55);              // lean from vertical
    const f = V(Math.sin(th), 0, Math.cos(th));   // torso direction (up/forward)
    const p = V(Math.cos(th), 0, -Math.sin(th));  // perpendicular (forward/down)
    const neck = hip.clone().addScaledVector(f, 0.42);

    // spine (slightly hunched back)
    const midSpine = hip.clone().lerp(neck, 0.55).addScaledVector(p, -0.035);
    addTube([hip.clone(), midSpine, neck.clone()], 0.014);

    // shoulders
    const shoulderC = neck.clone().addScaledVector(f, -0.03);
    const shL = shoulderC.clone().add(V(0, 0.10, 0));
    const shR = shoulderC.clone().add(V(0, -0.10, 0));
    addTube([shL.clone(), shoulderC.clone(), shR.clone()], 0.012);

    // head + bun + nose
    const headC = neck.clone().addScaledVector(f, 0.115);
    addLoop(headC, V(0, 1, 0), p, 0.095, 0.095, 24, 0.013);
    const bunC = headC.clone().addScaledVector(f, -0.085).add(V(0, 0, 0.025));
    addLoop(bunC, V(0, 1, 0), p, 0.038, 0.038, 14, 0.011);
    addTube([
      headC.clone().addScaledVector(p, 0.085).addScaledVector(f, 0.015),
      headC.clone().addScaledVector(p, 0.125).addScaledVector(f, -0.02)
    ], 0.009);

    // ---- arms pressing on the stool seat ----
    const hands = [V(0.42, 0.085, -0.33), V(0.42, -0.085, -0.33)];
    const shoulders = [shL, shR];
    for (let i = 0; i < 2; i++) {
      const A = shoulders[i];
      const B = hands[i];
      const hint = V(0, i === 0 ? 1 : -1, 0.3);
      const E = ik(A, B, 0.21, 0.21, hint);
      addTube([A.clone(), E, B.clone()], 0.011);
      addTube([B.clone().add(V(-0.025, 0, 0.008)), B.clone().add(V(0.03, 0, 0.0))], 0.010);
    }

    // ---- legs ----
    const feet = [V(0.06, 0.09, -0.80), V(-0.12, -0.09, -0.80)];
    const hipJ = [hip.clone().add(V(0, 0.065, 0)), hip.clone().add(V(0, -0.065, 0))];
    for (let i = 0; i < 2; i++) {
      const A = hipJ[i];
      const B = feet[i];
      const hint = V(1, i === 0 ? 0.25 : -0.25, 0);
      const K = ik(A, B, 0.235, 0.235, hint);
      addTube([A.clone(), K, B.clone()], 0.012);
      addTube([B.clone().add(V(-0.045, 0, 0)), B.clone().add(V(0.06, 0, 0.005))], 0.011);
    }

    // ---- stool ----
    const sc = V(0.48, 0, -0.35);
    addLoop(sc, V(1, 0, 0), V(0, 1, 0), 0.16, 0.13, 26, 0.012);
    const lb = [[0.115, 0.09], [0.115, -0.09], [-0.115, 0.09], [-0.115, -0.09]];
    const lf = [[0.15, 0.12], [0.15, -0.12], [-0.15, 0.12], [-0.15, -0.12]];
    for (let i = 0; i < 4; i++) {
      const a = sc.clone().add(V(lb[i][0], lb[i][1], 0));
      const b = sc.clone().add(V(lf[i][0], lf[i][1], -0.45));
      addTube([a, a.clone().lerp(b, 0.5), b], 0.011);
    }
  }

  return { render };
}