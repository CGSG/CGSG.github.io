#version 300 es
precision highp float;

in vec3 InPosition;

out vec2 FramePos;

void main( void )
{
  gl_Position = vec4(InPosition, 1.0);
  FramePos = InPosition.xy;
}
