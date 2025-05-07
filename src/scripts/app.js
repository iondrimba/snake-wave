import 'styles/index.css';

export default class App {
  init() {
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS; // milliseconds per frame
    this.lastFrameTime = 0;
    this.backgroundColor = '#6a2bff';
    this.spotLightColor = 0xffffff;
    this.angle = 0;
    this.spheres = [];
    this.holes = [];
    this.gui = new dat.GUI();

    this.velocity = .08;
    this.amplitude = 5;
    this.waveLength = 20;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(60, 60, -60);

    this.addRenderer();

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    this.addAmbientLight();

    this.addSpotLight();

    const backgroundGUI = this.gui.addFolder('Background');
    backgroundGUI.addColor(this, 'backgroundColor').onChange((color) => {
      document.body.style.backgroundColor = color;
    });

    const obj = {
      color: '#ffffff',
      emissive: '#e07cff',
      reflectivity: 1,
      metalness: .2,
      roughness: 0
    };

    const material = new THREE.MeshPhysicalMaterial(obj);
    const geometry = new THREE.SphereGeometry(.5, 32, 32);

    const tileTop = { color: '#fa3fce' };
    const tileTopMaterial = new THREE.MeshBasicMaterial(tileTop);

    const tileInside = { color: '#671c87' };
    const tileInsideMaterial = new THREE.MeshBasicMaterial(tileInside);

    const materials = [tileTopMaterial, tileInsideMaterial];
    const props = {
      steps: 1,
      depth: 1,
      bevelEnabled: false
    };

    const guiWave = this.gui.addFolder('Wave');
    guiWave.add(this, 'waveLength', 0, 20).onChange((waveLength) => {
      this.waveLength = waveLength;
    });

    guiWave.add(this, 'amplitude', 3, 10).onChange((amplitude) => {
      this.amplitude = amplitude;
    });

    guiWave.add(this, 'velocity', 0, .2).onChange((velocity) => {
      this.velocity = velocity;
    });


    this.createSet(1, 1, geometry, material, props, materials);

    this.createSet(4, 1, geometry, material, props, materials);

    this.createSet(7, 1, geometry, material, props, materials);

    this.createSet(10, 1, geometry, material, props, materials);

    this.createSet(-2, 1, geometry, material, props, materials);

    this.createSet(-5, 1, geometry, material, props, materials);

    this.createSet(-8, 1, geometry, material, props, materials);

    this.createSet(-11, 1, geometry, material, props, materials);

    this.addFloorShadow();

    this.addGrid();

    this.animate();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  radians(degrees) {
    return degrees * Math.PI / 180;
  }

  createSet(x, z, geometry, material, props, materials) {
    this.floorShape = this.createShape();

    this.createRingOfHoles(this.floorShape, 1, 0);

    const geometryTile = new THREE.ExtrudeGeometry(this.floorShape, props);

    this.createGround(this.floorShape, x, z, geometryTile, materials);

    this.addShere(x, z, geometry, material);
  }

  createRingOfHoles(shape, count, radius) {
    const l = 360 / count;
    const distance = (radius * 2);

    for (let index = 0; index < count; index++) {
      const pos = this.radians(l * index);
      const sin = Math.sin(pos) * distance;
      const cos = Math.cos(pos) * distance;

      this.createHoles(shape, sin, cos);
    }
  }

  createShape() {
    const size = 1;
    const vectors = [
      new THREE.Vector2(-size, size),
      new THREE.Vector2(-size, -size),
      new THREE.Vector2(size, -size),
      new THREE.Vector2(size, size)
    ];

    const shape = new THREE.Shape(vectors);

    shape.autoClose = true;

    return shape;
  }

  createHoles(shape, x, z) {
    const radius = .5;
    const holePath = new THREE.Path();

    holePath.moveTo(x, z);
    holePath.ellipse(x, z, radius, radius, 0, Math.PI * 2);

    holePath.autoClose = true;

    shape.holes.push(holePath);

    this.holes.push({
      x,
      z
    });
  }

  addFloorShadow() {
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: .08 });

    this.floor = new THREE.Mesh(planeGeometry, planeMaterial);

    planeGeometry.rotateX(- Math.PI / 2);

    this.floor.position.y = -10;
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  createGround(shape, x, z, geometry, materials) {
    const mesh = new THREE.Mesh(geometry, materials);

    mesh.needsUpdate = true;

    mesh.rotation.set(Math.PI * 0.5, 0, 0);

    mesh.position.set(x, 0, z);

    this.scene.add(mesh);
  }

  hexToRgbTreeJs(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }

  addAmbientLight() {
    this.ambientLight = new THREE.AmbientLight(0x6e6e6e, 1);
    this.scene.add(this.ambientLight);
  }

  addSpotLight() {
    this.spotLight = new THREE.SpotLight(0xffffff);
    this.spotLight.position.set(0, 30, 0);
    this.spotLight.castShadow = true;

    this.scene.add(this.spotLight);
  }

  addRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.renderer.domElement);
  }

  addShere(x, z, geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.spheres.push(mesh);

    this.scene.add(mesh);
  }

  addGrid() {
    const size = 24;
    const divisions = size;
    const gridHelper = new THREE.GridHelper(size, divisions);

    gridHelper.position.set(0, 0, 0);
    gridHelper.material.opacity = 0;
    gridHelper.material.transparent = true;

    this.scene.add(gridHelper);
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }

  map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
  }

  drawWave() {
    const total = this.spheres.length;

    for (let i = 0; i < total; i++) {
      const distance = this.distance(this.spheres[i].position.z, this.spheres[i].position.x, 100, 100);

      const offset = this.map(distance, 0, 100, this.waveLength, -this.waveLength);

      const angle = this.angle + offset;

      const y = this.map(Math.sin(angle), -1, 1, -3, this.amplitude);

      this.spheres[i].position.y = y;
    }

    this.angle += this.velocity;
  }

  animate(currentTime = 0) {
    requestAnimationFrame(this.animate.bind(this));
    const timeElapsed = currentTime - this.lastFrameTime;

    // Only run animation logic if enough time has passed
    if (timeElapsed >= this.frameInterval) {
      // Update lastFrameTime, accounting for the actual time passed
      // This prevents timing drift
      this.lastFrameTime = currentTime - (timeElapsed % this.frameInterval);

      this.drawWave();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }
}
