/**
 * @author Petrisor Lacatus / placatus@ptc.com /
 *
 * Model renderer for three js supported files
 */
import * as THREE from 'three';

import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import "script-loader!three/examples/js/WebGL";
import { EventsControls } from './EventControls';
import { rgba2hex } from './utilities';
import * as Stats from 'stats-js';
import { ModelLoaderFactory } from './Loader'
import { Object3D } from 'three';
//import { Renderer } from 'three';

// declare this here for no errors
declare const WEBGL: any;

/**
 * List of rotation axis for the model
 */
export enum Axis {
    X = "x", Y = "y", Z = "z"
}
export type RendererCallback = ( scene: THREE.Scene, camera: THREE.Camera ) => void;

export interface RendererOptions {
    helpers: {
        /**
         * Draw Axis Helpers to visualize the floor of the model
         */
        drawGridHelpers: boolean;

        /**
         * Draw Axis Helpers to visualize the the 3 axes in a simple way. 
         * The X axis is red. The Y axis is green. The Z axis is blue
         */
        drawAxesHelpers: boolean;

        /**
         * Show rendering statistics (FPS, Memory, etc)
         */
        showStats: boolean;

        /**
         * Show the loading indicator while a model is loading
         */
        showDataLoading: boolean;
    }
    style: {
        /**
         * Background color to use for the canvas. RGB and RGBA formats are accepted
         */
        backgroundColor: string;
        /**
        * Intensity of the light in the scene. Values from 0->1. Recommended value is 0.8
        */
        lightIntensity: number;
        /**
         * Color of the selected material
         */
        selectedMaterial: string;
        /**
         * Set to true if you want lights to be added to custom loaded scene files
         */
        addLightsToSceneFiles: boolean;
    },
    controls: {
        /**
         * Whether transform controls should be enabled. Requires enableSelection.
         */
        transformControls: boolean,

        /**
         * Allows selecting individual elements
         */
        enableSelection: boolean,

        /**
         * Enable moving the camera
         */
        cameraControls: boolean,

        /**
         * Camera automatically orbits the object
         */
        cameraAutoRotate: boolean,

        /**
         * Enable if a raycast selection of points is possible
         */
        enableRaycast: boolean
    },
    callbacks: {
        loadedSucessful: ( url?: string ) => void;
        loadingError: ( url?: string ) => void;
        selectedItemChanged: ( itemName: string, itemId: string ) => void;
        pinsPlaced: ( data: TWInfotable ) => void;
    },
    misc: {
        /**
         * Reset the scene when the model changes 
         */
        resetSceneOnModelChange: boolean;
        /**
         * How long to animate a rotation change
         */
        tweenInterval: number;

        /**
         * Whether quaternion rotation is enabled
         */
        enableQuaternionRotation: boolean;

        /**
         * This is the total number of pins a user can set if raycasting is used
         */
        totalPinNumber: number;
    }
}

export interface PositionOptions {
    /**
     * Offset on the Y axes of the model
     */
    modelYOffset: number;
    /**
     * Rotations of the model
     */
    rotationX, rotationY, rotationZ: number;
    /**
     * Quaternon describing the rotation. Comma separated, no spaces
     */
    quaternion: string;
}
export class ModelRenderer {
    options: RendererOptions;
    positionOptions: PositionOptions = <PositionOptions>{};
    /**
     * The tweens used for rotation and other animations
     */
    private tweens = {};
    /**
     * Current scene in the model
     */
    public scene: THREE.Scene;

    /**
     * Camera used for rendering
     */
    public camera: THREE.PerspectiveCamera;

    /**
     * Orbit conrols for controlling the camera
     */
    public orbitControls: OrbitControls;

    /**
     * Transform controls for controlling the transforming elements
     */
    public transformControls: TransformControls;

    /**
     * Controls for part selection
     */
    public eventControls: any;

    /**
     * Raycaster for positioning helper
     */
    public raycaster: THREE.Raycaster;

    /**
     * Raycaster for positioning helper
     */
    private interactableModels: Array<THREE.Object3D>;

    /**
     * Raycaster for positioning helper
     */
    private raycastIndicator: THREE.Mesh;

    /**
     * Raycaster for positioning helper
     */
    private pinTable: TWInfotable;

    /**
     * Raycaster for positioning helper
     */
    private pinObjArray: Array<THREE.Object3D>;

