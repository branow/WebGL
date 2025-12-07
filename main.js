'use strict';

let gl;
let surface;
let lightSphere;
let shProgram;
let spaceball;
let lightAngle = 0;
let animationId = null;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function() {
        const vertices = CreateSurfaceData();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length/3;
    }

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}

function SphereModel(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(radius, latitudeBands, longitudeBands) {
        const { vertices, normals, indices } = CreateSphereData(radius, latitudeBands, longitudeBands);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.count = indices.length;
    }

    this.Draw = function() {
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


function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iModelViewMatrix = -1;
    this.iNormalMatrix = -1;
    this.iLightPosition = -1;
    this.iAmbientColor = -1;
    this.iDiffuseColor = -1;
    this.iSpecularColor = -1;
    this.iShininess = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = m4.perspective(Math.PI/8, 1, 8, 12);
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let scaleMatrix = m4.scaling(0.7, 0.7, 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum0_5 = m4.multiply(scaleMatrix, matAccum0);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0_5);
    let matAccum1_noScale = m4.multiply(translateToPointZero, matAccum0);

    let modelViewProjection = m4.multiply(projection, matAccum1);
    let normalMatrix = m4.transpose(m4.inverse(matAccum1));

    const lightRadius = 1.5;
    const lightWorldX = lightRadius * Math.cos(lightAngle);
    const lightWorldY = lightRadius * Math.sin(lightAngle);
    const lightWorldZ = 1.2;

    let lightWorldPos = [lightWorldX, lightWorldY, lightWorldZ, 1.0];
    let lightViewPos = m4.transformVector(matAccum1_noScale, lightWorldPos);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

    gl.uniform3fv(shProgram.iLightPosition, [lightViewPos[0], lightViewPos[1], lightViewPos[2]]);
    gl.uniform3fv(shProgram.iAmbientColor, [0.3, 0.3, 0.0]);
    gl.uniform3fv(shProgram.iDiffuseColor, [0.2, 0.2, 0.0]);
    gl.uniform3fv(shProgram.iSpecularColor, [0.8, 0.8, 0.2]);
    gl.uniform1f(shProgram.iShininess, 3.0);

    surface.Draw();

    gl.disable(gl.DEPTH_TEST);

    let lightTranslation = m4.translation(lightWorldX, lightWorldY, lightWorldZ);
    let lightModelView = m4.multiply(matAccum1_noScale, lightTranslation);
    let lightMVP = m4.multiply(projection, lightModelView);
    let lightNormalMatrix = m4.transpose(m4.inverse(lightModelView));

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, lightMVP);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, lightModelView);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, lightNormalMatrix);

    gl.uniform3fv(shProgram.iAmbientColor, [1.0, 1.0, 1.0]);
    gl.uniform3fv(shProgram.iDiffuseColor, [1.0, 1.0, 1.0]);
    gl.uniform3fv(shProgram.iSpecularColor, [1.0, 1.0, 1.0]);
    gl.uniform1f(shProgram.iShininess, 10.0);

    lightSphere.Draw();
    gl.enable(gl.DEPTH_TEST);
}

function animate() {
    lightAngle += 0.02;
    if (lightAngle > Math.PI * 2) {
        lightAngle -= Math.PI * 2;
    }
    draw();
    animationId = requestAnimationFrame(animate);
}

function CreateSurfaceData()
{
    let vertexList = [];

    for (let i=0; i<360; i+=5) {
        vertexList.push( Math.sin(deg2rad(i)), 1, Math.cos(deg2rad(i)) );
        vertexList.push( Math.sin(deg2rad(i)), 0, Math.cos(deg2rad(i)) );
    }

    return vertexList;
}

function CreateSphereData(radius, latitudeBands, longitudeBands) {
    const vertices = [];
    const normals = [];
    const indices = [];

    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = lat * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longitudeBands; lon++) {
            const phi = lon * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            vertices.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
        }
    }

    for (let lat = 0; lat < latitudeBands; lat++) {
        for (let lon = 0; lon < longitudeBands; lon++) {
            const first = lat * (longitudeBands + 1) + lon;
            const second = first + longitudeBands + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return { vertices, normals, indices };
}


function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iLightPosition = gl.getUniformLocation(prog, "lightPosition");
    shProgram.iAmbientColor = gl.getUniformLocation(prog, "ambientColor");
    shProgram.iDiffuseColor = gl.getUniformLocation(prog, "diffuseColor");
    shProgram.iSpecularColor = gl.getUniformLocation(prog, "specularColor");
    shProgram.iShininess = gl.getUniformLocation(prog, "shininess");

    surface = new Lab1Model('Surface');
    surface.BufferData();

    lightSphere = new SphereModel('LightSphere');
    lightSphere.BufferData(0.1, 16, 16);

    gl.enable(gl.DEPTH_TEST);
}


function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    const rStepsSlider = document.getElementById("rStepsSlider");
    const uStepsSlider = document.getElementById("uStepsSlider");
    const rStepsValue = document.getElementById("rStepsValue");
    const uStepsValue = document.getElementById("uStepsValue");

    rStepsSlider.addEventListener("input", function() {
        rStepsValue.textContent = this.value;
        surface.BufferData(parseInt(this.value), undefined);
    });

    uStepsSlider.addEventListener("input", function() {
        uStepsValue.textContent = this.value;
        surface.BufferData(undefined, parseInt(this.value));
    });

    animate();
}
