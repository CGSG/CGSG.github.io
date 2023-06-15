#version 300 es
precision highp float;

in vec3 InPosition;
in vec3 InNormal;
in vec2 InTexCoords;

out struct VS_OUT
{
  vec3 N;   // Vertex normal
  vec3 Pos; // Vertex position
  vec2 TexCoords; // Vertex texture coordinates
  vec3 OrgPos; // Vertex position
} vs_out;

uniform primBuffer
{
  mat4 BufMatrWVP;
  mat4 BufMatrW;
  mat4 BufInvWTrans;
};

void main( void )
{
  gl_Position = BufMatrWVP * vec4(InPosition, 1.0);
  vs_out.N = mat3(BufInvWTrans) * normalize(InNormal);
  vs_out.Pos = (BufMatrW * vec4(InPosition, 1.0)).xyz;
  vs_out.TexCoords = InTexCoords;
  vs_out.OrgPos = InPosition;
}
