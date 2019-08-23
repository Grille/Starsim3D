export default class Simulation {
  constructor(snvk) {
    this.snvk = snvk;
    this.storageBuffer = null;
    this.computeShader = null;
    this.computePipeline = null;
  }
}
let _prot = Simulation.prototype;

_prot.setup = function () {
  let { snvk } = this;

  let source = snvk.loadShaderSrc(`./src/simulation.comp`);
  let compCreateInfo = {
    source: source,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_COMPUTE,
  }
  this.computeShader = snvk.createShader(compCreateInfo);

  let bufferCreateInfo = {
    size: 1E6 * 16,
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
}
_prot.compute = function () {
  let { snvk } = this;

  snvk.compute(this.computePipeline, 4);
  let array = new Float32Array(snvk.bufferReadData(this.storageBuffer, 0, 4 * 16));
  console.log(array);
}
_prot.shutdown = function () {
  let { snvk } = this;

  snvk.destroyComputePipeline(this.computePipeline);
  snvk.destroyBuffer(this.storageBuffer);
  snvk.destroyShader(this.computeShader);
}