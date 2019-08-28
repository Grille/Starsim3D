import SNVK from "../temp_npm/vulkan.mjs"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"

let snvk = new SNVK();
let lastResize = 0;

snvk.startWindow({ width: 800, height: 600, title: "Starsim-3D" });
snvk.startVulkan();
let {window} = snvk;
let simulation = new Simulation(snvk);
let renderer = new Renderer(snvk);

simulation.setup();
renderer.setup();

createStars(4000);

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
      renderer.pullData(simulation);
      renderer.render();
    }
    if (lastResize !== 0 && Date.now() - lastResize > 10 && (window.width > 0 && window.height > 0)) {
      lastResize = 0;
      renderer.createPipeline(4000);
    }
    setTimeout(eventLoop, 10);
  }
}
