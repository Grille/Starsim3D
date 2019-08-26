#version 450
#extension GL_ARB_separate_shader_objects : enable

#define WIDTH 800
#define HEIGHT 600

layout(location = 0) in vec3 pos;
//layout(location = 2) in vec3 vel;

out gl_PerVertex {
  vec4 gl_Position;
  float gl_PointSize;
};

layout(location = 0) out vec4 vertexColor;

void main(){
  vertexColor = vec4(1, 1, 1, 1);
  gl_Position = vec4(pos, 1.0);
  gl_PointSize = 5;
}