function createAnimation({THREE, scene, camera}) {
  const mat = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide});

  function V(a){ return new THREE.Vector3(a[0], a[1], a[2]); }

  function stroke(points, closed, radius){
    const pts = points.map(V);
    const curve = new THREE.CatmullRomCurve3(pts, !!closed, 'centripetal', 0.5);
    const seg = Math.min(160, Math.max(40, pts.length * 8));
    const geo = new THREE.TubeGeometry(curve, seg, radius || 0.010, 6, !!closed);
    return new THREE.Mesh(geo, mat);
  }

  function ringCircle(r, plane){
    const pts = [], n = 26;
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r;
      if (plane === 0) pts.push([c, 0, s]);
      else if (plane === 1) pts.push([c, s, 0]);
      else pts.push([0, c, s]);
    }
    return stroke(pts, true, 0.008);
  }

  // ---------- fox kit ----------
  function makeFox(){
    const g = new THREE.Group();

    // body blob
    g.add(stroke([
      [-0.13, 0, -0.72], [-0.07, 0, -0.78], [ 0.05, 0, -0.78], [ 0.13, 0, -0.70],
      [ 0.14, 0, -0.59], [ 0.07, 0, -0.51], [-0.03, 0, -0.49], [-0.12, 0, -0.55],
      [-0.16, 0, -0.65]
    ], true, 0.011));

    // head
    const headPts = [];
    for (let i = 0; i < 16; i++){
      const a = i / 16 * Math.PI * 2;
      headPts.push([0.10 + 0.085 * Math.cos(a), 0, -0.39 + 0.085 * Math.sin(a)]);
    }
    g.add(stroke(headPts, true, 0.011));

    // muzzle
    g.add(stroke([[0.15, 0, -0.435], [0.25, 0, -0.385], [0.15, 0, -0.345]], false, 0.010));

    // ears
    for (const sy of [-1, 1]){
      g.add(stroke([
        [0.155, 0.050 * sy, -0.355],
        [0.045, 0.050 * sy, -0.325],
        [0.100, 0.075 * sy, -0.215]
      ], true, 0.010));
    }

    // tail curl
    g.add(stroke([
      [-0.14, 0, -0.62], [-0.26, 0, -0.615], [-0.34, 0, -0.54],
      [-0.33, 0, -0.44], [-0.27, 0, -0.40]
    ], false, 0.011));

    // far front leg
    g.add(stroke([[0.07, 0.05, -0.55], [0.09, 0.05, -0.70], [0.11, 0.05, -0.785], [0.17, 0.05, -0.79]], false, 0.010));

    // hind foot
    g.add(stroke([[-0.10, -0.055, -0.72], [-0.05, -0.055, -0.785], [0.02, -0.055, -0.79]], false, 0.010));

    // near batting foreleg (pivot group at shoulder)
    const arm = new THREE.Group();
    arm.position.set(0.05, -0.03, -0.55);
    arm.add(stroke([[0, 0, 0], [0.03, 0, -0.13], [0.045, 0, -0.22], [0.095, 0, -0.225]], false, 0.010));
    g.add(arm);

    return {group: g, arm: arm};
  }

  const foxA = makeFox();
  foxA.group.position.set(-0.55, 0, 0);
  scene.add(foxA.group);

  const foxB = makeFox();
  foxB.group.position.set(0.55, 0, 0);
  foxB.group.scale.set(-1, 1, 1);
  scene.add(foxB.group);

  // ---------- ball ----------
  const ball = new THREE.Group();
  ball.add(ringCircle(0.06, 0));
  ball.add(ringCircle(0.06, 1));
  ball.add(ringCircle(0.06, 2));
  scene.add(ball);

  const AX = -0.22, BX = 0.22, R = 0.06;

  return {
    render(t){
      const tt = Math.max(0, Math.min(1, t));
      const half = Math.floor(tt * 2);
      const p = tt * 2 - half;
      const e = p * p * (3 - 2 * p);

      let bx;
      if (half % 2 === 0) bx = AX + (BX - AX) * e;
      else bx = BX - (BX - AX) * e;
      const bz = -0.53 + 0.20 * Math.sin(Math.PI * p);

      ball.position.set(bx, 0, bz);
      ball.rotation.y = bx / R;
      ball.rotation.z = 0.25;

      const kA = Math.exp(-Math.pow((bx - AX) / 0.13, 2));
      const kB = Math.exp(-Math.pow((bx - BX) / 0.13, 2));
      foxA.arm.rotation.y = -1.45 * kA;
      foxB.arm.rotation.y = -1.45 * kB;
    }
  };
}