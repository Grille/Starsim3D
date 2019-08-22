import SNVK from "../temp_npm/vulkan.mjs"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"

let snvk = new SNVK();
let simulation = new Simulation(snvk);
let renderer = new Renderer(snvk);

snvk.startWindow({ width: 480, height: 320, title:"Starsim-3D" });
snvk.startVulkan();

simulation.setup();
renderer.setup();

simulation.compute();
renderer.render();

simulation.shutdown();
renderer.shutdown();

snvk.shutdownVulkan();