#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(location = 0) in vec4 vColor;

layout(location = 0) out vec4 outColor;

void main() {
  if(length(gl_PointCoord - 0.5) > 0.5)
    discard;
  outColor = vec4(vColor);
}