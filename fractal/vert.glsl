#version 300 es
/**/
precision highp float;
in vec4 in_pos;

out vec4 color;
out vec2 tpos;
uniform float Time;
uniform vec3 SetColor;

void main( void )
{
  gl_Position = in_pos;
  tpos = in_pos.xy;
  color = vec4(SetColor, 1);
}