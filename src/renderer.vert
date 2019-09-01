#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(binding = 1) uniform ub {
  uint count;
  uint width;
  uint height;
  mat4 view;
  mat4 projection;
};

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aID;
layout(location = 2) in vec3 aVelocity;
layout(location = 3) in float aMass;

out gl_PerVertex {
  vec4 gl_Position;
  float gl_PointSize;
};

layout(location = 0) out vec4 vColor;

void main(){
  vec4 cameraPosition = view * vec4(aPosition, 1.0);
  vec4 vertexPosition = projection * cameraPosition;

  float dist = 1 - vertexPosition.z / 32;
  vColor = vec4(1.2*dist, 1*dist, 1.5*dist, 1);
  //vColor = vec4((cameraPosition.x+1)*0.5*dist, (cameraPosition.y+1)*0.5*dist, dist, 1);

  gl_Position = vertexPosition;
  gl_PointSize = max((aMass*10) / gl_Position.w, 1.5);
}