import SNVK from "../temp_npm/vulkan.mjs"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"
import glm from "gl-matrix";

let snvk = new SNVK();
let lastResize = 0;

let count = 2000;

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
createStars(count);

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

  let cameraPosition = vec3.fromValues(4.0, 0.0, -2.0);
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
    45.0 * Math.PI / 180,
    width / height,
    2.0,
    6.0
  );
  
  
  renderer.submitUniform({ count, width, height, view, projection });
  simulation.submitUniform({ count });
}

function createStars(count) {
  let stars = [];
  for (let i = 0; i < count; i++) {
    let star = {
      pos: { x: Math.random()*2-1, y: Math.random()*2-1, z: Math.random()*2-1 },
      vel: { x: 0, y: 0, z: 0 },
      mass: 10*Math.random()+1,
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
      let date = Date.now();
      simulation.compute();
      let sim = Date.now() - date;
      window.title = "starsim3D: "+sim;
      //renderer.pullData(simulation);
      renderer.render();
    }
    if (lastResize !== 0 && Date.now() - lastResize > 10 && (window.width > 0 && window.height > 0)) {
      lastResize = 0;
      updateUniform(count, window.width, window.height);
      renderer.createPipeline(count);
    }
    setTimeout(eventLoop, 10);
  }
}
