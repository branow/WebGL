const m = 0.5;
const b = 3 * m;
const a = 2 * m;
const n = 0.5;
const w = 10;
const f = 0;

class Lab1Model{
  constructor(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;
  }

  BufferData() {
    const { vertices, edges } = Lab1CreateSurfaceData();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(edges), gl.STATIC_DRAW);
    this.count = edges.length;
  }

  Draw() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribVertex);
    gl.drawElements(gl.LINES, this.count, gl.UNSIGNED_SHORT, 0);
  }
}

function Lab1CreateSurfaceData() {
  const rSteps = 10;
  const uSteps = 40;
  const rRange = { min: 0, max: b }
  const uRange = { min: 0, max: Math.PI * 2 }

  return {
    vertices: GenerateSurfaceVertices(rSteps, uSteps, rRange, uRange),
    edges: GenerateSurfaceEdges(rSteps, uSteps)
  }
}

function GenerateSurfaceVertices(rSteps, uSteps, rRange, uRange) {
  const vertices = [];

  for (let i = 0; i <= rSteps; ++i) {
    const r = rRange.min + (rRange.max - rRange.min) * (i / rSteps);
    for (let j = 0; j <= uSteps; ++j) {
      const u = uRange.min + (uRange.max - uRange.min) * (j / uSteps);
      const { x, y, z } = SurfacePoint(r, u);
      vertices.push(x, y, z);
    }
  }

  return new Float32Array(vertices);
}

function GenerateSurfaceEdges(rSteps, uSteps) {
  const indices = [];
  const cols = uSteps + 1;

  // connect along u direction
  for (let i = 0; i <= rSteps; ++i) {
    for (let j = 0; j < uSteps; ++j) {
      const p1 = i * cols + j;
      const p2 = i * cols + (j + 1);
      indices.push(p1, p2);
    }
  }

  // connect along r direction
  for (let j = 0; j <= uSteps; ++j) {
    for (let i = 0; i < rSteps; ++i) {
      const p1 = i * cols + j;
      const p2 = (i + 1) * cols + j;
      indices.push(p1, p2);
    }
  }

  return new Uint16Array(indices);
}

function SurfacePoint(r, u) {
  const x = r * Math.cos(u);
  const y = r * Math.sin(u);
  const z = a * Math.exp(-n * r) * Math.sin(w * r + f);
  return { x, y, z };
}
