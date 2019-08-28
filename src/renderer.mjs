export default class Renderer{
  constructor(snvk){
    this.snvk = snvk;
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
  }
}

Renderer.prototype.setup = function (buffers) {
  let { snvk } = this;

  let vertSource = snvk.loadShaderSrc(`./src/renderer.vert`);
  let vertCreateInfo = {
    source: vertSource,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_VERTEX,
  }
  this.vertShader = snvk.createShader(vertCreateInfo);

  let fragSource = snvk.loadShaderSrc(`./src/renderer.frag`);
  let fragCreateInfo = {
    source: fragSource,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_FRAGMENT,
  }
  this.fragShader = snvk.createShader(fragCreateInfo);
  
  this.vertexBuffer = buffers.storageBuffer;//snvk.createBuffer(bufferCreateInfo);
  this.vertexBinding = snvk.getBinding(this.vertexBuffer, 0, 32);
  this.attributes = [
    snvk.getAttribute(this.vertexBinding, 0, snvk.TYPE_FLOAT32, 3, 0), //position
    snvk.getAttribute(this.vertexBinding, 1, snvk.TYPE_FLOAT32, 1, 4 * 3), //enabled
    snvk.getAttribute(this.vertexBinding, 2, snvk.TYPE_FLOAT32, 3, 4 * 4), //velocity
    snvk.getAttribute(this.vertexBinding, 3, snvk.TYPE_FLOAT32, 1, 4 * 7), //mass
  ]

  this.uniformBuffer = buffers.uniformBuffer;
  this.uniformDescriptor = snvk.getDescriptor(this.uniformBuffer, 1, snvk.DESCRIPTOR_TYPE_UNIFORM);

}

Renderer.prototype.createPipeline = function (count) {
  let { snvk } = this;

  this.renderPass = snvk.createRenderPass();

  let assemblyInfo = {
    topology: snvk.TOPOLOGY_POINT_LIST,
  }
  let rasterizationInfo = {
    polygonMode: snvk.POLYGON_MODE_POINT,
  }
  let pipelineCreateInfo = {
    assemblyInfo: assemblyInfo,
    rasterizationInfo: rasterizationInfo,
    renderPass: this.renderPass,
    viewport: snvk.createViewport(),
    shaders: [this.vertShader, this.fragShader],
    bindings: [this.vertexBinding],
    attributes: [...this.attributes],
    descriptors: [this.uniformDescriptor],
    backgroundColor: [0, 0, 0.0, 1],
  }
  this.renderPipeline = snvk.createRenderPipeline(pipelineCreateInfo);

  this.surface = snvk.createSurface();

  let swapchainCreateInfo = {
    width: this.window.width,
    height: this.window.height,
    renderPass: this.renderPass,
    surface: this.surface,
  }
  this.swapchain = snvk.createSwapchain(swapchainCreateInfo);

  this.frameAvailable = snvk.createSemaphore();
  this.renderAvailable = snvk.createSemaphore();

  this.commandbuffers = [];
  for (let i = 0; i < this.swapchain.framebuffers.length; i++) {
    let framebuffer = this.swapchain.framebuffers[i];

    let commandCreateInfo = {
      level: snvk.COMMAND_LEVEL_PRIMARY,
      usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
    }
    let command = snvk.createCommandBuffer(commandCreateInfo);

    snvk.cmdBegin(command);

    snvk.cmdBeginRender(command, this.renderPipeline, framebuffer);

    snvk.cmdDrawArrays(command, 0, count);

    snvk.cmdEndRender(command);

    snvk.cmdEnd(command);

    this.commandbuffers[i] = command;
  }
  this.ready = true;
}

Renderer.prototype.destroyPipeline = function () {
  let { snvk } = this;

  snvk.waitForIdle();

  for (let i = 0;i<this.commandbuffers.length;i++){
    snvk.destroyCommandBuffer(this.commandbuffers[i]);
  }

  snvk.destroySemaphore(this.frameAvailable);
  snvk.destroySemaphore(this.renderAvailable);

  snvk.destroySwapchain(this.swapchain);
  snvk.destroySurface(this.surface);

  snvk.destroyRenderPipeline(this.renderPipeline);
  snvk.destroyRenderPass(this.renderPass);

  this.ready = false;
}

Renderer.prototype.pullData = function (simulation) {
  let { snvk } = this;

  let size = simulation.storageBuffer.size;
  snvk.copyBuffer(simulation.storageBuffer, 0, this.vertexBuffer, 0, size);
}

Renderer.prototype.render = function () {
  let { snvk } = this;

  let index = snvk.getNextSwapchainIndex(this.swapchain, this.frameAvailable);
  let command = this.commandbuffers[index];
  let submitInfo = {
    waitSemaphore: this.frameAvailable,
    signalSemaphore: this.renderAvailable,
    commandBuffer: command,
  }
  snvk.submit(submitInfo);
  snvk.present(this.swapchain, this.renderAvailable);
}

Renderer.prototype.recreate = function () {}

Renderer.prototype.shutdown = function () {
  let { snvk } = this;

  snvk.destroyBuffer(this.vertexBuffer);
}