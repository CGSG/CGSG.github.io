import * as vigl from './timer.js';

// Global context data
let canvas,
  gl,
  time_loc = -2,
  shaderProgram,
  frameBuffer,
  posBuffer,
  frameVertexArray,
  frameScale = 1,
  myTimer;

let SetColor = [1, 0, 0];

const frameUniformBufferIndex = 5;

let frameData = [-2, 4, -2, 4, 0, 0, 0, 0, 0.35, 0.03, 0.35, 0.03, 0, 1, 0, 0];

// Load shader source function
function loadShader(type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let Buf = gl.getShaderInfoLog(shader);
    console.log("Shader fail:" + Buf);
  }
  return shader;
}

export function initGL() {
  canvas = document.getElementById("myCan");
  gl = canvas.getContext("webgl2");
  gl.clearColor(0.3, 0.47, 0.8, 1);

  // Shader initialization
  let vs, fs;
  const ft1 = fetch("/vert.glsl")
    .then((res) => res.text())
    .then((data) => {
      vs = data;
    });
  const ft2 = fetch("/frag.glsl")
    .then((res) => res.text())
    .then((data) => {
      fs = data;
    });
  const allData = Promise.all([ft1, ft2]);
  allData.then((res) => {
    // Shaders
    const vertexShader = loadShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fs);
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      const Buf = gl.getProgramInfoLog(shaderProgram);
      console.log(Buf);
    }

    // Vertex array/buffer
    const posLoc = gl.getAttribLocation(shaderProgram, "in_pos");

    frameVertexArray = gl.createVertexArray();
    gl.bindVertexArray(frameVertexArray);

    posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    const x = 1;
    const pos = [-x, x, 0, -x, -x, 0, x, x, 0, x, -x, 0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.useProgram(shaderProgram);
    time_loc = gl.getUniformLocation(shaderProgram, "Time");

    frameBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, frameBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, 12 * 4, gl.STATIC_DRAW);

    gl.uniformBlockBinding(
      shaderProgram,
      gl.getUniformBlockIndex(shaderProgram, "frameBuffer"),
      frameUniformBufferIndex
    );

    myTimer = new vigl.Timer();
  });
}

var indices = new Uint16Array([0, 1, 3, 2]);

export function Render() {
  if (time_loc == -2) return;

  if (myTimer != undefined)
    myTimer.response('fps');
  let color_loc = gl.getUniformLocation(shaderProgram, "SetColor");
  if (color_loc != -1) gl.uniform3fv(color_loc, new Float32Array(SetColor));

  if (time_loc != -1 && myTimer != undefined) {
    gl.uniform1f(time_loc, myTimer.localTime);
  }
  gl.bindBuffer(gl.UNIFORM_BUFFER, frameBuffer);
  //const data = new Float32Array([1, 2, 3, 4]);
  if (myTimer != undefined) {
    frameData[4] = myTimer.localTime;
    frameData[5] = myTimer.localDeltaTime;
    frameData[6] = myTimer.globalTime;
    frameData[7] = myTimer.globalDeltaTime;
  }
  gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(frameData), gl.STATIC_DRAW);
  //gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array([1, 2, 3, 4, t]));
  gl.bindBufferBase(gl.UNIFORM_BUFFER, frameUniformBufferIndex, frameBuffer);

  //gl.bufferData(gl.SHADER_STORAGE_BUFFER, new Float32Array([t, t, t, t]), gl.DYNAMIC_COPY);
  //gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array([t]));
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export function myDragHandle(e) {
  e.preventDefault();
  if (e.buttons & 1) {
    frameData[0] -= (frameData[1] * e.movementX) / gl.canvas.width;
    frameData[2] -= (frameData[3] * -e.movementY) / gl.canvas.height;
  }
}
export function myWheelHandle(e) {
  e.preventDefault();
  let x = (e.x - gl.canvas.offsetLeft) / gl.canvas.width,
    y = (gl.canvas.height - 1 - (e.y - gl.canvas.offsetTop)) / gl.canvas.height,
    oldx = x * frameData[1],
    oldy = y * frameData[3];
  let z = e.wheelDelta;
  if (z < 0) frameScale *= (1.125 * -z) / 120.0;
  else if (z > 0) frameScale /= (1.125 * z) / 120.0;
  frameData[1] = 4 * frameScale;
  frameData[3] = 4 * frameScale;
  frameData[0] -= x * frameData[1] - oldx;
  frameData[2] -= y * frameData[3] - oldy;
}
let assoc = {
  sl_CxB: ["CxB", 8],
  sl_CxS: ["CxS", 9],
  sl_CyB: ["CyB", 10],
  sl_CyS: ["CyS", 11],
  sl_Sh: ["Sh", 12],
  sl_Scl: ["Scl", 13],
  sl_Rot: ["Rot", 14],
};

export function myReset() {
  frameData = [-2, 4, -2, 4, 0, 0, 0, 0, 0.35, 0.03, 0.35, 0.03, 0, 1, 0, 0];
  frameScale = 1;
  SetColor = [1, 0, 0];
  for (var key in assoc) {
    document.getElementById(key).value = frameData[assoc[key][1]] * 100;
    document.getElementById(assoc[key][0]).innerHTML = frameData[assoc[key][1]];
  }
  let t = document.getElementById("sl_Col");
  if (t != null)
    t.value = "#FF0000";
}
export function myPause(e) {
  myTimer.isPause = e.target.checked ? true : false;
}
export function mySlider(e) {
  let nam = document.getElementById(assoc[e.target.id][0]);
  if (nam != null) {
    nam.innerHTML = (e.target.value / 100.0).toFixed(2);
    frameData[assoc[e.target.id][1]] = e.target.value / 100.0;
  }
}
export function myColor(e) {
  let
    h = e.target.value,
    r = eval("0x" + h[1] + h[2]),
    g = eval("0x" + h[3] + h[4]),
    b = eval("0x" + h[5] + h[6]);
  SetColor = [r / 255.0, g / 255.0, b / 255.0];
}
