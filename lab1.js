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
    this.iNormalBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;
    this.rSteps = 10;
    this.uSteps = 40;
  }

  BufferData(rSteps, uSteps) {
    if (rSteps !== undefined) this.rSteps = rSteps;
    if (uSteps !== undefined) this.uSteps = uSteps;

    const { vertices, normals, edges } = Lab1CreateSurfaceData(this.rSteps, this.uSteps);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(edges), gl.STATIC_DRAW);
    this.count = edges.length;
  }

  Draw() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribVertex);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
    gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }
}

function Lab1CreateSurfaceData(rSteps, uSteps) {
  const rRange = { min: 0, max: b }
  const uRange = { min: 0, max: Math.PI * 2 }

  return {
    vertices: GenerateSurfaceVertices(rSteps, uSteps, rRange, uRange),
    normals: GenerateSurfaceNormals(rSteps, uSteps, rRange, uRange),
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

  // Generate triangles for each quad in the grid
  for (let i = 0; i < rSteps; ++i) {
    for (let j = 0; j < uSteps; ++j) {
      const p0 = i * cols + j;
      const p1 = i * cols + (j + 1);
      const p2 = (i + 1) * cols + (j + 1);
      const p3 = (i + 1) * cols + j;

      // First triangle (p0, p1, p2)
      indices.push(p0, p1, p2);

      // Second triangle (p0, p2, p3)
      indices.push(p0, p2, p3);
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

function CrossProduct(v1, v2) {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
}

function Subtract(v1, v2) {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
    z: v1.z - v2.z
  };
}

function Dot(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function Length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function Normalize(v) {
  const length = Length(v);
  if (length > 0.00001) {
    return { x: v.x / length, y: v.y / length, z: v.z / length };
  }
  return { x: 0, y: 0, z: 1 };
}

function GenerateSurfaceNormals(rSteps, uSteps, rRange, uRange) {
  // Get all vertices
  const vertices = [];
  for (let i = 0; i <= rSteps; ++i) {
    const r = rRange.min + (rRange.max - rRange.min) * (i / rSteps);
    for (let j = 0; j <= uSteps; ++j) {
      const u = uRange.min + (uRange.max - uRange.min) * (j / uSteps);
      const point = SurfacePoint(r, u);
      vertices.push(point);
    }
  }

  const cols = uSteps + 1;

  // Initialize normals array with zeros
  const normals = new Array((rSteps + 1) * (uSteps + 1));
  for (let i = 0; i < normals.length; i++) {
    normals[i] = { x: 0, y: 0, z: 0 };
  }

  // For each quad, process both triangles
  for (let i = 0; i < rSteps; ++i) {
    for (let j = 0; j < uSteps; ++j) {
      const idx0 = i * cols + j;
      const idx1 = i * cols + (j + 1);
      const idx2 = (i + 1) * cols + (j + 1);
      const idx3 = (i + 1) * cols + j;

      const v0 = vertices[idx0];
      const v1 = vertices[idx1];
      const v2 = vertices[idx2];
      const v3 = vertices[idx3];

      // First triangle (v0, v1, v2)
      const edge1_1 = Subtract(v1, v0);
      const edge2_1 = Subtract(v2, v0);
      const faceNormal1 = Normalize(CrossProduct(edge1_1, edge2_1));

      // Calculate angles at each vertex of the triangle
      const angle0_1 = CalculateAngle(v1, v0, v2);
      const angle1_1 = CalculateAngle(v0, v1, v2);
      const angle2_1 = CalculateAngle(v0, v2, v1);

      // Add weighted normal to each vertex
      normals[idx0].x += faceNormal1.x * angle0_1;
      normals[idx0].y += faceNormal1.y * angle0_1;
      normals[idx0].z += faceNormal1.z * angle0_1;

      normals[idx1].x += faceNormal1.x * angle1_1;
      normals[idx1].y += faceNormal1.y * angle1_1;
      normals[idx1].z += faceNormal1.z * angle1_1;

      normals[idx2].x += faceNormal1.x * angle2_1;
      normals[idx2].y += faceNormal1.y * angle2_1;
      normals[idx2].z += faceNormal1.z * angle2_1;

      // Second triangle (v0, v2, v3)
      const edge1_2 = Subtract(v2, v0);
      const edge2_2 = Subtract(v3, v0);
      const faceNormal2 = Normalize(CrossProduct(edge1_2, edge2_2));

      const angle0_2 = CalculateAngle(v2, v0, v3);
      const angle2_2 = CalculateAngle(v0, v2, v3);
      const angle3_2 = CalculateAngle(v0, v3, v2);

      normals[idx0].x += faceNormal2.x * angle0_2;
      normals[idx0].y += faceNormal2.y * angle0_2;
      normals[idx0].z += faceNormal2.z * angle0_2;

      normals[idx2].x += faceNormal2.x * angle2_2;
      normals[idx2].y += faceNormal2.y * angle2_2;
      normals[idx2].z += faceNormal2.z * angle2_2;

      normals[idx3].x += faceNormal2.x * angle3_2;
      normals[idx3].y += faceNormal2.y * angle3_2;
      normals[idx3].z += faceNormal2.z * angle3_2;
    }
  }

  // Normalize all vertex normals
  const normalArray = [];
  for (let i = 0; i < normals.length; i++) {
    const normalized = Normalize(normals[i]);
    normalArray.push(normalized.x, normalized.y, normalized.z);
  }

  return new Float32Array(normalArray);
}

function CalculateAngle(v1, vCenter, v2) {
  // Calculate angle at vCenter between edges to v1 and v2
  const edge1 = Subtract(v1, vCenter);
  const edge2 = Subtract(v2, vCenter);

  const len1 = Length(edge1);
  const len2 = Length(edge2);

  if (len1 < 0.00001 || len2 < 0.00001) {
    return 0;
  }

  const cosAngle = Dot(edge1, edge2) / (len1 * len2);
  // Clamp to [-1, 1] to avoid numerical errors
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  return Math.acos(clampedCos);
}