    /**
     *  Since we can rotate the mode, expose the pivot and camera target to the function
     */
    private pivot: THREE.Group;

    /**
     * The loading manager to use in all the loaders
     */
    private loadingManager: THREE.LoadingManager;
    /**
     * Renderer for the scene
     */
    renderer: THREE.WebGLRenderer;

    /**
     * Statistics instance
     */
    stats: Stats;

    /**
     * Inset rendering objects
     */
    insetRenderer: THREE.WebGLRenderer;
    insetCamera: THREE.Camera;
    insetScene: THREE.Scene;

    /**
     * Current frame request for the renderer
     */
    private frameRequest: number;

    private renderCallbacks: RendererCallback[] = [];

    /**
     * Main function that initializes all the objects in the renderer.
     * 
     * @param parent Parent element where the rendering will occur
     * @param options Rendering options
     */
    public constructor( parent: Element, options: RendererOptions ) {

        this.options = options;
        // verify if webgl is supported.
        if ( !WEBGL.isWebGLAvailable() ) {

            parent.appendChild( WEBGL.getWebGLErrorMessage() );
            throw "WebGL is not supported. Nothing will happen next."

        }

        // create the canvas where the drawing will take place
        let canvas = document.createElement( "canvas" );
        parent.appendChild( canvas );
        // create the renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: canvas,
            alpha: true,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // create a camera align with Thingview settings
        this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 200);

        // enable statistics tracking if needed 
        if ( options.helpers.showStats ) {

            this.stats = new Stats();
            parent.getElementsByClassName( "stats" )[ 0 ].appendChild( this.stats.domElement );

        }
        // setup Axes helpers
        if ( options.helpers.drawAxesHelpers ) {

            this.initializeAxesHelpers( <HTMLElement>parent.getElementsByClassName( "inset" )[ 0 ] );

        }
        // initialize the default loader
        this.initializeLoaderManagement( <HTMLElement>parent.getElementsByClassName( "spinner" )[ 0 ], options );

        // handle the color of the renderer
        if ( options.style.backgroundColor.startsWith( "rgba" ) ) {

            let color = rgba2hex( options.style.backgroundColor );
            this.renderer.setClearColor( color.color, color.opacity );

        } 
        else {

            this.renderer.setClearColor( options.style.backgroundColor );

        }
        // make the canvas responsive
        this.initializeResponsiveCanvas( canvas );
        // initialize the scene now
        this.initializeScene( options );

        this.initializeOrbitControls( options );

