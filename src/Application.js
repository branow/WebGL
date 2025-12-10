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
     * Set up UI controls
     */
    setupUIControls() {
        const rStepsSlider = document.getElementById("rStepsSlider");
        const uStepsSlider = document.getElementById("uStepsSlider");
        const rStepsValue = document.getElementById("rStepsValue");
        const uStepsValue = document.getElementById("uStepsValue");

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

        if (uStepsSlider && uStepsValue) {
            uStepsSlider.addEventListener("input", () => {
                uStepsValue.textContent = uStepsSlider.value;
                const surface = this.renderer.getModel('surface');
                if (surface) {
                    surface.updateMeshDensity(undefined, parseInt(uStepsSlider.value));
                    this.draw();
                }
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
