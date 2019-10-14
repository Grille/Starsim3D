import snvk from "simple-nvk";
import fs from "fs";
import Uniform from "./uniform.mjs";

export default class Renderer{
  constructor(device){
    this.device = device;
    this.window = snvk.window;
    this.surface = null;

    this.uniformBuffer = null;
    this.uniformDescriptor = null;
    this.vertexBuffer = null;
    this.vertexBinding = null;
    this.attributes = {
      position:null,
      velocity:null,
      mass:null,
    }

    this.renderPass = null;
    this.renderPipeline = null;

    this.vertShader = null;
    this.fragShader = null;

    this.swapchain = null;

    this.frameAvailable = null;
    this.renderAvailable = null;

    this.commandbuffers = null;

    this.ready = false;

    this.uniform = new Uniform(device);
  }

  setup(vertexBuffer) {
    let { device } = this;

    let vertSource = fs.readFileSync(`./src/renderer.vert`);
    let vertCreateInfo = {
      source: vertSource,
      format: snvk.SHADER_SRC_GLSL,
      stage: snvk.SHADER_STAGE_VERTEX,
    }
    this.vertShader = device.createShader(vertCreateInfo);

    let fragSource = fs.readFileSync(`./src/renderer.frag`);
    let fragCreateInfo = {
      source: fragSource,
      format: snvk.SHADER_SRC_GLSL,
      stage: snvk.SHADER_STAGE_FRAGMENT,
    }
    this.fragShader = device.createShader(fragCreateInfo);

    this.uniform.create(256);
    this.uniformDescriptor = this.uniform.descriptor;

    this.vertexBuffer = vertexBuffer;
    this.vertexBinding = this.vertexBuffer.getBinding(0, 32);
    this.attributes = [
      this.vertexBinding.getAttribute(0, snvk.TYPE_FLOAT32, 3, 0 * 0), //position
      this.vertexBinding.getAttribute(1, snvk.TYPE_FLOAT32, 1, 4 * 3), //enabled
      this.vertexBinding.getAttribute(2, snvk.TYPE_FLOAT32, 3, 4 * 4), //velocity
      this.vertexBinding.getAttribute(3, snvk.TYPE_FLOAT32, 1, 4 * 7), //mass
    ]

  }

  submitUniform(input) {
    let { uniform } = this;

    let offset = 0;
    uniform.setUint32(0 * 4, input.count);
    uniform.setUint32(1 * 4, input.width);
    uniform.setUint32(2 * 4, input.height);
    uniform.setUint32(3 * 4, input.height);

    uniform.setMat4(4 * 4, input.view);
    uniform.setMat4((4 + 16) * 4, input.projection);

    uniform.submit();
  }

  createPipeline(count) {
    let { device,window } = this;

    let renderPassCreateInfo = {
      backgroundColor: [0, 0, 0.0, 1],
    }
    this.renderPass = device.createRenderPass(renderPassCreateInfo);

    let assemblyInfo = {
      topology: snvk.TOPOLOGY_POINT_LIST,
    }
    let rasterizationInfo = {
      polygonMode: snvk.POLYGON_MODE_POINT,
    }
    let blendingInfo = {
      enabled: false,
    }
    let pipelineCreateInfo = {
      assemblyInfo: assemblyInfo,
      rasterizationInfo: rasterizationInfo,
      blendingInfo: blendingInfo,
      renderPass: this.renderPass,
      viewport: device.createViewport(snvk),
      shaders: [this.vertShader, this.fragShader],
      bindings: [this.vertexBinding],
      attributes: [...this.attributes],
      descriptors: [this.uniformDescriptor],
      backgroundColor: [0, 0, 0.0, 1],
    }
    this.renderPipeline = device.createRenderPipeline(pipelineCreateInfo);

    this.surface = device.createSurface({ window });

    let swapchainCreateInfo = {
      width: this.window.width,
      height: this.window.height,
      renderPass: this.renderPass,
      surface: this.surface,
    }
    this.swapchain = device.createSwapchain(swapchainCreateInfo);

    this.frameAvailable = device.createSemaphore();
    this.renderAvailable = device.createSemaphore();

    this.commandbuffers = [];
    for (let i = 0; i < this.swapchain.framebuffers.length; i++) {
      let framebuffer = this.swapchain.framebuffers[i];

      let commandCreateInfo = {
        level: snvk.COMMAND_LEVEL_PRIMARY,
        usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
      }
      let command = device.createCommandBuffer(commandCreateInfo);

      command.begin();
      command.bindRenderPipeline(this.renderPipeline);
      command.beginRender(this.renderPass, framebuffer);

      command.drawArrays(0, count);

      command.endRender();

      command.end();

      this.commandbuffers[i] = command;
    }
    this.ready = true;
  }

  destroyPipeline() {
    let { device } = this;

    device.waitIdle();

    for (let i = 0; i < this.commandbuffers.length; i++) {
      this.commandbuffers[i].destroy();
    }

    this.frameAvailable.destroy();
    this.renderAvailable.destroy();

    this.swapchain.destroy();
    this.surface.destroy();

    this.renderPipeline.destroy();
    this.renderPass.destroy();

    this.ready = false;
  }

  pullData(simulation) {
    let { device } = this;

    let size = simulation.storageBuffer.size;
    device.copyBuffer(simulation.storageBuffer, 0, this.vertexBuffer, 0, size);
  }

  render() {
    let { device } = this;

    let index = this.swapchain.getNextIndex(this.frameAvailable);
    let command = this.commandbuffers[index];
    let submitInfo = {
      waitSemaphore: this.frameAvailable,
      signalSemaphore: this.renderAvailable,
      commandBuffer: command,
    }
    device.submit(submitInfo);
    this.swapchain.present(this.renderAvailable);
  }

  recreate() { }

  shutdown() {
    let { device } = this;

    this.vertexBuffer.destroy();
  }

}