        // enable the transform controls if needed
        if ( options.controls.transformControls ) {

            this.initializeTransformControls();

        }
        // enable the event controls if needed
        if ( options.controls.enableSelection ) {

            this.initializeEventControls( options );

        }
        // enable raycasting
        if ( options.controls.enableRaycast ) {

            this.initializeRaycasting( options );

        }
        
    }

    /**
     * Handles the initialization of the scene, drawing lights, floors, etc
     * @param options scene initialization options
     */
    public initializeScene( options: RendererOptions ) {

        this.scene = new THREE.Scene();

        if ( options.helpers.drawGridHelpers ) {

            this.scene.add( new THREE.GridHelper( 10, 10 ) );

        }
        // enable raycasting
        if ( options.controls.enableRaycast ) {

            this.interactableModels = [];

            // Create a visual indicator where the ray hit the surface
            const geometryHelper = new THREE.ConeGeometry( 0.01, 0.05, 0.0015 );
            geometryHelper.translate( 0, 0.025, 0 );
            geometryHelper.rotateX( Math.PI / 2 );
            this.raycastIndicator = new THREE.Mesh( geometryHelper, new THREE.MeshNormalMaterial() );//new THREE.Line( new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3(), new THREE.Vector3() ] ), new THREE.LineBasicMaterial() );
            this.raycastIndicator.visible = false;
            this.scene.add( this.raycastIndicator );
        }

        this.initializeLights( options );
        this.pivot = new THREE.Group();
        this.pivot.rotation.order = "YXZ";
        this.camera.position.z = 4;
        this.camera.position.y = 12;
        this.camera.position.x = 7;

        this.scene[ "isModelViewerDefaultScene" ] = true;
    }

    /**
     * Sets up 4 point lighting and ambient light
     * @param options Lighting options
     */
    public initializeLights( options: RendererOptions ) {
        let lightGroup = new THREE.Group();
        lightGroup.name = "LightsGroup";
        // ambient light
        let ambientLight = new THREE.AmbientLight( 0x404040 ); //, 0.8);
        lightGroup.add( ambientLight );
        //

        /// light in every corner
        let directionalLight = new THREE.DirectionalLight( 0xa6a6a6, options.style.lightIntensity );
        directionalLight.position.set( -1, 0, 1 );

        let dl1 = new THREE.DirectionalLight( 0xa6a6a6, options.style.lightIntensity );
        let dl2 = dl1.clone();
        let dl3 = dl1.clone();
        let dl4 = dl1.clone();
        // dl1.layers.mask = dl2.layers.mask = dl3.layers.mask = dl4.layers.mask = 0xff;

        dl1.position.set( 1, 0, 1 );
        dl2.position.set( 1, 0, -1 );
        dl3.position.set( 1, 1, 0 );
        dl4.position.set( 0, -1, -1 );
        lightGroup.add( directionalLight, dl1, dl2, dl3, dl4 );

        this.scene.add( lightGroup );
    }

    /**
     * Sets up the axes helpers that show where the camera is
     * @param parent Where to draw the axes helpers
     */
    public initializeAxesHelpers( parent: HTMLElement ) {
        parent.style.width = '150px';
        parent.style.height = '150px';

        // renderer
        this.insetRenderer = new THREE.WebGLRenderer( {
            alpha: true,
            antialias: true
        } );
        // make sure this is transparent
        this.insetRenderer.setClearColor( 0x000000, 0 );
        this.insetRenderer.setSize( 150, 150 );
        parent.appendChild( this.insetRenderer.domElement );

        // scene
        this.insetScene = new THREE.Scene();

        // camera
        this.insetCamera = new THREE.PerspectiveCamera( 45, 1, 1, 1000 );
        this.insetCamera.up = this.camera.up; // important!

        // axes
        this.insetScene.add( new THREE.AxesHelper( 100 ) );
    }

    /**
     * Handles rendering of the axes helpers
     */
    renderAxesHelpers() {
        //copy position of the camera into inset
        this.insetCamera.position.copy( this.camera.position );
        this.insetCamera.position.sub( this.orbitControls.target );
        this.insetCamera.position.setLength( 300 );
        this.insetCamera.lookAt( this.insetScene.position );

        this.insetRenderer.render( this.insetScene, this.insetCamera );
    }

    /**
     * Listens for changes in canvas size and updates the renderer accordingly
     * @param canvas Canvas to setup as responsive
     */
    initializeResponsiveCanvas( canvas: HTMLCanvasElement ) {
        // whenever the canvas resizes, we must be responsive.
        // so watch for canvas resizes via an interval
        function onResize( element, callback ) {

            let height = element.clientHeight;
            let width = element.clientWidth;

            return setInterval( () => {

                if ( element.clientHeight != height || element.clientWidth != width ) {

                    height = element.clientHeight;
                    width = element.clientWidth;
                    callback();

                }

            }, 500);

        }
        onResize(canvas, () => {

            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();

        });
        this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );

    }

    /**
     * Takes care of showing or hiding the data loading indicator
     * @param spinnerElement element to hide or show
     * @param options 
     */
    initializeLoaderManagement( spinnerElement: HTMLElement, options: RendererOptions ) {
        //@ts-ignore
        THREE.DefaultLoadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {

            console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
            if ( options.helpers.showDataLoading ) {

                spinnerElement.style.display = 'block';

            }

        };

        THREE.DefaultLoadingManager.onLoad = function () {

            console.log( 'Loading Complete!' );
            spinnerElement.style.display = 'none';

        };


        THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {

            console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

        };
        //@ts-ignore
        THREE.DefaultLoadingManager.onError = function ( url ) {

            console.log( 'There was an error loading ' + url );
            spinnerElement.style.display = 'block';
            options.callbacks.loadingError( url );

        };

        this.loadingManager = THREE.DefaultLoadingManager;
    }

    /**
     * Intializes the orbit options 
     * @param options Controls options
     */
    initializeOrbitControls( options: RendererOptions ) {

        // add the orbit controls
        this.orbitControls = new OrbitControls( this.camera, this.renderer.domElement );
        // enable of disable the camera controls
        this.orbitControls.enableZoom = options.controls.cameraControls;
        this.orbitControls.enableKeys = options.controls.cameraControls;
        this.orbitControls.enableRotate = options.controls.cameraControls;
        this.orbitControls.enablePan = options.controls.cameraControls;

        if ( options.controls.cameraAutoRotate ) {

            this.orbitControls.autoRotate = true;

        }

        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.25;

    }

    /**
     * Initializes the transform controls on this renderer
     */
    initializeTransformControls() {

        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        // TODO: should not add stuff on window
        this.renderer.domElement.addEventListener( 'keydown', (event) => {
            switch (event.code) {
                case "KeyQ"://81: // Q
                    this.transformControls.setSpace(this.transformControls.space === "local" ? "world" : "local" );
                    break;
                case "KeyW"://87: // W
                    this.transformControls.setMode( "translate" );
                    break;
                case "KeyE"://69: // E
                    this.transformControls.setMode( "rotate" );
                    break;
                case "KeyR"://82: // R
                    this.transformControls.setMode( "scale" );
                    break;
                case "Equal"://187:
                case "NumpadAdd"://107: // +, =, num+
                    this.transformControls.setSize( this.transformControls.size + 0.1 );
                    break;
                case "Minus"://189:
                case "NumpadSubtract"://109: // -, _, num-
                    this.transformControls.setSize( Math.max( this.transformControls.size - 0.1, 0.1 ) );
                    break;
            }
            if ( event.ctrlKey ) {

                //@ts-ignore
                this.transformControls.setTranslationSnap( 100 );
                //@ts-ignore
                this.transformControls.setRotationSnap( THREE.Math.degToRad( 15 ) );

            }
        });
        // TODO: should not add stuff on window
        this.renderer.domElement.addEventListener( 'keyup', event => {

            if ( event.ctrlKey ) {

                this.transformControls.setTranslationSnap(null);
                this.transformControls.setRotationSnap(null);

            }

        });
        this.scene.add( this.transformControls );
        
    }

    /**
     * Initializes event controls for selection handling
     */
    initializeEventControls( options: RendererOptions ) {

        this.eventControls = new EventsControls( this.camera, this.renderer.domElement );
        // easy fix for losing this reference
        let transformControls = this.transformControls;
        let selectedMaterial = new THREE.MeshPhongMaterial( {
            color: new THREE.Color( options.style.selectedMaterial )
        } );

        this.eventControls.attachEvent( 'mouseOver', function () {

            this.container.style.cursor = 'pointer';
            this.mouseOvered.oldMaterial = this.mouseOvered.material;
            this.mouseOvered.material = selectedMaterial;

        } );

        this.eventControls.attachEvent( 'mouseOut', function () {

            this.mouseOvered.material = this.mouseOvered.oldMaterial;

        } );

        this.eventControls.attachEvent( 'onclick', function () {

            var objectName;
            if ( this.event.object.name ) {

                objectName = this.event.object.name;

            } 
            else {

                objectName = this.event.object.parent.name;

            }
            if ( options.controls.transformControls ) {

                transformControls.detach();
                transformControls.attach( this.event.object );

            }
            options.callbacks.selectedItemChanged( this.event.item, objectName );

        }) ;

    }

    /**
     * Initializes ray casting 
     */
    initializeRaycasting( options: RendererOptions ) {
        this.pinTable = {
            dataShape: {
                fieldDefinitions: {
                    "position": {
                        "name": "position",
                        "baseType": "STRING"
                    },
                    "rotation": {
                        "name": "rotation",
                        "baseType": "STRING"
                    }
                }
            },
            rows: []
        };
        this.pinObjArray = [];

        this.raycaster = new THREE.Raycaster();

        // Register mouse over event so we can cast from the coordinates
        this.renderer.domElement.addEventListener( 'pointermove', event => {
            //@ts-ignore
            this.checkIntersection( event.layerX, event.layerY );
        });

        this.renderer.domElement.addEventListener( 'pointerdown', event => {
            
            if( ( this.pinTable.rows.length < this.options.misc.totalPinNumber ) && this.raycastIndicator.visible ) {

                console.log( "place pin" );
                // Create and add pin to scene
                this.createPin( this.raycastIndicator );
                
            }
            else {

                console.log( "Restart placing!" );

            }
            
        });
    }

    /**
     * check if cursor intersect with the given model
     */
    checkIntersection( x: number, y: number ) {
        
        const pointer = new THREE.Vector2( ( x / this.renderer.domElement.clientWidth ) * 2 - 1, - ( y / this.renderer.domElement.clientHeight ) * 2 + 1 );

        this.raycaster.setFromCamera( pointer, this.camera );

        const intersects = this.raycaster.intersectObjects( this.interactableModels, true );
        //console.log(pointer, intersects, this.interactableModels);
        if ( intersects.length > 0 )  {
            
            /* const p = intersects[ 0 ].point;
            const n = intersects[ 0 ].face.normal.clone(); */
            
            this.raycastIndicator.position.set( 0, 0, 0 );
            this.raycastIndicator.lookAt( intersects[ 0 ].face.normal );

            this.raycastIndicator.position.copy( intersects[ 0 ].point );
            this.raycastIndicator.visible = true;

            intersects.length = 0;

        }
        else {

            this.raycastIndicator.visible = false;

        }

    }

    /**
     * Creates a pin at last intersected position
     * @param obj an THREE object3D to get position and rotation
     */
    createPin( obj: Object3D ) {

        //ToDo Load Texture only once
        const loader = new THREE.TextureLoader();
        const material = new THREE.SpriteMaterial( { 
            map: loader.load( "/Thingworx/Common/extensions/ThreeEditorThingworx_ExtensionPackage/ui/ThreeEditorThingworx/images/icons8-location-100.png" ),
            transparent: true
        } );
        const plane = new THREE.Sprite( material );

        // Create pivot
        plane.center = new THREE.Vector2( 0.5, 0 );
        // just want to have a 2cm big pin
        plane.scale.multiplyScalar( 0.02 );
        plane.position.copy( obj.position );

        this.scene.add( plane );

        // Save them so we can later easier remove them!
        this.pinObjArray.push( plane );
        
        // This will later responded in PinsPlaced Infotable!
        this.pinTable.rows.push( { 
            position: obj.position.x + " " + obj.position.y + " " + obj.position.z,
            rotation: THREE.Math.radToDeg( obj.rotation.x ) + " " + THREE.Math.radToDeg( obj.rotation.y ) + " " + THREE.Math.radToDeg( obj.rotation.z )
        } );

        // Return the INFOTABLE if all pins are placed
        // This will also emit the event!
        if( this.pinTable.rows.length == this.options.misc.totalPinNumber ) {

            this.options.callbacks.pinsPlaced( this.pinTable );

        }

    }

   /**
     * Returns a copy of the given infotable.
     * @param table The infotable to copy.
     * @return      An infotable.
     */
    _copyInfotable( table: TWInfotable ): TWInfotable {

        return {dataShape: table.dataShape, rows: table.rows.map( row => {
            
            const newRow = {};
            for ( const key in row ) {

                newRow[ key ] = row[ key ];

            }

            return newRow;
        } )};

    }

    /**
     * Adds a new callback that is executed in the render loop
     */
    public addRenderCallback( callback: RendererCallback ) {

        this.renderCallbacks.push( callback );

    }

    /**
     * Removes a that is executed in the render loop
     */
    public removeRenderCallback( callback: RendererCallback ) {

        this.renderCallbacks.splice( this.renderCallbacks.indexOf( callback ), 1 );

    }

    /**
     * Starts the render loop
     */
    public render = () => {

        this.frameRequest = requestAnimationFrame( this.render );
        if ( this.stats ) {
            
            this.stats.begin();

        }
        // TODO: handle the animation mixer
        //if (mixer) {
        //    mixer.update(clock.getDelta());
        //}
        TWEEN.update();
        this.orbitControls.update();
        // call each callback that came from the model
        for ( const callback of this.renderCallbacks ) {

            callback( this.scene, this.camera );

        }
        this.renderer.render( this.scene, this.camera );
        // also render the insets if they were initialzed
        if ( this.insetCamera && this.insetRenderer ) {

            this.renderAxesHelpers();

        }
        if ( this.eventControls ) {

            this.eventControls.update();

        }
        // TODO: transform controls don't show up. Why?
        if ( this.transformControls ) {

            this.transformControls.update();

        }
        if ( this.stats ) {

            this.stats.end();

        }

    }

    /**
     * Stops the rendering process. It can be later resumed by calling render
     */
    stopRendering() {

        window.cancelAnimationFrame( this.frameRequest );

    }

    /**
     * Loads a specified model at the given url and returns the THREE.Object3D. Can also load the file into the scene if requested.
     * 
     * @param modelUrl Path to the model to be loaded.
     * @param modelType Model type to be used. See ModelLoaderFactory in Loader.ts for more info. Will be inferred from the modelUrl if not provided
     * @param texturePath Path to the textures of the model, or other dependencies. Will be inferred from the modelUrl if not provided.
     * @param addToScene If you want to also add the model to the scene, or just load and return it.
     */
    async loadModel( modelUrl: string, modelType = "Auto-Detect", texturePath?: string, addToScene = true ): Promise<THREE.Object3D> {

        // try to optain the model type
        modelType = ( !modelType || modelType == "Auto-Detect" ) ? modelUrl.split( '.' ).pop().split( /\#|\?/ )[0].toLowerCase() : modelType;
        // handle the texture path. If it's set, then use it. If not, get it from the modelUrl
        texturePath = texturePath ? texturePath : modelUrl.substring( 0, modelUrl.lastIndexOf( "/" ) + 1 );

        let loaderBuilder = ModelLoaderFactory.getLoader( modelType );
        let loader = new loaderBuilder( modelUrl, texturePath, this.loadingManager );
        let object = await loader.load();

        if ( addToScene ) {
            if ( object.type == "Scene" ) {

                this.setSceneCommand( <THREE.Scene>object );

            } 
            else {

                this.addObject3dToScene( object );

            }
        }
        return new Promise<THREE.Object3D>( ( resolve ) => {

            this.options.callbacks.loadedSucessful( modelUrl );
            resolve( object );

        } );

    }

    /**
     * Filled the INFOTABLE of already placed pins
     * @param data An INFOTABLE with position and rotation fields.
     */
    loadPlacedPins( data: TWInfotable ) {

        //@ts-ignore
        console.log(data, data.rows);
        data.rows.forEach( value => {

            console.log(value);
            let obj = new Object3D();
            obj.position.fromArray( value.position.split( " " ) )
            obj.rotation.fromArray( value.rotation.split( " " ) )
            this.createPin( obj );

        } );

    }

    /**
     * Delete all Pins from a Scene and remove entries from INFOTABLE
     * This function is also used by Service Purge Pins
     */
    purgeAllPins() {

        this.pinObjArray.forEach( child => {
            this.scene.remove( child ); 
        } );
        // Empty INFOTABLE
        this.pinTable.rows = [];

    }

    setSceneCommand(sceneObject: THREE.Scene) {

        //this.scene = sceneObject;
       
        //TODO: handle mixers
        //if (mixer) {
        //   mixer.stopAllAction();
        //}
        //mixer = new THREE.AnimationMixer(scene);
        if (!this.scene["isModelViewerDefaultScene"] || this.options.misc.resetSceneOnModelChange) {

            this.initializeScene(this.options);
            if (this.eventControls) {

                this.eventControls.objects = [];

            }

        }

        sceneObject.traverse((child) => {
            //if ((<THREE.Mesh>child).isMesh) {
                this.scene.add(child);
            //}
            if (this.options.controls.enableRaycast) {

                this.interactableModels.push(child);

            }
        })

        if (this.eventControls) {

            sceneObject.traverseVisible((child) => {

                if ((<THREE.Mesh>child).isMesh) {

                    this.eventControls.attach(child);

                }
                
            });

        }
        /* if (this.options.helpers.drawGridHelpers) {
            this.scene.add(new THREE.GridHelper(10, 10));
        } 
        if (this.options.style.addLightsToSceneFiles) {
            this.initializeLights(this.options);
        }*/
        // search the scene if we have a camera. If so, clone it
        for (var index = 0; index < sceneObject.children.length; index++) {

            var element = sceneObject.children[index];
            if (element instanceof THREE.PerspectiveCamera) {

                this.setCameraOptions(element);

            }

        }
        console.log( "Changed Scene" );
        // TODO: build sceneTRee
        // thisWidget.buildSceneTree(scene);
    };

    addObject3dToScene( model: THREE.Object3D ) {

        if (!this.scene["isModelViewerDefaultScene"] || this.options.misc.resetSceneOnModelChange) {

            this.initializeScene(this.options);
            if (this.eventControls) {

                this.eventControls.objects = [];

            }

        }
        // TODO: if we have a callback set, then add it to the list
        /*if (renderCallback) {
            renderCallbacks.push(renderCallback);
        }
        */
        if ( this.eventControls ) {

            model.traverseVisible( ( child ) => {

                if ( ( <THREE.Mesh>child ).isMesh ) {

                    this.eventControls.attach( child );

                }

            } );

        }

        var bbox = new THREE.Box3().setFromObject( model );
        // if the model is a bit too big or too small, we'll try to scale it a bit.
        // this means scaling a model of a bbox of 600 down by 0.05
        var scaleVector = new THREE.Vector3( 1, 1, 1 );
        scaleVector.setLength( 30 / bbox.max.length() );
        model.scale.copy( scaleVector );
        // recompute the bbox after scaling
        bbox = new THREE.Box3().setFromObject( model );

        // make sure that the bbox is not infinity
        if ( isFinite( bbox.max.length() ) ) {

            bbox.getCenter( model.position ); // this re-sets the model position
            model.position.multiplyScalar( -1 );
            this.pivot.position.y = bbox.max.y / 2 + this.positionOptions.modelYOffset;
            this.pivot.add( model );
            var cameraPos = bbox.min.clone();
            // this is a bit of a hack. But it moves the camera 2.5 times the vector away to the max bbox
            cameraPos.x = Math.abs( cameraPos.x );
            cameraPos.y = Math.abs( cameraPos.y );
            cameraPos.z = Math.abs( cameraPos.z );

            cameraPos.setLength( cameraPos.length() * 2.6 );
            this.camera.position.copy( cameraPos );

        } else {

            console.error( "Failed to set camera position. Bounding box was infinity" );

        }
        // if the pivot has the model inside, then add the pivot to the scene
        if ( this.pivot.children.length > 0 ) {

            this.scene.add( this.pivot );
            this.interactableModels.push( this.pivot );

        } else {

            this.scene.add( model );
            this.interactableModels.push( model );

        }
        // TODO: MIXER
        /*if (mixer) {
            mixer.stopAllAction();
        }
        mixer = new THREE.AnimationMixer(scene);
        */
        console.log( "Changed model" );
        //TODO: thisWidget.buildSceneTree(model);
        
    }

    setCameraOptions( newCamera: THREE.PerspectiveCamera  ) {

        this.camera.position.copy(newCamera.position);
        this.camera.rotation.copy(newCamera.rotation);

    }

    /**
     * Updates the positions and rotation information of the model according to the given info
     * @param options New position and rotation data
     */
    applyPositionChanges( options: PositionOptions ) {
        if ( !isNaN( options.modelYOffset ) && !isNaN( this.positionOptions.modelYOffset ) && options.modelYOffset != this.positionOptions.modelYOffset ) {

            this.pivot.position.y = options.modelYOffset;

        }

        if (this.options.misc.enableQuaternionRotation) {

            // build the quat from the string property
            let tokens = (options.quaternion || "" ).split( "," );
            if (tokens.length === 4) {

                let values = tokens.map( function ( x ) {
                    return parseFloat( x.trim() );
                } );
                this.pivot.setRotationFromQuaternion( new THREE.Quaternion( values[ 0 ], values[ 1 ], values[ 2 ], values[ 3 ] ) );

            }
        } 
        else {

            // has changed, so update it
            if ( options.rotationX != this.positionOptions.rotationX ) {

                this.applyRotationOnAxis( options.rotationX, Axis.X, true );

            }
            if ( options.rotationY != this.positionOptions.rotationY ) {

                this.applyRotationOnAxis( options.rotationY, Axis.Y, true );

            }
            if ( options.rotationZ != this.positionOptions.rotationZ ) {

                this.applyRotationOnAxis( options.rotationZ, Axis.Z, true );

            }

        }
        // now save the options for later
        this.positionOptions = options;
    }

    /**
     * Rotates the pivon along the given axis to the new rotation.
     * @param rotation In degress, what is the new rotation
     * @param axis axis on which to rotate. Can be x, y, or z
     * @param smooth if interpolation should be enabled or not for this movement
     */
    applyRotationOnAxis(rotation: number, axis: Axis, smooth: boolean) {
        let angle = THREE.Math.degToRad(rotation);
        if (smooth) {
            let tweenName = "rot" + axis.toUpperCase();
            if (this.tweens[tweenName]) {
                this.tweens[tweenName].stop();
            }
            let animationInfo = {};
            animationInfo[axis] = angle;
            this.tweens[tweenName] = new TWEEN.Tween(this.pivot.rotation).to(animationInfo,
                this.options.misc.tweenInterval).easing(TWEEN.Easing.Quadratic.Out).start();
        } else {
            this.pivot.rotation[axis] = angle;
        }
    }
}