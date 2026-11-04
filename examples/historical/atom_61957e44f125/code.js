function createAnimation({ THREE, scene, camera }) {
  const MAT = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const TUBE_R = 0.010;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  function tubeMesh(curve, segs, closed) {
    const geo = new THREE.TubeGeometry(curve, segs, TUBE_R, 6, !!closed);
    return new THREE.Mesh(geo, MAT);
  }

  function smoothStroke(vecs, closed, segs) {
    const curve = new THREE.CatmullRomCurve3(vecs, !!closed, 'centripetal', 0.5);
    return tubeMesh(curve, segs || 64, closed);
  }

  function segMesh(a, b) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const geo = new THREE.CylinderGeometry(TUBE_R, TUBE_R, len, 6, 1, true);
    geo.translate(0, len / 2, 0);
    const m = new THREE.Mesh(geo, MAT);
    m.position.copy(a);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return m;
  }

  function polyStroke(vecs) {
    const g = new THREE.Group();
    for (let i = 0; i < vecs.length - 1; i++) g.add(segMesh(vecs[i], vecs[i + 1]));
    for (let i = 0; i < vecs.length; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(TUBE_R, 6, 4), MAT);
      s.position.copy(vecs[i]);
      g.add(s);
    }
    return g;
  }

  // ---------- the low step ----------
  const A = V(-0.15, 0, -0.80);   // foot of the ramp face
  const B = V(0.30, 0, -0.52);    // top edge of the step
  const C = V(0.80, 0, -0.52);    // back of the step top
  const D = V(0.80, 0, -0.80);    // bottom of the back face

  // ground line runs from the left straight into the step's base
  scene.add(polyStroke([V(-1.0, 0, -0.80), D]));
  // step silhouette
  scene.add(polyStroke([A, B, C, D]));

  const DEPTH = 0.28;
  [A, B, C].forEach((p) => {
    scene.add(polyStroke([V(p.x, -DEPTH, p.z), V(p.x, DEPTH, p.z)]));
  });
  // back edges of the ramp face and of the top face
  scene.add(polyStroke([V(A.x, DEPTH, A.z), V(B.x, DEPTH, B.z), V(C.x, DEPTH, C.z)]));

  // ---------- the ball ----------
  const R = 0.11;
  const ex = V(1, 0, 0), ey = V(0, 1, 0), ez = V(0, 0, 1);

  function circlePts(e1, e2, r, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push(new THREE.Vector3()
        .addScaledVector(e1, Math.cos(a) * r)
        .addScaledVector(e2, Math.sin(a) * r));
    }
    return out;
  }

  const ball = new THREE.Group();
  ball.add(smoothStroke(circlePts(ex, ey, R, 24), true, 48)); // normal z
  ball.add(smoothStroke(circlePts(ey, ez, R, 24), true, 48)); // normal x
  ball.add(smoothStroke(circlePts(ex, ez, R, 24), true, 48)); // normal y
  scene.add(ball);

  // ---------- ball path ----------
  const FLOOR_Z = -0.80;
  const floorCenterZ = FLOOR_Z + R;

  const AB = new THREE.Vector3().subVectors(B, A);
  const LEN = AB.length();
  const U = AB.clone().normalize();               // up the ramp
  const N = new THREE.Vector3(-U.z, 0, U.x);      // outward normal of ramp face

  // point where the ball touches floor and ramp simultaneously
  const s0 = (floorCenterZ - (A.z + R * N.z)) / U.z;
  const x0 = A.x + s0 * U.x + R * N.x;

  const startX = -0.55;
  const dFloor = x0 - startX;
  const sHalf = LEN * 0.5;                        // halfway up the ramp
  const dUp = sHalf - s0;
  const TOTAL = dFloor + dUp;

  function ballCenter(dist) {
    if (dist <= dFloor) {
      return new THREE.Vector3(startX + dist, 0, floorCenterZ);
    }
    const s = s0 + (dist - dFloor);
    return new THREE.Vector3().copy(A).addScaledVector(U, s).addScaledVector(N, R);
  }

  // ---------- animation ----------
  const T_UP = 0.42;      // rolling up
  const T_HOLD = 0.55;    // momentary stop at the top
  const TOP_ANGLE = TOTAL / R;

  return {
    render(t) {
      t = t < 0 ? 0 : t > 1 ? 1 : t;

      let dist, ang;
      if (t <= T_UP) {
        const p = t / T_UP;
        const e = 1 - Math.pow(1 - p, 2);   // decelerate going up
        dist = TOTAL * e;
        ang = dist / R;                     // rolling: spin matches travel
      } else if (t <= T_HOLD) {
        dist = TOTAL;
        ang = TOP_ANGLE;
      } else {
        const p = (t - T_HOLD) / (1 - T_HOLD);
        dist = TOTAL * (1 - p * p);         // accelerate going back down
        ang = TOP_ANGLE;                    // sliding: no rotation
      }

      const c = ballCenter(dist);
      ball.position.copy(c);
      ball.rotation.set(0, ang, 0);
    }
  };
}