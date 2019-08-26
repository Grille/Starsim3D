export default class Simulation {
  constructor(snvk) {
    this.snvk = snvk;
    this.storageBuffer = null;
    this.commandBuffer = null;
    this.computeShader = null;
    this.computePipeline = null;
    this.count = 0;
  }
}

Simulation.prototype.setup = function () {
  let { snvk } = this;

  let source = snvk.loadShaderSrc(`./src/simulation.comp`);
  let compCreateInfo = {
    source: source,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_COMPUTE,
  }
  this.computeShader = snvk.createShader(compCreateInfo);

  let bufferCreateInfo = {
    size: 1E6 * 32,
    usage: snvk.BUFFER_USAGE_STORAGE,
    readable: true,
  }
  this.storageBuffer = snvk.createBuffer(bufferCreateInfo);
  let stroageBinding = snvk.getBinding(this.storageBuffer, 0);

  let computePipelineCreateInfo = {
    shader: this.computeShader,
    bindings: [stroageBinding],
  }
  this.computePipeline = snvk.createComputePipeline(computePipelineCreateInfo);

  let commandCreateInfo = {
    level: snvk.COMMAND_LEVEL_PRIMARY,
    usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
  }
  this.commandBuffer = snvk.createCommandBuffer(commandCreateInfo);

  snvk.cmdBegin(this.commandBuffer);

  snvk.cmdBindComputePipeline(this.commandBuffer, this.computePipeline);
  snvk.cmdDispatch(this.commandBuffer, 2);

  snvk.cmdEnd(this.commandBuffer);
}

Simulation.prototype.compute = function () {
  let { snvk } = this;

  let submitInfo = {
    commandBuffer: this.commandBuffer,
    blocking: true,
  }
  snvk.submit(submitInfo);
}

Simulation.prototype.pushStars = function (stars) {
  let { snvk } = this;

  this.count = stars.length;
  let data = new Float32Array(stars.length * 8);
  for (let i = 0;i<stars.length;i++){
    let offset = i * 8;
    data[offset + 0] = stars[i].pos.x;
    data[offset + 1] = stars[i].pos.y;
    data[offset + 2] = stars[i].pos.z;
    data[offset + 4] = stars[i].vel.x;
    data[offset + 5] = stars[i].vel.y;
    data[offset + 6] = stars[i].vel.z;
    data[offset + 7] = stars[i].mass;
  }
  snvk.bufferSubData(this.storageBuffer, 0, data, 0, this.count * 32);
}

Simulation.prototype.readData = function () {
  let { snvk } = this;

  return new Float32Array(snvk.bufferReadData(this.storageBuffer, 0, this.count * 32));
}

Simulation.prototype.readStars = function() {
  let data = this.readData();
  let stars = [];
  for (let i = 0;i<data.length/8;i++){
    let offset = i * 8;
    let star = {
      pos: {
        x: data[offset + 0],
        y: data[offset + 1],
        z: data[offset + 2],
      },
      id: data[offset + 3],
      vel: {
        x: data[offset + 4],
        y: data[offset + 5],
        z: data[offset + 6],
      },
      mass: data[offset + 7],
    }
    stars[i] = star;
  }
  return stars;
}

Simulation.prototype.shutdown = function () {
  let { snvk } = this;

  snvk.destroyComputePipeline(this.computePipeline);
  snvk.destroyBuffer(this.storageBuffer);
  snvk.destroyShader(this.computeShader);
}
