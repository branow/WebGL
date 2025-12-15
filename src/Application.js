/**
 * Application - Main application controller
 */
class Application {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        this.gl = this.initializeWebGL();
        this.renderer = new Renderer(this.gl, this.canvas);
        this.trackball = null;
        this.config = SurfaceConfig;
    }

    /**
     * Initialize WebGL context
     */
    initializeWebGL() {
        const gl = this.canvas.getContext("webgl");
        if (!gl) {
            throw new Error("Browser does not support WebGL");
        }
        return gl;
    }

    /**
     * Load shaders from separate files
     */
    async loadShaders() {
        const program = await ShaderLoader.loadProgram(
            this.gl,
            'src/shaders/vertexShader.glsl',
            'src/shaders/fragmentShader.glsl'
        );
        this.renderer.setShaderProgram(program);
    }

    /**
     * Create and initialize models
     */
    createModels() {
        // Create parametric surface
        const surface = new ParametricSurface(this.gl, 'surface', this.config);
        surface.generateSurface();
        this.renderer.addModel('surface', surface);

        // Create light sphere (optional, currently not drawn)
        const lightSphere = new SphereModel(this.gl, 'lightSphere');
        lightSphere.generate(0.1, 16, 16);
        this.renderer.addModel('lightSphere', lightSphere);
    }

    /**
     * Load all textures
     */
    loadTextures() {
        const { textureManager } = this.renderer;
        const draw = () => this.draw();

        // Load surface textures
        textureManager.loadTexture('diffuse', 'textures/diffuse.jpg', draw);
        textureManager.loadTexture('specular', 'textures/specular.jpg', draw);
        textureManager.loadTexture('normal', 'textures/normal.jpg', draw);

        // Create solid textures for potential future use
        textureManager.createSolidTexture('white', 255, 255, 255, 255);
        textureManager.createSolidTexture('flatNormal', 128, 128, 255, 255);
    }

    /**
     * Set up trackball rotation controller
     */
    setupTrackball() {
        this.trackball = new TrackballRotator(
            this.canvas,
            () => this.draw(),
            0
        );
    }

    /**
     * Set up keyboard controls for moving rotation center
     */
    setupKeyboardControls() {
        const moveStep = 0.01;

        document.addEventListener('keydown', (event) => {
            let moved = false;
            const currentR = this.renderer.rotationCenter[0];
            const currentV = this.renderer.rotationCenter[1];
            let newR = currentR;
            let newV = currentV;

            switch(event.key.toLowerCase()) {
                case 'a':
                    newV = Math.max(0, currentV - moveStep);
                    moved = true;
                    break;
                case 'd':
                    newV = Math.min(1, currentV + moveStep);
                    moved = true;
                    break;
                case 'w':
                    newR = Math.min(1, currentR + moveStep);
                    moved = true;
                    break;
                case 's':
                    newR = Math.max(0, currentR - moveStep);
                    moved = true;
                    break;
            }

            if (moved) {
                event.preventDefault();
                this.renderer.setRotationCenter(newR, newV);

                const rotationCenterRSlider = document.getElementById("rotationCenterRSlider");
                const rotationCenterVSlider = document.getElementById("rotationCenterVSlider");
                const rotationCenterRValue = document.getElementById("rotationCenterRValue");
                const rotationCenterVValue = document.getElementById("rotationCenterVValue");

                if (rotationCenterRSlider && rotationCenterRValue) {
                    rotationCenterRSlider.value = newR * 100;
                    rotationCenterRValue.textContent = newR.toFixed(2);
                }

                if (rotationCenterVSlider && rotationCenterVValue) {
                    rotationCenterVSlider.value = newV * 100;
                    rotationCenterVValue.textContent = newV.toFixed(2);
                }

                this.draw();
            }
        });
    }

    /**
     * Set up UI controls
     */
    setupUIControls() {
        // Mesh density controls
        const rStepsSlider = document.getElementById("rStepsSlider");
        const vStepsSlider = document.getElementById("vStepsSlider");
        const rStepsValue = document.getElementById("rStepsValue");
        const vStepsValue = document.getElementById("vStepsValue");

        if (rStepsSlider && rStepsValue) {
            rStepsSlider.addEventListener("input", () => {
                rStepsValue.textContent = rStepsSlider.value;
                const surface = this.renderer.getModel('surface');
                if (surface) {
                    surface.updateMeshDensity(parseInt(rStepsSlider.value), undefined);
                    this.draw();
                }
            });
        }

        if (vStepsSlider && vStepsValue) {
            vStepsSlider.addEventListener("input", () => {
                vStepsValue.textContent = vStepsSlider.value;
                const surface = this.renderer.getModel('surface');
                if (surface) {
                    surface.updateMeshDensity(undefined, parseInt(vStepsSlider.value));
                    this.draw();
                }
            });
        }

        const textureRotationSlider = document.getElementById("textureRotationSlider");
        const textureRotationValue = document.getElementById("textureRotationValue");
        const rotationCenterRSlider = document.getElementById("rotationCenterRSlider");
        const rotationCenterRValue = document.getElementById("rotationCenterRValue");
        const rotationCenterVSlider = document.getElementById("rotationCenterVSlider");
        const rotationCenterVValue = document.getElementById("rotationCenterVValue");

        if (textureRotationSlider && textureRotationValue) {
            textureRotationSlider.addEventListener("input", () => {
                textureRotationValue.textContent = textureRotationSlider.value;
                this.renderer.setTextureRotationAngle(parseFloat(textureRotationSlider.value));
                this.draw();
            });
        }

        if (rotationCenterRSlider && rotationCenterRValue) {
            rotationCenterRSlider.addEventListener("input", () => {
                const r = parseFloat(rotationCenterRSlider.value) / 100;
                rotationCenterRValue.textContent = r.toFixed(2);
                const currentV = this.renderer.rotationCenter[1];
                this.renderer.setRotationCenter(r, currentV);
                this.draw();
            });
        }

        if (rotationCenterVSlider && rotationCenterVValue) {
            rotationCenterVSlider.addEventListener("input", () => {
                const v = parseFloat(rotationCenterVSlider.value) / 100;
                rotationCenterVValue.textContent = v.toFixed(2);
                const currentR = this.renderer.rotationCenter[0];
                this.renderer.setRotationCenter(currentR, v);
                this.draw();
            });
        }

        const showRotationCenterCheckbox = document.getElementById("showRotationCenterCheckbox");
        if (showRotationCenterCheckbox) {
            showRotationCenterCheckbox.addEventListener("change", () => {
                this.renderer.setShowRotationCenter(showRotationCenterCheckbox.checked);
                this.draw();
            });
        }
    }

    /**
     * Draw the scene
     */
    draw() {
        if (!this.trackball) return;
        const viewMatrix = this.trackball.getViewMatrix();
        this.renderer.render(viewMatrix);
    }

    /**
     * Start the animation loop
     */
    startAnimation() {
        this.renderer.startAnimation(() => this.draw());
    }

    /**
     * Initialize and start the application
     */
    async initialize() {
        try {
            // Load shaders
            await this.loadShaders();

            // Initialize renderer state
            this.renderer.initializeState();

            // Create models
            this.createModels();

            // Load textures
            this.loadTextures();

            // Set up interaction
            this.setupTrackball();
            this.setupUIControls();
            this.setupKeyboardControls();

            // Start rendering
            this.startAnimation();

            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.displayError(error.message);
        }
    }

    /**
     * Display error message to user
     */
    displayError(message) {
        const holder = document.getElementById("canvas-holder");
        if (holder) {
            holder.innerHTML = `<p>Sorry, could not initialize the WebGL application: ${message}</p>`;
        }
    }

    /**
     * Cleanup and shutdown
     */
    shutdown() {
        this.renderer.cleanup();
    }
}

/**
 * Global initialization function
 */
async function init() {
    const app = new Application('webglcanvas');
    await app.initialize();

    // Store globally for potential debugging
    window.app = app;
}
