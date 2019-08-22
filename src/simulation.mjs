export default class Simulation {
  constructor(snvk) {
    this.snvk = snvk;
    this.positionBuffer = null;
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
    type: snvk.TYPE_FLOAT32,
    size: 3,
    length: 1E1,
    usage: snvk.BUFFER_USAGE_STORAGE,
    readable: true,
  }
  this.positionBuffer = snvk.createBuffer(bufferCreateInfo);
  let stroageBinding = snvk.getBinding(this.positionBuffer, 0);

  let computePipelineCreateInfo = {
    shader: this.computeShader,
    bindings: [stroageBinding],
  }
  this.computePipeline = snvk.createComputePipeline(computePipelineCreateInfo);
}
_prot.compute = function () {
  let { snvk } = this;

  snvk.compute(this.computePipeline,1);
  let array = new Float32Array(snvk.bufferReadData(this.positionBuffer));
  console.log(array);
}
_prot.shutdown = function () {
  let { snvk } = this;

  snvk.destroyComputePipeline(this.computePipeline);
  snvk.destroyBuffer(this.positionBuffer);
  snvk.destroyShader(this.computeShader);
}