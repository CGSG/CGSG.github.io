#version 300 es
/**/
precision highp float;
out vec4 o_color;

in vec4 color;
in vec2 tpos;
uniform float Time;

uniform frameBuffer
{
  vec4 BufData[4];
};

vec2 mul( vec2 z1, vec2 z2 )
{
    return vec2(z1.x * z2.x - z1.y * z2.y, z1.x * z2.y + z1.y * z2.x);
}
float Jul( vec2 z, vec2 z0 )
{
    for (int i = 0; i < 256; i++)
    {
        if (dot(z, z) > 4.0)
          return float(i);
        z = mul(z, z) + z0;
    }
    return 256.0;
}
vec2 Rot( float A, vec2 v )
{
    return mat2(vec2(cos(A), -sin(A)), vec2(sin(A), cos(A))) * v;
}

void main( void )
{

  vec2 tp = (tpos + 1.0) / 2.0 * BufData[0].yw + BufData[0].xz;
  //tp.x = tpos.x;
  //tp.y = BufData[0]
  vec2 p = Rot(Time * BufData[3].z * acos(-1.0) / 180.0, tp) * 1.0;
  //vec2 p = tp;
  float c = Jul(p, vec2(BufData[2].x + BufData[2].y * sin(Time), BufData[2].z + BufData[2].w * sin(Time + BufData[3].x))) / 256.0;
  //float c = Jul(p, p) / 256.0;
  o_color = mod(color * c * BufData[3].y, vec4(1, 1, 1, 1));
}