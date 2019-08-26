export default class Renderer{
  constructor(snvk){
    this.snvk = snvk;
    this.window = snvk.window;

    this.vertexBuffer = null;
    this.vertexBinding = null;
    this.attributes = {
      position:null,
      velocity:null,
      mass:null,
    }

    this.vertShader = null;
    this.fragShader = null;
  }
}

Renderer.prototype.setup = function () {
  let { snvk } = this;

  /*
  let source = snvk.loadShaderSrc(`./src/renderer.vert`);
  let vertCreateInfo = {
    source: source,
    format: snvk.SHADER_SRC_GLSL,
    stage: snvk.SHADER_STAGE_VERTEX,
  }
  this.vertShader = snvk.createShader(compCreateInfo);
  */

  let stride = 32;

  let bufferCreateInfo = {
    size: 1E6 * stride,
    usage: snvk.BUFFER_USAGE_VERTEX,
  }
  this.vertexBuffer = snvk.createBuffer(bufferCreateInfo);
  this.vertexBinding = snvk.getBinding(this.storageBuffer, 0, stride);
  this.attributes = {
    position: snvk.getAttribute(this.vertexBinding, 0, snvk.TYPE_FLOAT32, 3, 0),
    enabled: snvk.getAttribute(this.vertexBinding, 0, snvk.TYPE_FLOAT32, 1, 4 * 3),
    velocity: snvk.getAttribute(this.vertexBinding, 0, snvk.TYPE_FLOAT32, 3, 4 * 4),
    mass: snvk.getAttribute(this.vertexBinding, 0, snvk.TYPE_FLOAT32, 1, 4 * 7),
  }

}

Renderer.prototype.pullData = function (simulation) {
  let { snvk } = this;

  //snvk.copyBuffer(simulation.storageBuffer, this.vertexBuffer);
}

Renderer.prototype.render = function () {}

Renderer.prototype.recreate = function () {}

Renderer.prototype.shutdown = function () {
  let { snvk } = this;

  snvk.destroyBuffer(this.vertexBuffer);
}