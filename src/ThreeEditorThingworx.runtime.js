TW.Runtime.Widgets.ThreeEditorThingworx = function () {
    var thisWidget = this;
    // controls of the OrbitControls and EventsControls
    var controls, eventControls, transformControls;
    var renderer;
    // the current scene
    var scene;
    // since we can rotate the mode, expose the pivot and camera target to the function
    var pivot;
    // where we are curretly looking at
    var cameraTarget;
    // the PerspectiveCamera
    var camera;
    var loader = new Loader(thisWidget);
    // are we viewing a single model or a complex scene
    var defaultScene = false;
    // needed for the inset Rendering
    var insetRenderer, insetCamera, insetScene;
    // if we need to display stats
    var stats;
    // used to illustrate selection
    var selMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d9ff
    });
    // list of function callbacks that we should call each render step
    var renderCallbacks = [];
    // tweens for rotations
    var tweenX, tweenY, tweenZ;
    // mixer for animations
    // TODO: reuse this mixer in loaders?
    var mixer;
    var clock = new THREE.Clock();

    var sceneTreeDataShape = {
        fieldDefinitions: {
            "name": {
                "name": "name",
                "baseType": "STRING",
                "aspects": ""
            },
            "id": {
                "name": "id",
                "baseType": "STRING",
                "aspects": ""
            },
            "parentId": {
                "name": "parentId",
                "baseType": "STRING",
                "aspects": ""
            }
        }
    };

    var renderRequest;
    /**
     * Initialize the default scene for viweing single models
     */
    this.initializeScene = function () {
        renderCallbacks = [];
        scene = new THREE.Scene();

        /// Global : group
        group = new THREE.Group();
        scene.add(group);

        // Lights
        thisWidget.addLights();

        if (thisWidget.getProperty("DrawGridHelpers")) {
            group.add(new THREE.GridHelper(20, 10));
        }

        cameraTarget = new THREE.Vector3();
        camera.position.z = 4;
        camera.position.y = 12;
        camera.position.x = 7;
        pivot = new THREE.Group();
        pivot.rotation.order = "YXZ";
        defaultScene = true;
    };

    /**
     * Adds lights to the scene. This includes abient lights and directional lights in each corner
     */
    this.addLights = function () {
        /// ambient light
        var ambientLight = new THREE.AmbientLight(0x404040); //, 0.8);
        scene.add(ambientLight);
        //

        /// light in every corner
        var lightIntensity = thisWidget.getProperty("LightIntensity") ? thisWidget.getProperty("LightIntensity") : 0.8;
        var directionalLight = new THREE.DirectionalLight(0xa6a6a6, lightIntensity);
        directionalLight.position.set(-1, 0, 1);

        var dl1 = new THREE.DirectionalLight(0xa6a6a6, lightIntensity);
        var dl2 = dl1.clone();
        var dl3 = dl1.clone();
        var dl4 = dl1.clone();
        // dl1.layers.mask = dl2.layers.mask = dl3.layers.mask = dl4.layers.mask = 0xff;

        dl1.position.set(1, 0, 1);
        dl2.position.set(1, 0, -1);
        dl3.position.set(1, 1, 0);
        dl4.position.set(0, -1, -1);
        scene.add(directionalLight, dl1, dl2, dl3, dl4);
    };

    /**
     * Gets the current scene 
     */
    this.getScene = function () {
        return scene;
    }

    /**
     * Gets the current animation mixer for this thing
     */
    this.getAnimationMixer = function () {
        return mixer;
    }

    /**
     * Gets the active camera in the scene
     */
    this.getCamera = function () {
        return camera;
    }

    /**
     * Loads a new model into the scene.
     */
    this.loadModel = function (modelUrl, modelType, texturePath, callback) {
        loader.loadFile(modelType, modelUrl, texturePath, callback);
    }

    /**
     * Adds a new object to the scene. It first attempts to place it in the origin, then positions the camera in its best position to view it
     */
    this.addObjectCommand = function (model, renderCallback) {
        if (!defaultScene || thisWidget.getProperty("ResetSceneOnModelChange")) {
            thisWidget.initializeScene();
        }
        // if we have a callback set, then add it to the list
        if (renderCallback) {
            renderCallbacks.push(renderCallback);
        }

        if (eventControls) {
            model.traverseVisible(function (child) {
                if (child.isMesh) {
                    eventControls.attach(child);
                }
            });
        }

        var bbox = new THREE.Box3().setFromObject(model);
        // if the model is a bit too big or too small, we'll try to scale it a bit.
        // this means scaling a model of a bbox of 600 down by 0.05
        var scaleVector = new THREE.Vector3(1, 1, 1);
        scaleVector.setLength(30 / bbox.max.length());
        model.scale.copy(scaleVector);
        // recompute the bbox after scaling
        bbox = new THREE.Box3().setFromObject(model);

        // make sure that the bbox is not infinity
        if (isFinite(bbox.max.length())) {
            bbox.getCenter(model.position); // this re-sets the model position
            model.position.multiplyScalar(-1);
            pivot.position.y = bbox.max.y / 2 + (thisWidget.getProperty("ModelYOffset") || 0);
            pivot.add(model);
            cameraTarget.y = (bbox.max.y - bbox.min.y) / 2;
            var cameraPos = bbox.min.clone();
            // this is a bit of a hack. But it moves the camera 2.5 times the vector away to the max bbox
            cameraPos.x = Math.abs(cameraPos.x);
            cameraPos.y = Math.abs(cameraPos.y);
            cameraPos.z = Math.abs(cameraPos.z);

            cameraPos.setLength(cameraPos.length() * 2.6);
            camera.position.copy(cameraPos);
        } else {
            console.error("Failed to set camera position. Bounding box was infinity");
        }
        // if the pivot has the model inside, then add the pivot to the scene
        if (pivot.children.length > 0) {
            scene.add(pivot);
        } else {
            scene.add(model);
        }
        if (mixer) {
            mixer.stopAllAction();
        }
        mixer = new THREE.AnimationMixer(scene);
        console.log("Changed model");
        thisWidget.buildSceneTree(model);
    };

    this.buildSceneTree = function (scene) {
        var objectArray = [];
        (function addObjects(objects) {
            for (var i = 0; i < objects.length; i++) {

                var object = objects[i];
                if (object && object.name != '') {
                    objectArray.push({
                        id: object.uuid,
                        parentId: object.parent ? object.parent.uuid : 'root',
                        name: object.name
                    });
                }
                addObjects(object.children);
            }

        })(scene.children);
        objectArray.push({
            id: scene.uuid,
            parentId: 'root',
            name: 'Root'
        });
        this.setProperty("SceneTree", {
            dataShape: sceneTreeDataShape,
            rows: objectArray
        });
    };

    /**
     * Sets a new scene 
     */
    this.setSceneCommand = function (sceneObject, renderCallback) {
        scene = sceneObject;
        if (mixer) {
            mixer.stopAllAction();
        }
        mixer = new THREE.AnimationMixer(scene);

        if (eventControls) {
            sceneObject.traverseVisible(function (child) {
                if (child.isMesh) {
                    eventControls.attach(child);
                }
            });
        }
        if (thisWidget.getProperty("AddLightsToSceneFiles")) {
            thisWidget.addLights();
        }
        // search the scene if we have a camera. If so, clone it
        for (var index = 0; index < sceneObject.children.length; index++) {
            var element = sceneObject.children[index];
            if (element instanceof THREE.PerspectiveCamera) {
                thisWidget.setCameraCommand(element);
            }
        }
        defaultScene = false;
        console.log("Changed Scene");
        thisWidget.buildSceneTree(scene);
    };

    /**
     * Set the camera position 
     */
    this.setCameraCommand = function (newCamera) {
        camera.position.copy(newCamera.position);
        camera.rotation.copy(newCamera.rotation);
    };

    // the html is really simple. Just a ccanvas
    this.renderHtml = function () {
        return '<div class="widget-content widget-ThreeModelViewer"><div class="spinner"></div><canvas></canvas><div class="inset"></div><div class="stats"></div></div>';
    };

    this.afterRender = function () {
        if (!Detector.webgl) Detector.addGetWebGLMessage();

        var canvas = this.jqElement.find("canvas").get(0);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: canvas,
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 10000);

        if (thisWidget.getProperty("ShowStats")) {
            stats = new Stats();
            this.jqElement.find(".stats").append(stats.dom);
        }

        if (thisWidget.getProperty("DrawAxisHelpers")) {
            setupInset();
        }
        setupLoadEvents();

        // whenever the canvas resizes, we must be responsive.
        // so watch for canvas resizes via an interval
        function onResize(element, callback) {
            var height = element.clientHeight;
            var width = element.clientWidth;

            return setInterval(function () {
                if (element.clientHeight != height || element.clientWidth != width) {
                    height = element.clientHeight;
                    width = element.clientWidth;
                    callback();
                }
            }, 500);
        }
        onResize(canvas, function () {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        // set the initial background color
        if (thisWidget.getProperty('BackgroundStyle') === undefined) {
            renderer.setClearColor(0xDEE0E1, 0.3); //0xb0b0b0 or 0xFFFFFF   background color
        } else {
            handleBackgroundColor();
        }
        // create the scene, add lights and pivot
        thisWidget.initializeScene();
        // add the orbit controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        if (thisWidget.getProperty('TransformControls')) {
            transformControls = new THREE.TransformControls(camera, renderer.domElement);
            // TODO: should not add stuff on window
            window.addEventListener('keydown', function (event) {
                switch (event.keyCode) {
                    case 81: // Q
                        transformControls.setSpace(transformControls.space === "local" ? "world" : "local");
                        break;
                    case 17: // Ctrl
                        transformControls.setTranslationSnap(100);
                        transformControls.setRotationSnap(THREE.Math.degToRad(15));
                        break;
                    case 87: // W
                        transformControls.setMode("translate");
                        break;
                    case 69: // E
                        transformControls.setMode("rotate");
                        break;
                    case 82: // R
                        transformControls.setMode("scale");
                        break;
                    case 187:
                    case 107: // +, =, num+
                        transformControls.setSize(transformControls.size + 0.1);
                        break;
                    case 189:
                    case 109: // -, _, num-
                        transformControls.setSize(Math.max(transformControls.size - 0.1, 0.1));
                        break;
                }
            });
            // TODO: should not add stuff on window
            window.addEventListener('keyup', function (event) {
                switch (event.keyCode) {
                    case 17: // Ctrl
                        transformControls.setTranslationSnap(null);
                        transformControls.setRotationSnap(null);
                        break;
                }
            });
            scene.add(transformControls);
        }


        if (thisWidget.getProperty('EnableSelection')) {
            eventControls = new EventsControls(camera, renderer.domElement);

            eventControls.attachEvent('mouseOver', function () {
                this.container.style.cursor = 'pointer';
                this.mouseOvered.oldMaterial = this.mouseOvered.material;
                this.mouseOvered.material = selMaterial;

            });

            eventControls.attachEvent('mouseOut', function () {
                this.mouseOvered.material = this.mouseOvered.oldMaterial;
            });

            eventControls.attachEvent('onclick', function () {
                thisWidget.setProperty("SelectedItem", this.event.item);
                var objectName;
                if (this.event.object.name) {
                    objectName = this.event.object.name;
                } else {
                    objectName = this.event.object.parent.name;
                }
                if (transformControls) {
                    transformControls.detach();
                    transformControls.attach(this.event.object);
                }
                thisWidget.setProperty("SelectedItemName", objectName);
            });
        }
        if (!thisWidget.getProperty("CameraControls")) {
            controls.enableZoom = false;
            controls.enableKeys = false;
            controls.enableRotate = false;
            controls.enablePan = false;
        }
        if (thisWidget.getProperty("CameraAutoRotate")) {
            controls.autoRotate = true;
        }
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;

        var domElementId = this.jqElementId;
        var wt = document.getElementById(domElementId);
        wt.appendChild(renderer.domElement);

        var render = function () {
            renderRequest = requestAnimationFrame(render);
            if (stats) {
                stats.begin();
            }
            if (mixer) {
                mixer.update(clock.getDelta());
            }
            TWEEN.update();
            controls.update();
            // call each callback that came from the model
            for (var i = 0; i < renderCallbacks.length; i++) {
                renderCallbacks[i](scene, camera);
            }
            renderer.render(scene, camera);
            // also render the insets if they were initialzed 
            if (insetCamera && insetRenderer) {
                renderInsets();
            }
            if (eventControls) {
                eventControls.update();
            }
            if (transformControls) {
                transformControls.update();
            }
            if (stats) {
                stats.end();
            }
        };
        this.setProperty("SceneTree", {
            dataShape: sceneTreeDataShape,
            rows: []
        });
        // if we had a model set, then attempt to load it
        if (thisWidget.getProperty("ModelUrl")) {
            loader.loadFile(thisWidget.getProperty("ModelType"), thisWidget.getProperty("ModelUrl"), thisWidget.getProperty("TexturePath"));
        }

        render();
    };


    this.updateProperty = function (updatePropertyInfo) {
        thisWidget.setProperty(updatePropertyInfo.TargetProperty, updatePropertyInfo.RawSinglePropertyValue);
        switch (updatePropertyInfo.TargetProperty) {
            case "BackgroundStyle":
                handleBackgroundColor();
                break;
            case "ModelUrl":
                thisWidget.loadModel(updatePropertyInfo.RawSinglePropertyValue, thisWidget.getProperty("ModelType"), thisWidget.getProperty("TexturePath"));
                break;
            case 'SelectedItem':
                // find the object that has this id
                var selectedObject = scene.getObjectById(updatePropertyInfo.RawSinglePropertyValue);
                if (selectedObject) {
                    selectedObject.oldMaterial = selectedObject.material;
                    selectedObject.material = selMaterial;
                }
                break;
            case "Rotation X":
                if (pivot.children.length) {
                    // rotation order is yxz, so we set into y
                    var angleY = thisWidget.getProperty('Rotation X') * Math.PI / 180;
                    if (tweenX) {
                        tweenX.stop();
                    }
                    tweenX = new TWEEN.Tween(pivot.rotation).to({
                        y: angleY
                    }, thisWidget.getProperty('TweenInterval')).easing(TWEEN.Easing.Quadratic.Out).start();
                }
                break;
            case "Rotation Y":
                if (pivot.children.length) {
                    // rotation order is yxz, so we set into x
                    var angleX = thisWidget.getProperty('Rotation Y') * Math.PI / 180;
                    if (tweenY) {
                        tweenY.stop();
                    }
                    tweenY = new TWEEN.Tween(pivot.rotation).to({
                        x: angleX
                    }, thisWidget.getProperty('TweenInterval')).easing(TWEEN.Easing.Quadratic.Out).start();
                }
                break;
            case "Rotation Z":
                if (pivot.children.length) {
                    var angleZ = thisWidget.getProperty('Rotation Z') * Math.PI / 180;
                    if (tweenZ) {
                        tweenZ.stop();
                    }
                    tweenZ = new TWEEN.Tween(pivot.rotation).to({
                        z: angleZ
                    }, thisWidget.getProperty('TweenInterval')).easing(TWEEN.Easing.Quadratic.Out).start();
                }
                break;
            case "Quaternion":
                if (pivot.children.length > 0) {
                    if (thisWidget.getProperty('EnableQuaternionRotation')) {
                        // build the quat from the string property
                        var tokens = (thisWidget.getProperty("Quaternion") || "").split(",");
                        if (tokens.length === 4) {
                            tokens = tokens.map(function (x) {
                                return parseFloat(x.trim());
                            });
                            var q = new THREE.Quaternion(tokens[0], tokens[1], tokens[2], tokens[3]);
                            pivot.setRotationFromQuaternion(q);
                        }
                    }
                }
                break;
            case "OverridenModelChilds":
                var overrides = thisWidget.getProperty("OverridenModelChilds");
                for (var i = 0; i < overrides.rows.length; i++) {
                    var override = overrides.rows[i];
                    var obj = scene.getObjectByName(override["objectId"]);
                    if (obj) {
                        var newMaterial = new THREE.MeshPhongMaterial({
                            color: override["color"]
                        });
                        obj.traverseVisible(function (object) {
                            if (object.material) {
                                object.oldMaterial = object.material;
                                object.material = newMaterial;
                            }
                        })

                    }
                }
                break;
            case "Animations":
                var clip = THREE.AnimationClip.parse(JSON.parse(thisWidget.getProperty("Animations")));
                // setup the mixer and play the animation sequence
                if (mixer) {
                    mixer.stopAllAction();
                }
                mixer.clipAction(clip).play();
                break;
            default:
                break;
        }
    };

    this.clearScene = function () {
        for (var i = scene.children.length - 1; i >= 0; i--) {
            obj = scene.children[i];
            scene.remove(obj);
        }
    };

    function handleBackgroundColor() {
        thisWidget.BackgroundStyle = TW.getStyleFromStyleDefinition(thisWidget.getProperty('BackgroundStyle', ''));
        if (thisWidget.BackgroundStyle.backgroundColor) {
            // we have a rgba value, handle it with opacity
            if (thisWidget.BackgroundStyle.backgroundColor.startsWith("rgba")) {
                var color = rgba2hex(thisWidget.BackgroundStyle.backgroundColor);
                renderer.setClearColor(color.color, color.opacity);
            } else {
                renderer.setClearColor(thisWidget.BackgroundStyle.backgroundColor);
            }
        }
    }

    /**
     * Extract the color and opacity form a rgba color
     */
    function rgba2hex(rgb) {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)(\s|,)*(([0-9]*[.])?[0-9]+)?/i);
        return (rgb) ? {
            color: "#" +
            ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2),
            opacity: rgb[5]
        } : '';
    }

    function setupInset() {
        var insetWidth = 150,
            insetHeight = 150;
        var insetContainer = thisWidget.jqElement.find(".inset").get(0);
        insetContainer.width = insetWidth;
        insetContainer.height = insetHeight;

        // renderer
        insetRenderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        // make sure this is transparent
        insetRenderer.setClearColor(0x000000, 0);
        insetRenderer.setSize(insetWidth, insetHeight);
        insetContainer.appendChild(insetRenderer.domElement);

        // scene
        insetScene = new THREE.Scene();

        // camera
        insetCamera = new THREE.PerspectiveCamera(50, insetWidth / insetHeight, 1, 1000);
        insetCamera.up = camera.up; // important!

        // axes
        insetScene.add(new THREE.AxisHelper(100));
    }

    function renderInsets() {
        //copy position of the camera into inset
        insetCamera.position.copy(camera.position);
        insetCamera.position.sub(controls.target);
        insetCamera.position.setLength(300);
        insetCamera.lookAt(insetScene.position);

        insetRenderer.render(insetScene, insetCamera);
    }

    function setupLoadEvents() {
        THREE.DefaultLoadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
            console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
            if (thisWidget.getProperty("ShowDataLoading")) {
                thisWidget.jqElement.find('.spinner').show();
            }
        };

        THREE.DefaultLoadingManager.onLoad = function () {
            console.log('Loading Complete!');
            thisWidget.jqElement.find('.spinner').hide();
        };


        THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
            console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
            thisWidget.jqElement.triggerHandler('LoadDone');
        };

        THREE.DefaultLoadingManager.onError = function (url) {
            console.log('There was an error loading ' + url);
            thisWidget.jqElement.find('.spinner').hide();
            thisWidget.jqElement.triggerHandler('LoadError');
        };
    }

    this.handleSelectionUpdate = function (propertyName, selectedRows, selectedRowIndices) {
        switch (propertyName) {
            // one handle single selection
            case "SceneTree":
                if (selectedRows.length > 0) {
                    // find the object that has this id
                    var selectedObject = scene.getObjectById(selectedRows[0].id);
                    selectedObject.oldMaterial = selectedObject.material;
                    selectedObject.material = selMaterial;
                }
                break;

            default:
                break;
        }
    };

    this.beforeDestroy = function () {
        window.cancelAnimationFrame(renderRequest);
    };

};