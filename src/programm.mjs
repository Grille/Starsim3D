import SNVK from "../temp_npm/vulkan.mjs"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"

let snvk = new SNVK();
let simulation = new Simulation(snvk);
let renderer = new Renderer(snvk);

snvk.startWindow({ width: 480, height: 320, title: "Starsim-3D" });
snvk.startVulkan();

simulation.setup();
renderer.setup();

let stars = [
  {
    pos: { x: -2, y: 0, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
    mass:1,
  },
  {
    pos: { x: 2, y: 0, z: 0 },
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

simulation.shutdown();
renderer.shutdown();

snvk.shutdownVulkan();