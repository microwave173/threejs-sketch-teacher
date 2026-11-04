function createAnimation({ THREE, scene, camera }) {
  const root = new THREE.Group();
  scene.add(root);

  const MAT = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const R = 0.0085;
  const FLOOR = -0.8;

  function tubeMesh(curve, radius, tubular, closed) {
    return new THREE.Mesh(new THREE.TubeGeometry(curve, tubular, radius, 6, !!closed), MAT);
  }
  function stick(a, b, radius) {
    return tubeMesh(new THREE.LineCurve3(a, b), radius, 1, false);
  }

  // --- ground reference line ---
  root.add(stick(new THREE.Vector3(-0.9, 0, FLOOR), new THREE.Vector3(0.9, 0, FLOOR), R));

  // --- domino (rigid wireframe box, pivots on its bottom front edge) ---
  const DT = 0.04, DW = 0.24, DH = 0.6, PX = -0.62;
  const domino = new THREE.Group();
  domino.position.set(PX, 0, FLOOR);
  root.add(domino);

  const cs = [];
  for (const x of [-DT, 0]) {
    for (const y of [-DW / 2, DW / 2]) {
      for (const z of [0, DH]) cs.push(new THREE.Vector3(x, y, z));
    }
  }
  const EDGES = [
    [0, 4], [1, 5], [2, 6], [3, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 1], [2, 3], [4, 5], [6, 7]
  ];
  for (let i = 0; i < EDGES.length; i++) {
    domino.add(stick(cs[EDGES[i][0]], cs[EDGES[i][1]], R));
  }

  // --- ball (three great circles so the roll reads clearly) ---
  const BR = 0.1;
  const BZ = FLOOR + BR;
  const ball = new THREE.Group();
  root.add(ball);

  const N = 36;
  ['x', 'y', 'z'].forEach(function (ax) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const u = Math.cos(a) * BR;
      const v = Math.sin(a) * BR;
      if (ax === 'x') pts.push(new THREE.Vector3(0, u, v));
      else if (ax === 'y') pts.push(new THREE.Vector3(u, 0, v));
      else pts.push(new THREE.Vector3(u, v, 0));
    }
    ball.add(tubeMesh(new THREE.CatmullRomCurve3(pts, true), R, N, true));
  });

  // --- timing / constants ---
  const DEG = Math.PI / 180;
  const THETA_HIT = 72 * DEG;
  const THETA_MAX = 90 * DEG;
  const T_LEAN = 0.10;
  const T_HIT = 0.42;
  const T_REST = 0.88;
  const BX0 = 0.0;
  const DIST = 0.72;

  function render(t) {
    t = Math.min(1, Math.max(0, t));

    // domino angle over time
    let th;
    if (t < T_LEAN) {
      // small anticipation lean backwards
      th = -0.07 * Math.sin(Math.PI * (t / T_LEAN));
    } else if (t < T_HIT) {
      const s = (t - T_LEAN) / (T_HIT - T_LEAN);
      th = THETA_HIT * s * s; // accelerating fall
    } else {
      let s = (t - T_HIT) / (T_REST - T_HIT);
      s = Math.min(1, s);
      th = THETA_HIT + (THETA_MAX - THETA_HIT) * (1 - Math.pow(1 - s, 1.5));
    }
    domino.rotation.y = th;

    // ball: rests, then is struck and rolls away (slight friction, still rolling at the end)
    let d = 0;
    if (t > T_HIT) {
      let u = (t - T_HIT) / (1 - T_HIT);
      u = Math.min(1, u);
      d = DIST * (1.15 * u - 0.15 * u * u);
    }
    ball.position.set(BX0 + d, 0, BZ);
    ball.rotation.y = d / BR;
  }

  render(0);
  return { render: render };
}