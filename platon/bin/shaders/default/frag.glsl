#version 300 es
precision highp float;
out vec4 OutColor;

in struct VS_OUT
{
  vec3 N;   // Vertex normal
  vec3 Pos; // Vertex position
  vec2 TexCoords; // Vertex texture coordinates
  vec3 OrgPos; // Vertex position
} vs_out;

uniform frameBuffer
{
  vec4 BufCamLoc;
  vec4 BufCamRight;
  vec4 BufCamUp;
  vec4 BufCamDir;
  vec4 FrameWHProjSizeDist;
  vec4 BufTime;
  vec4 BufFlags;
};
#define Time BufTime.x
#define IsShowNormals BufFlags.x
#define IsShowSkyBox BufFlags.y
#define FrameW FrameWHProjSizeDist.x
#define FrameH FrameWHProjSizeDist.y
#define ProjSize FrameWHProjSizeDist.z
#define ProjDist FrameWHProjSizeDist.w
#define CamLoc BufCamLoc.xyz
#define CamRight BufCamRight.xyz
#define CamUp BufCamUp.xyz
#define CamDir BufCamDir.xyz

uniform sampler2D Texture0;
uniform samplerCube SkyBoxTexture;

uniform mtlBuffer
{
  vec4 BufKa;
  vec4 BufKdTrans;
  vec4 BufKsPh;
  vec4 BufTextureFlags;
};

vec3 LightShade( vec3 Pos, vec3 N,
                 vec3 Kd, vec3 Ks, float Ph,
                 vec3 V, vec3 R,
                 vec3 LColor, vec3 LDir )
{
  vec3 color;

  // Diffuse
  color = max(0.0, dot(N, LDir)) * Kd * LColor;

  // Specular
  color += pow(max(0.0, dot(R, LDir)), Ph) * Ks * LColor;

  return color; // color
} 

struct light
{
  vec3 LPos;
  vec3 LCol;
};

vec3 Eval( vec3 Pos, vec3 N,
           vec3 Kd, vec3 Ks, float Ph,
           vec3 V, vec3 R,
           light Lgt )
{
  vec3 L = Lgt.LPos - Pos;
  float dl = length(L);
  L /= dl;
  vec3 att = vec3(1.0, 0.108, 0.0);
  float Fatt = min(1.0, 1.0 / dot(vec3(1, dl, dl * dl), att));

  return Fatt * LightShade(Pos, N, Kd, Ks, Ph, V, R, Lgt.LCol, normalize(Lgt.LPos - Pos));
}

void main( void )
{
  // vec3 V1 = normalize(vs_out.Pos - BufCamLoc.xyz);
  // vec3 N1 = normalize(vs_out.N);
  // N1 = faceforward(vs_out.Pos, V1, N1);
  // //vec4 tc1 = texture(SkyBoxTexture, vs_out.OrgPos);
  // OutColor = vec4(N1, 1.0);	
  // return;
  vec3
    color = min(BufKa.rgb, vec3(0.1)),
    N = normalize(vs_out.N);
  vec3 V = normalize(vs_out.Pos - BufCamLoc.xyz);

  N = faceforward(N, V, N);
  vec3 R = reflect(V, N);

  // Diffuse from texture
  vec3 Kd = BufKdTrans.rgb;
  if (BufTextureFlags.x != 0.0)
  {
    vec4 tc = texture(Texture0, vs_out.TexCoords);
    if (tc.a > 0.2)
      Kd = tc.rgb;
    else
      discard;
    //OutColor = vec4(tc.rgb, 1.0);	
  }

  light Ls[3];
  Ls[0] = light(vec3(0.0, 10.0, 10.0 * sin(Time)),        vec3(1.0, 1.0, 1.0) * 0.5998);
  Ls[1] = light(vec3(10.0, 10.0, 10.0 * sin(Time + 1.0)), vec3(1.0, 1.0, 1.0) * 0.5998);
  Ls[2] = light(vec3(10.0 * sin(Time + 2.0), 10.0, 10.0), vec3(1.0, 1.0, 1.0) * 0.5998);

  for (int lig = 0; lig < Ls.length(); lig++)
    color += Eval(vs_out.Pos, N,
                  Kd, BufKsPh.rgb, BufKsPh.a, V, R, Ls[lig]);

  //vec3 col = max(0.30, dot(normalize(vs_out.N), normalize(vec3(1.0 + 2.0 * sin(Time), 1.0, 1.0 + 2.0 * sin(Time + 1.0))))) * vec3(0.8, 0.47, 0.29);
  if (IsShowNormals == 1.0)
    color = vec3(normalize(vs_out.N) * 0.5 + 0.5);
  // OutColor = vec4(color, 1.0);
  // return;
  // Environment mapping
  if (IsShowSkyBox != 0.0)
  {
    vec4 tc = texture(SkyBoxTexture, R);
    if (tc.a > 0.2)
      color += tc.rgb * BufKsPh.rgb * 0.18;

    float
      dist = distance(BufCamLoc.xyz, vs_out.Pos.xyz),
      a = 18.0, b = 90.0, t;

    t = 1.0 - min(1.0, max(0.0, (dist - a) / (b - a)));
    if (t <= 1.0)
    {
      float Wp, Hp;

      Wp = Hp = ProjSize;
      if (FrameW > FrameH)
        Wp *= FrameW / FrameH;
      else
        Hp *= FrameH / FrameW;

      float
        xp = gl_FragCoord.x * Wp / FrameW - Wp / 2.0, // FramePos.x * Wp / 2.0, // 
        yp = gl_FragCoord.y * Hp / FrameH - Hp / 2.0; // FramePos.y * Wp / 2.0; // 

      vec3 D = normalize(CamDir * ProjDist + CamRight * xp + CamUp * yp);

      /*
      vec2 uv =
        vec2(atan(D.x, D.z) / (2 * acos(-1)), acos(-D.y) / acos(-1));
      vec4 tc = texture(Tex, uv);
      */
      // vec4 tc = texture(SkyBoxTexture, D);
      color = mix(tc.rgb, color, t);
    }
  }
  OutColor = vec4(color, BufKdTrans.w);
}
