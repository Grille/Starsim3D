import fs from "fs"

export default class Simulation {
  constructor(snvk) {
    this.snvk = snvk;
    this.uniformBuffer = null;
    this.storageBuffer = null;
    this.commandBuffer = null;
    this.computeShader = null;
    this.computePipeline = null;
    this.count = 4000;

    this.running = null;
  }
}

Simulation.prototype.createPipeline = function(descriptors, source, entryPoint) {
  let { snvk } = this;

  let reg = new RegExp(`void[\\s]+${entryPoint}[\\s]*[(]`, `g`);
  let code = source.replace((reg), "void main(");

  let compCreateInfo = {
    source: code,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_COMPUTE,
  }
  let shader = snvk.createShader(compCreateInfo);

  let computePipelineCreateInfo = {
    shader: shader,
    descriptors: descriptors,
  }
  let pipeline = snvk.createComputePipeline(computePipelineCreateInfo);

  return {
    pipeline,
    shader,
  }
}
Simulation.prototype.setup = function (buffers) {
  let { snvk } = this;

  let source = fs.readFileSync("./src/simulation.comp","utf8");

  this.storageBuffer = buffers.storageBuffer;
  let stroageDescriptor = snvk.getDescriptor(this.storageBuffer, 0, snvk.DESCRIPTOR_TYPE_STORAGE, snvk.SHADER_STAGE_COMPUTE);
  this.uniformBuffer = buffers.uniformBuffer;
  let uniformDescriptor = snvk.getDescriptor(this.uniformBuffer, 1, snvk.DESCRIPTOR_TYPE_UNIFORM);
  let descriptors = [stroageDescriptor, uniformDescriptor];

  this.pipeline = this.createPipeline(descriptors, source, "main");
/*
  let computePipelineCreateInfo = {
    shader: this.computeShader,
    descriptors: [stroageDescriptor, uniformDescriptor],
  }
  this.computePipeline = snvk.createComputePipeline(computePipelineCreateInfo);
*/
  this.running = snvk.createFence();
}

Simulation.prototype.createCommand = function (count) {
  let { snvk } = this;

  this.count = count;

  if (this.commandBuffer !== null){
    snvk.waitForIdle();
    snvk.waitForFence(this.running, 60 * 1E3);
    snvk.destroyBuffer(this.commandBuffer);
  }

  let commandCreateInfo = {
    level: snvk.COMMAND_LEVEL_PRIMARY,
    usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
  }
  this.commandBuffer = snvk.createCommandBuffer(commandCreateInfo);

  snvk.cmdBegin(this.commandBuffer);

  snvk.cmdBindComputePipeline(this.commandBuffer, this.pipeline.pipeline);
  snvk.cmdDispatch(this.commandBuffer, this.count);

  snvk.cmdEnd(this.commandBuffer);
}

Simulation.prototype.compute = function () {
  let { snvk } = this;

  snvk.resetFence(this.running);

  let submitInfo = {
    commandBuffer: this.commandBuffer,
    blocking: false,
    //signalFence: this.running,
  }
  snvk.submit(submitInfo);

  //snvk.waitForFence(this.running);

  //snvk.waitForIdle();
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

  snvk.waitForIdle();

  //snvk.waitForFence(this.running, 60 * 1E3);
  snvk.destroyFence(this.running);
  snvk.destroyCommandBuffer(this.commandBuffer);
  snvk.destroyComputePipeline(this.pipeline.pipeline);
  snvk.destroyBuffer(this.storageBuffer);
  snvk.destroyShader(this.pipeline.shader);
}
