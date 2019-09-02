import SNVK from "simple-nvk"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"
import glm from "gl-matrix";

let snvk = new SNVK();
let lastResize = 0;

let count = 1000;

let computeDate = Date.now();
let renderDate = Date.now();

snvk.startWindow({ width: 800, height: 600, title: "Starsim-3D" });
snvk.startVulkan();
let {window} = snvk;

let simulation = new Simulation(snvk);
let renderer = new Renderer(snvk);

let storageBufferCreateInfo = {
  size: 1E6 * 32,
  usage: snvk.BUFFER_USAGE_STORAGE | snvk.BUFFER_USAGE_VERTEX,
  readable: true,
}
let storageBuffer = snvk.createBuffer(storageBufferCreateInfo);

simulation.setup(storageBuffer);
renderer.setup(storageBuffer);

updateUniform(count, window.width, window.height);

let starCreateInfo = {
  count: count,
  radius: 18,
  position: {
    x: 0, y: 0, z: 0,
  },
  scale: {
    x: 1, y: 1, z: 0,
  },
}
createStars(starCreateInfo);

let date = Date.now();
for (let i = 0;i<20;i++){
  //simulation.compute();
}
console.log(`time: ${Date.now()-date}ms`);

window.onresize = () => {
  if (renderer.ready){
    renderer.destroyPipeline();
  }
  lastResize = Date.now();
}

//console.log(simulation.readStars());

eventLoop();

function updateUniform(count,width,height) {
  let { mat4, vec3 } = glm;

  let cameraPosition = vec3.fromValues(20.0, 0.0, -10.0);
  let view = mat4.create();
  let projection = mat4.create();

  
  mat4.lookAt(
    view,
    cameraPosition,
    vec3.fromValues(0.0, 0.0, 0.0),
    vec3.fromValues(0.0, 0.0, 1.0)
  );
  mat4.perspective(
    projection,
    60.0 * Math.PI / 180,
    width / height,
    1.0,
    32.0
  );
  
  
  renderer.submitUniform({ count, width, height, view, projection });
  simulation.submitUniform({ count });
}

function createStars(createInfo) {
  let { count, radius, position, scale } = createInfo;
  let stars = [];
  let r = radius;
  let d = r * 2;
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    while (true) {
      x = Math.random() * d - r;
      y = Math.random() * d - r;
      z = Math.random() * d - r;
      if (Math.sqrt(Math.abs(x * x) + Math.abs(y * y) + Math.abs(z * z)) < r) {
        break;
      }
    }
    x += position.x;
    y += position.y;
    z += position.z;
    x *= scale.x;
    y *= scale.y;
    z *= scale.z;
    let star = {
      pos: { x: x, y: y, z: z },
      vel: { x: 0, y: 0, z: 0 },
      mass: 10,
    }
    stars[i] = star;
  }
  simulation.createCommand(count);
  simulation.pushStars(stars);
  if (renderer.ready) {
    renderer.destroyPipeline();
  }
  renderer.createPipeline(count);
}

function shutdown() {
  simulation.shutdown();
  renderer.shutdown();
  
  snvk.shutdownVulkan();
}

function eventLoop() {
  if (window.shouldClose()) {
    simulation.shutdown();
    renderer.shutdown();
    snvk.shutdownVulkan();
  }
  else {
    window.pollEvents();
    if (renderer.ready) {
      if ((Date.now() - computeDate) > 10) {
        computeDate = Date.now();
        simulation.compute();
      }
      if ((Date.now() - renderDate) > 20) {
        renderDate = Date.now();
        renderer.render();
      }
    }
    if (lastResize !== 0 && Date.now() - lastResize > 10 && (window.width > 0 && window.height > 0)) {
      lastResize = 0;
      updateUniform(count, window.width, window.height);
      renderer.createPipeline(count);
    }
    setTimeout(eventLoop, 10);
  }
}
