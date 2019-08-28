import SNVK from "../temp_npm/vulkan.mjs"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"

let snvk = new SNVK();
let lastResize = 0;

let count = 10;

snvk.startWindow({ width: 800, height: 600, title: "Starsim-3D" });
snvk.startVulkan();
let {window} = snvk;
let simulation = new Simulation(snvk);
let renderer = new Renderer(snvk);

let uniformData = new Uint8Array(32);

let storageBufferCreateInfo = {
  size: 1E6 * 32,
  usage: snvk.BUFFER_USAGE_STORAGE | snvk.BUFFER_USAGE_VERTEX,
  readable: true,
}
let uniformBufferCreateInfo = {
  size: uniformData.byteLength,
  usage: snvk.BUFFER_USAGE_UNIFORM,
}
let storageBuffer = snvk.createBuffer(storageBufferCreateInfo);
let uniformBuffer = snvk.createBuffer(uniformBufferCreateInfo);

let buffers = { storageBuffer, uniformBuffer };

simulation.setup(buffers);
renderer.setup(buffers);

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
  let uniformView = new DataView(uniformData.buffer);
  uniformView.setUint32(0, count, true);
  uniformView.setUint32(4, width, true);
  uniformView.setUint32(8, height, true);
  uniformView.setUint32(12, Math.min(count, 2000), true);

  snvk.bufferSubData(uniformBuffer, 0, uniformData, 0, uniformData.byteLength);
}

function createStars(count) {
  let stars = [];
  for (let i = 0; i < count; i++) {
    let star = {
      pos: { x: Math.random()*800-400, y: Math.random()*800-400, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      mass: 1,
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
