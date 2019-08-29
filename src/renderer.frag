#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(location = 0) in vec4 vColor;

layout(location = 0) out vec4 outColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);  //from [0,1] to [-0.5,0.5]
  if(length(coord) > 0.5)                  //outside of circle radius?
    discard;
  outColor = vec4(vColor);
}