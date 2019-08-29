export default class Uniform{
  constructor(snvk) {
    this.snvk = snvk;
    this.data = null;
    this.view = null;
    this.buffer = null;
    this.descriptor = null;
  }
  create(size){
    let {snvk} = this;

    this.data = new Uint8Array(size);
    this.view = new DataView(this.data.buffer);

    let uniformBufferCreateInfo = {
      size: this.data.byteLength,
      usage: snvk.BUFFER_USAGE_UNIFORM,
    }

    this.buffer = snvk.createBuffer(uniformBufferCreateInfo);
    this.descriptor = snvk.getDescriptor(this.buffer, 1, snvk.DESCRIPTOR_TYPE_UNIFORM);
  }
  setUint32(offset, value) {
    this.view.setUint32(offset, value, true);
  }
  setFloat32(offset, value) {
    this.view.getFloat32(offset, value, true);
  }
  setMat4(offset, value) {
    uniformData.set(new Uint8Array(value.buffer), offset);
  }
  submit() {
    let {snvk} = this;

    snvk.bufferSubData(this.buffer, 0, this.data, 0, this.data.byteLength);
  }
  destroy() {
    let {snvk} = this;

    snvk.destroyBuffer(this.buffer);
  }
}

