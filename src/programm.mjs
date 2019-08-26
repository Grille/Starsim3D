import SNVK from "../temp_npm/vulkan.mjs"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"

let snvk = new SNVK();

snvk.startWindow({ width: 800, height: 600, title: "Starsim-3D" });
snvk.startVulkan();
let {window} = snvk;
let simulation = new Simulation(snvk);
let renderer = new Renderer(snvk);

simulation.setup();
renderer.setup();

let stars = [
  {
    pos: { x: -0.5, y: -0.5, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    mass:1,
  },
  {
    pos: { x: 0.5, y: 0.5, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    mass:1,
  },
  {
    pos: { x: -0.5, y: 0.5, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    mass:1,
  },
  {
    pos: { x: 0.5, y: -0.5, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    mass:1,
  },
]
simulation.pushStars(stars);

let date = Date.now();
for (let i = 0;i<1;i++){
  simulation.compute();
}
console.log(`time: ${Date.now()-date}ms`);

renderer.pullData(simulation);

renderer.render();

console.log(simulation.readStars());

eventLoop();

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

    }
    setTimeout(eventLoop, 0);
  }
}