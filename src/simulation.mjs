import Uniform from "./uniform.mjs";
import fs from "fs";


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

    this.uniform = new Uniform(snvk);
  }

  setup(storageBuffer) {
    let { snvk } = this;

    let source = fs.readFileSync("./src/simulation.comp", "utf8");
    
    this.uniform.create(16);
    let uniformDescriptor = this.uniform.descriptor;

    this.storageBuffer = storageBuffer;
    let stroageDescriptor = snvk.getDescriptor(this.storageBuffer, 0, snvk.DESCRIPTOR_TYPE_STORAGE);

    let descriptors = [stroageDescriptor, uniformDescriptor];

    this.pipeline = this.createPipeline(descriptors, source, "main");
    this.pipeline2 = this.createPipeline(descriptors, source, "apply");

    this.running = snvk.createFence();
  }

  submitUniform(input) {
    let { uniform } = this;

    uniform.setUint32(0, input.count);

    uniform.submit();
  }

  createCommand(count) {
    let { snvk } = this;

    this.count = count;

    if (this.commandBuffer !== null) {
      snvk.waitForIdle();
      snvk.waitForFence(this.running, 60 * 1E3);
      snvk.destroyCommandBuffer(this.commandBuffer);
    }

    let commandCreateInfo = {
      level: snvk.COMMAND_LEVEL_PRIMARY,
      usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
    }
    this.commandBuffer = snvk.createCommandBuffer(commandCreateInfo);

    let groupCount = Math.min(1000, this.count);

    snvk.cmdBegin(this.commandBuffer);

    snvk.cmdBindComputePipeline(this.commandBuffer, this.pipeline.pipeline);
    snvk.cmdDispatch(this.commandBuffer, groupCount);

    snvk.cmdBindComputePipeline(this.commandBuffer, this.pipeline2.pipeline);
    snvk.cmdDispatch(this.commandBuffer, groupCount);

    snvk.cmdEnd(this.commandBuffer);
  }

  compute() {
    let { snvk } = this;

    let submitInfo = {
      commandBuffer: this.commandBuffer,
      blocking: false,
    }
    snvk.submit(submitInfo);
  }

  pushStars(stars) {
    let { snvk } = this;

    this.count = stars.length;
    let data = new Float32Array(stars.length * 8);
    for (let i = 0; i < stars.length; i++) {
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

  readData() {
    let { snvk } = this;

    return new Float32Array(snvk.bufferReadData(this.storageBuffer, 0, this.count * 32));
  }

  createPipeline(descriptors, source, entryPoint) {
    let { snvk } = this;

    let code = source;
    if (entryPoint !== "main") {
      code = code.replace(/main[\\s]*[(]/g, "_main_(");
      let reg = new RegExp(`void[\\s]+${entryPoint}[\\s]*[(]`, `g`);
      code = code.replace(reg, "void main(");
    }

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

  shutdown() {
    let { snvk } = this;

    snvk.waitForIdle();

    //snvk.waitForFence(this.running, 60 * 1E3);
    snvk.destroyFence(this.running);
    snvk.destroyCommandBuffer(this.commandBuffer);
    snvk.destroyComputePipeline(this.pipeline.pipeline);
    snvk.destroyBuffer(this.storageBuffer);
    snvk.destroyShader(this.pipeline.shader);
  }

}
