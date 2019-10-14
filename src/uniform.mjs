import snvk from "simple-nvk";

export default class Uniform{
  constructor(device) {
    this.device = device;
    this.data = null;
    this.view = null;
    this.buffer = null;
    this.descriptor = null;
  }
  create(size) {
    this.data = new Uint8Array(size);
    this.view = new DataView(this.data.buffer);

    let uniformBufferCreateInfo = {
      size: this.data.byteLength,
      usage: snvk.BUFFER_USAGE_UNIFORM,
    }

    this.buffer = this.device.createBuffer(uniformBufferCreateInfo);
    this.descriptor = this.buffer.getDescriptor(1, snvk.DESCRIPTOR_TYPE_UNIFORM);
  }
  setUint32(offset, value) {
    this.view.setUint32(offset, value, true);
  }
  setFloat32(offset, value) {
    this.view.getFloat32(offset, value, true);
  }
  setMat4(offset, value) {
    this.data.set(new Uint8Array(value.buffer), offset);
  }
  submit() {
    this.buffer.subData(0, this.data, 0, this.data.byteLength);
  }
  destroy() {
    this.buffer.destroy();
  }
}

