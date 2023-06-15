#version 300 es
precision highp float;

out vec4 OutColor;

in vec2 FramePos;

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
#define CamRight BufCamRight.xyz
#define CamUp BufCamUp.xyz
#define CamDir BufCamDir.xyz


uniform samplerCube SkyBoxTexture;

void main( void )
{              
  if (IsShowSkyBox == 0.0)
    discard;
  float Wp, Hp;

  Wp = Hp = ProjSize;
  if (FrameW > FrameH)
    Wp *= FrameW / FrameH;
  else
    Hp *= FrameH / FrameW;

  float
    xp = gl_FragCoord.x * Wp / FrameW - Wp / 2.0, //  FramePos.x * Wp / 2.0, // 
    yp = gl_FragCoord.y * Hp / FrameH - Hp / 2.0; // FramePos.y * Wp / 2.0; // 

  vec3 D = normalize(CamDir * ProjDist + CamRight * xp + CamUp * yp);

  /*
  vec2 uv =
    vec2(atan(D.x, D.z) / (2 * acos(-1)), acos(-D.y) / acos(-1));
  vec4 tc = texture(Tex, uv);
  */
  vec4 tc = texture(SkyBoxTexture, D);
  OutColor = vec4(tc.rgb, 1);
  //OutColor = vec4(D.rgb, 1);
  /*
  OutPosId = vec4(0, 0, 0, 0);
  OutNormalIsShade = vec4(0, 0, 1, 0);
  OutKa = vec4(0, 0, 0, 0);
  OutKd = vec4(0, 0, 0, 0);
  OutKsPh = vec4(0, 0, 0, 0);

  OutColor = vec4(BufCamLoc.x, FramePos.x, FramePos.y, 1.0);
  */
}
