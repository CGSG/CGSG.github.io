import {Timer} from "./timer.js";

class Render {
  frameData = [0, 0, 0, 0];  
  frameUniformBufferIndex = 5;  
  timer = new Timer();
  
  constructor(canvasId) {
    // Init OpenGL
    this.canvas = document.getElementById(canvasId);
    let gl = this.canvas.getContext("webgl2");
    this.gl = gl;

    // Shader creation
    // Load and compile shader function
    const loadShader = (shaderType, shaderSource) => {
      const shader = gl.createShader(shaderType);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let buf = gl.getShaderInfoLog(shader);
        console.log('Shader compile fail: ' + buf);
      }                                            
      return shader;
    } // End of 'loadShader' function

    let vs_txt =
    `#version 300 es
    precision highp float;
    in vec3 InPosition;
      
    out vec2 DrawPos;
    uniform float Time;

    uniform FrameBuffer
    {  
      vec4 Data;
    };

    void main( void )
    {
      gl_Position = vec4(InPosition, 1);
      gl_Position.x += 0.1 * sin(Time);
      DrawPos = InPosition.xy;
    }
    `;
    let fs_txt =
    `#version 300 es
    precision highp float;
    out vec4 OutColor;
    
    uniform FrameBuffer
    {  
      vec4 Data;
    };

    in vec2 DrawPos;
    uniform float Time;

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
      float c = Jul(DrawPos * 2.0, vec2(0.38 + 0.30 * sin(Data[0] * 2.0 + Time), 0.47 + 0.30 * sin(Data[0] * 2.0 + 1.1 * Time))) / 256.0;
      if (c < 0.01)
        discard;
      vec4 color = vec4(1, 0, 0, 1);
      OutColor = mod(color * c, vec4(1, 1, 1, 1));
      // OutColor = vec4(vec3(c * 4.7), mix(1.0, 0.0, c)); // vec4(1.0 * sin(DrawPos.x * 8.0 + Time * 5.0) * sin(DrawPos.y * 8.0 + Time * 2.0), abs(sin(Time)), Data.x, 1.0);
    }
    `;
    let
      vs = loadShader(gl.VERTEX_SHADER, vs_txt),
      fs = loadShader(gl.FRAGMENT_SHADER, fs_txt),
      prg = gl.createProgram();
    gl.attachShader(prg, vs);
    gl.attachShader(prg, fs);
    gl.linkProgram(prg);
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
      let buf = gl.getProgramInfoLog(prg);
      console.log('Shader program link fail: ' + buf);
    }                                            

    // Vertex buffer creation
    const size = 0.8;
    const vertexes = [-size, size, 0, -size, -size, 0, size, size, 0, size, -size, 0];
    const posLoc = gl.getAttribLocation(prg, "InPosition");
    let vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexes), gl.STATIC_DRAW);
    if (posLoc != -1) {
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posLoc);
    }

    // Uniform data
    this.timeLoc = gl.getUniformLocation(prg, "Time");
    
    // Uniform buffer
    this.frameBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.frameBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, 4 * 4, gl.STATIC_DRAW);

    gl.useProgram(prg);
    gl.uniformBlockBinding(prg,
      gl.getUniformBlockIndex(prg, "FrameBuffer"),
      this.frameUniformBufferIndex);
  }
  // Main render frame function
  render() {
    this.timer.response("fps" + this.canvas.id.slice(5));

    const gl = this.gl;
    // console.log(`Frame ${x++}`);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Setup frame buffer data
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.frameBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(this.frameData), gl.STATIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, this.frameUniformBufferIndex, this.frameBuffer);
                                                
    if (this.timeLoc != -1) {
      const date = new Date();
      let t = date.getMinutes() * 60 +
              date.getSeconds() +
              date.getMilliseconds() / 1000;

      gl.uniform1f(this.timeLoc, t);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  } // End of 'render' function
  mainLoop() {
    const draw = () => {
      // drawing
      this.render();
      // animation register
      window.requestAnimationFrame(draw);
    };
    draw(); 
  }
}


/// // OpenGL initialization function  
/// export function initGL() {
///   /// window.vigl.setBackColor = setBackColor;
/// }  // End of 'initGL' function               
/// 
/// // Set background color function
/// export function setBackColor(color) {
///   gl.clearColor(color.r, color.g, color.b, 1);
/// }
/// 
/// let x = 1;                    

                                               

/// export function colorHandle() {
///   let tag = document.getElementById('backColor');
///   let
///     x = tag.value, // #RRGGBB
///     r = eval("0x" + x[1] + x[2]),
///     g = eval("0x" + x[3] + x[4]),
///     b = eval("0x" + x[5] + x[6]);
///   setBackColor({"r": r / 255, "g": g / 255, "b": b / 255,});
/// } 

window.addEventListener("load", () => {
  const r1 = new Render("myCan1");
  const r2 = new Render("myCan2");
  r1.mainLoop();
  r2.mainLoop();
  document.getElementById('rate1').render = r1;
  document.getElementById('rate2').render = r2;
  
  document.querySelectorAll('input[type="range"]').forEach((slider) => slider.oninput = (e) => {
    e.target.render.frameData[0] = e.target.value;
  });

  document.getElementById('backColor').oninput = (e) => {
    let tag = e.target;
    let
      x = tag.value, // #RRGGBB
      r = eval("0x" + x[1] + x[2]),
      g = eval("0x" + x[3] + x[4]),
      b = eval("0x" + x[5] + x[6]);
    document.querySelectorAll('input[type="range"]').forEach((slider) => {
      slider.render.gl.clearColor(r / 255, g / 255, b / 255, 1);
    });
  };
}); 

console.log("CGSG forever!!! mylib.js imported");