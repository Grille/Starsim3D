import snvk from "simple-nvk";
import Uniform from "./uniform.mjs";
import fs from "fs";

export default class Simulation {
  constructor(device) {
    this.device = device;
    this.storageBuffer = null;
    this.commandBuffer = null;
    this.pipelineInteraction = null;
    this.pipelineIntegration = null;
    this.count = 4000;

    this.running = null;

    this.uniform = new Uniform(device);
  }

  setup(storageBuffer) {
    let { device } = this;

    let source = fs.readFileSync("./src/simulation.comp", "utf8");
    
    this.uniform.create(16);
    let uniformDescriptor = this.uniform.descriptor;

    this.storageBuffer = storageBuffer;
    let stroageDescriptor = this.storageBuffer.getDescriptor(0, snvk.DESCRIPTOR_TYPE_STORAGE);

    let descriptors = [stroageDescriptor, uniformDescriptor];

    this.pipelineInteraction = this.createPipeline(descriptors, source, "interaction");
    this.pipelineIntegration = this.createPipeline(descriptors, source, "integration");

    this.running = device.createFence();
  }

  submitUniform(input) {
    let { uniform } = this;

    uniform.setUint32(0, input.count);

    uniform.submit();
  }

  createCommand(count) {
    let { device } = this;

    this.count = count;

    if (this.commandBuffer !== null) {
      device.waitForIdle();
      device.waitForFence(this.running, 60 * 1E3);
      this.commandBuffer.destroy();
    }

    let commandCreateInfo = {
      level: snvk.COMMAND_LEVEL_PRIMARY,
      usage: snvk.COMMAND_USAGE_SIMULTANEOUS,
    }

    let groupCount = Math.min(1024, this.count);

    this.commandBuffer = device.createCommandBuffer(commandCreateInfo);

    this.commandBuffer.begin();

    this.commandBuffer.bindComputePipeline(this.pipelineInteraction);
    this.commandBuffer.dispatch(groupCount);

    this.commandBuffer.bindComputePipeline(this.pipelineIntegration);
    this.commandBuffer.dispatch(groupCount);

    this.commandBuffer.end();
  }

  compute() {
    let { device } = this;

    let submitInfo = {
      commandBuffer: this.commandBuffer,
      blocking: false,
    }
    device.submit(submitInfo);
  }

  pushStars(stars) {
    let { device } = this;

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
    this.storageBuffer.subData(0, data, 0, this.count * 32);
  }

  readData() {
    let { device } = this;

    return new Float32Array(this.storageBuffer.readData(0, this.count * 32));
  }

  createPipeline(descriptors, source, entryPoint) {
    let { device } = this;

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
    let shader = device.createShader(compCreateInfo);

    let computePipelineCreateInfo = {
      shader: shader,
      descriptors: descriptors,
    }
    let pipeline = device.createComputePipeline(computePipelineCreateInfo);
    pipeline.shader = shader;

    return pipeline;
  }

  shutdown() {
    let { device } = this;

    device.waitIdle();

    //snvk.waitForFence(this.running, 60 * 1E3);
    this.running.destroy();
    this.commandBuffer.destroy();
    this.pipelineInteraction.destroy();
    this.pipelineIntegration.destroy();
    this.storageBuffer.destroy();
    this.pipelineInteraction.shader.destroy();
    this.pipelineIntegration.shader.destroy();
  }

}
