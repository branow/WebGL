/**
 * Renderer - Handles WebGL rendering operations
 */
class Renderer {
    constructor(gl, canvas) {
        this.gl = gl;
        this.canvas = canvas;
        this.shaderProgram = null;
        this.textureManager = new TextureManager(gl);
        this.models = new Map();
        this.animationId = null;
        this.lightAngle = 0;
    }

    /**
     * Set the shader program
     */
    setShaderProgram(program) {
        this.shaderProgram = this.createShaderProgramWrapper(program);
        this.gl.useProgram(program);
    }

    /**
     * Create a wrapper object for shader program with uniform/attribute locations
     */
    createShaderProgramWrapper(program) {
        return {
            prog: program,
            // Attributes
            iAttribVertex: this.gl.getAttribLocation(program, "vertex"),
            iAttribNormal: this.gl.getAttribLocation(program, "normal"),
            iAttribTexCoord: this.gl.getAttribLocation(program, "texCoord"),
            iAttribTangent: this.gl.getAttribLocation(program, "tangent"),
            iAttribBitangent: this.gl.getAttribLocation(program, "bitangent"),
            // Uniforms - Matrices
            iModelViewProjectionMatrix: this.gl.getUniformLocation(program, "ModelViewProjectionMatrix"),
            iModelViewMatrix: this.gl.getUniformLocation(program, "ModelViewMatrix"),
            iNormalMatrix: this.gl.getUniformLocation(program, "NormalMatrix"),
            // Uniforms - Lighting
            iLightPosition: this.gl.getUniformLocation(program, "lightPosition"),
            iAmbientColor: this.gl.getUniformLocation(program, "ambientColor"),
            iDiffuseColor: this.gl.getUniformLocation(program, "diffuseColor"),
            iSpecularColor: this.gl.getUniformLocation(program, "specularColor"),
            iShininess: this.gl.getUniformLocation(program, "shininess"),
            // Uniforms - Textures
            iDiffuseMap: this.gl.getUniformLocation(program, "diffuseMap"),
            iSpecularMap: this.gl.getUniformLocation(program, "specularMap"),
            iNormalMap: this.gl.getUniformLocation(program, "normalMap")
        };
    }

    /**
     * Add a model to the renderer
     */
    addModel(name, model) {
        this.models.set(name, model);
    }

    /**
     * Get a model by name
     */
    getModel(name) {
        return this.models.get(name);
    }

    /**
     * Clear the screen
     */
    clear() {
        this.gl.clearColor(0.5, 0.5, 0.5, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Set up view and projection matrices
     */
    setupMatrices(viewMatrix) {
        const projection = m4.perspective(Math.PI / 8, 1, 8, 12);

        const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
        const scaleMatrix = m4.scaling(0.7, 0.7, 0.7);
        const translateToPointZero = m4.translation(0, 0, -10);

        const matAccum0 = m4.multiply(rotateToPointZero, viewMatrix);
        const matAccum0_5 = m4.multiply(scaleMatrix, matAccum0);
        const matAccum1 = m4.multiply(translateToPointZero, matAccum0_5);
        const matAccum1_noScale = m4.multiply(translateToPointZero, matAccum0);

        const modelViewProjection = m4.multiply(projection, matAccum1);
        const normalMatrix = m4.transpose(m4.inverse(matAccum1));

        return {
            modelViewProjection,
            modelView: matAccum1,
            normalMatrix,
            matAccum1_noScale
        };
    }

    /**
     * Calculate light position
     */
    calculateLightPosition(matrices) {
        const lightRadius = 1.5;
        const lightWorldX = lightRadius * Math.cos(this.lightAngle);
        const lightWorldY = lightRadius * Math.sin(this.lightAngle);
        const lightWorldZ = 3;

        const lightWorldPos = [lightWorldX, lightWorldY, lightWorldZ, 1.0];
        const lightViewPos = m4.transformVector(matrices.matAccum1_noScale, lightWorldPos);

        return [lightViewPos[0], lightViewPos[1], lightViewPos[2]];
    }

    /**
     * Set shader uniforms
     */
    setUniforms(matrices, lightPosition) {
        const { shaderProgram: sp } = this;

        // Matrices
        this.gl.uniformMatrix4fv(sp.iModelViewProjectionMatrix, false, matrices.modelViewProjection);
        this.gl.uniformMatrix4fv(sp.iModelViewMatrix, false, matrices.modelView);
        this.gl.uniformMatrix4fv(sp.iNormalMatrix, false, matrices.normalMatrix);

        // Light
        this.gl.uniform3fv(sp.iLightPosition, lightPosition);

        // Material properties
        this.gl.uniform3fv(sp.iAmbientColor, [0.6, 0.6, 0.6]);
        this.gl.uniform3fv(sp.iDiffuseColor, [1.5, 1.5, 1.5]);
        this.gl.uniform3fv(sp.iSpecularColor, [1.0, 1.0, 1.0]);
        this.gl.uniform1f(sp.iShininess, 16.0);
    }

    /**
     * Bind textures for rendering
     */
    bindTextures() {
        this.textureManager.bindTexture('diffuse', 0);
        this.gl.uniform1i(this.shaderProgram.iDiffuseMap, 0);

        this.textureManager.bindTexture('specular', 1);
        this.gl.uniform1i(this.shaderProgram.iSpecularMap, 1);

        this.textureManager.bindTexture('normal', 2);
        this.gl.uniform1i(this.shaderProgram.iNormalMap, 2);
    }

    /**
     * Render a single frame
     */
    render(viewMatrix) {
        this.clear();

        const matrices = this.setupMatrices(viewMatrix);
        const lightPosition = this.calculateLightPosition(matrices);

        this.setUniforms(matrices, lightPosition);
        this.bindTextures();

        // Draw the surface
        const surface = this.models.get('surface');
        if (surface) {
            surface.draw(this.shaderProgram);
        }
    }

    /**
     * Update light angle for animation
     */
    updateLightAngle() {
        this.lightAngle += 0.02;
        if (this.lightAngle > Math.PI * 2) {
            this.lightAngle -= Math.PI * 2;
        }
    }

    /**
     * Start animation loop
     */
    startAnimation(drawCallback) {
        const animate = () => {
            this.updateLightAngle();
            drawCallback();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stop animation
     */
    stopAnimation() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Initialize WebGL state
     */
    initializeState() {
        this.gl.enable(this.gl.DEPTH_TEST);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopAnimation();
        this.textureManager.cleanup();
        this.models.clear();
    }
}
