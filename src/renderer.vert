#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(binding = 1) uniform ub {
  uint count;
  uint width;
  uint height;
};

layout(location = 0) in vec3 pos;
layout(location = 1) in float id;
layout(location = 2) in vec3 vel;
layout(location = 3) in float mass;

out gl_PerVertex {
  vec4 gl_Position;
  float gl_PointSize;
};

layout(location = 0) out vec4 vertexColor;

void main(){

  vertexColor = vec4(1*(int(id)%3), 1*(int(id)%2), 1, 1);
  vec3 position = vec3(pos.x / width,pos.y / height,pos.z);
  gl_Position = vec4(position, 1.0);
  gl_PointSize = mass*5;
}