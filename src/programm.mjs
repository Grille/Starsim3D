import snvk from "simple-nvk"
import Simulation from "./simulation.mjs"
import Renderer from "./renderer.mjs"
import glm from "gl-matrix";

export default class Programm{
  constructor(){
    this.lastResize = 0;
    
    snvk.startWindow({ width: 800, height: 600, title: "Starsim-3D" });
    snvk.startVulkan();

    this.device = snvk.createDevice();

    this.count = 5000;
    
    this.computeDate = Date.now();
    this.renderDate = Date.now();
    
    this.window = snvk.window;
    
    let storageBufferCreateInfo = {
      size: 1E6 * 32,
      usage: snvk.BUFFER_USAGE_STORAGE | snvk.BUFFER_USAGE_VERTEX,
      readable: true,
    }
    this.storageBuffer = this.device.createBuffer(storageBufferCreateInfo);
    
    this.simulation = new Simulation(this.device);
    this.renderer = new Renderer(this.device);
    
    this.simulation.setup(this.storageBuffer);
    this.renderer.setup(this.storageBuffer);
    
    this.updateUniform(this.count, this.window.width, this.window.height);
    
    let starCreateInfo = {
      count: this.count,
      radius: 18,
      position: {
        x: 0, y: 0, z: 0,
      },
      scale: {
        x: 1, y: 1, z: 0.2,
      },
    }
    this.createStars(starCreateInfo);
    
    let date = Date.now();
    for (let i = 0;i<20;i++){
      //simulation.compute();
    }
    console.log(`time: ${Date.now()-date}ms`);
    
    this.window.onresize = () => {
      if (this.renderer.ready){
        this.renderer.destroyPipeline();
      }
      this.lastResize = Date.now();
    }
    
    //console.log(simulation.readStars());
    
    this.eventLoop();
  }

  updateUniform(count,width,height) {
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
    
    
    this.renderer.submitUniform({ count, width, height, view, projection });
    this.simulation.submitUniform({ count });
  }

  createStars(createInfo) {
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
    this.simulation.createCommand(count);
    this.simulation.pushStars(stars);
    if (this.renderer.ready) {
      this.renderer.destroyPipeline();
    }
    this.renderer.createPipeline(count);
  }

  shutdown() {
    this.simulation.shutdown();
    this.renderer.shutdown();
    
    this.device.shutdownVulkan();
  }

  eventLoop() {
    if (this.window.shouldClose()) {
      this.simulation.shutdown();
      this.renderer.shutdown();
      this.device.shutdownVulkan();
    }
    else {
      this.window.pollEvents();
      if (this.renderer.ready) {
        if ((Date.now() - this.computeDate) > 10) {
          this.computeDate = Date.now();
          this.simulation.compute();
        }
        if ((Date.now() - this.renderDate) > 20) {
          this.renderDate = Date.now();
          this.renderer.render();
        }
      }
      if (this.lastResize !== 0 && Date.now() - this.lastResize > 10 && (this.window.width > 0 && this.window.height > 0)) {
        this.lastResize = 0;
        this.updateUniform(this.count, this.window.width, this.window.height);
        this.renderer.createPipeline(this.count);
      }
      setTimeout(() => this.eventLoop(), 10);
    }
  }
}

new Programm();
