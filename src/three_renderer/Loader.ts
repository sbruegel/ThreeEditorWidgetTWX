/**
 * @author Petrisor Lacatus / placatus@ptc.com /
 * 
 * Loader for multiple model types and formats
 */

import * as THREE from 'three';
declare const WIDGET_PATH_URL: string;

export abstract class ModelLoader {
    protected url: string;
    protected texturePath: string;
    protected loadingManager: THREE.LoadingManager;


    constructor(url: string, texturePath: string, loadingManager: THREE.LoadingManager) {
        this.url = url;
        this.texturePath = texturePath;
        this.loadingManager = loadingManager;
    }

    /**
     * Loads given file and fires callback when done
     */
    public abstract load(): Promise<THREE.Object3D>;
}

export class DefaultLoader extends ModelLoader {
    public load(): Promise<THREE.Object3D> {
        throw new Error("Model not recognized");
    }
}

export class MfLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/3MFLoader');
        // also put JSZip on window as it's required
        let jszipLoader = await import('jszip');
        window["JSZip"] = jszipLoader.default;
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.ThreeMFLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class TdsLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/TDSLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.TDSLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class AmfLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/AMFLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.AMFLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class AssimpJsonLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/AssimpJSONLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.AssimpJSONLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class AssimpLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/AssimpLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            // TODO: this can have animations
            new loader.AssimpLoader().load(this.url, (model: {
                animation: any;
                object: THREE.Object3D;
            }) => {
                resolve(model.object);
            })
        });
    }
}

export class AwdLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/AWDLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.AWDLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class BabylonLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/BabylonLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.BabylonLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class GCodeLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/GCodeLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.GCodeLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class ColladaLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/ColladaLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            // TODO: this can have animations
            new loader.ColladaLoader(this.loadingManager).load(this.url, (data) => {
                resolve(data.scene);
            })
        });
    }
}

export class FbxLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/FBXLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.FBXLoader(this.loadingManager).load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}

export class GltfLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const gltfLoader = await import('three/examples/jsm/loaders/GLTFLoader');
        const dracoLoader = await import('three/examples/jsm/loaders/DRACOLoader');
        dracoLoader.DRACOLoader.setDecoderPath(WIDGET_PATH_URL + 'static/draco/');
        return new Promise<THREE.Object3D>((resolve) => {
            const loader = new gltfLoader.GLTFLoader(this.loadingManager);
            loader.setDRACOLoader( new dracoLoader.DRACOLoader() );
            loader.load(this.url, (data) => {
                resolve(data.scene);
            })
        });
    }
}

export class LegacyGltfLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/deprecated/LegacyGLTFLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.LegacyGLTFLoader(this.loadingManager).load(this.url, (data) => {
                resolve(data.scene);
            })
        });
    }
}

export class KmzLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/KMZLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.KMZLoader(this.loadingManager).load(this.url, (data) => {
                resolve(data.scene);
            })
        });
    }
}

export class Md2Loader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/MD2Loader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.MD2Loader(this.loadingManager).load(this.url, (data: THREE.BufferGeometry) => {
                let material = new THREE.MeshStandardMaterial({
                    morphTargets: true,
                    morphNormals: true
                });
                var mesh = new THREE.Mesh(data, material);

                resolve(mesh);
            })
        });
    }
}


export class ObjLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const objLoader = await import('three/examples/jsm/loaders/OBJLoader');
        const mtlLoader = await import('three/examples/jsm/loaders/MTLLoader');
        let mtlPath;
        if (/.*\/(.*)\..*/.exec(this.url).length > 0) {
            mtlPath = /.*\/(.*)\..*/.exec(this.url)[1] + ".mtl";
        }
        let materialLoader = new mtlLoader.MTLLoader();
        let objectLoader = new objLoader.OBJLoader(this.loadingManager);
        materialLoader.setPath(this.texturePath);
        let materialPromise = new Promise((resolve, reject) => {
            materialLoader.load(mtlPath, function (materials) {
                materials.preload();
                objectLoader.setMaterials(materials);
                resolve();
            }, undefined, reject);
        })
        // try to load materials
        try {
            await materialPromise;
        } catch (ex) {
            // we don't really care if mtl fail loading. just log something and move on
            console.log("ObjLoader: Failed to load materials from " + mtlPath);
        }

        return new Promise<THREE.Object3D>((resolve) => {
            objectLoader.load(this.url, (model: THREE.Object3D) => {
                resolve(model);
            })
        });
    }
}


export class PlayCanvasLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/PlayCanvasLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.PlayCanvasLoader(this.loadingManager).load(this.url, (object) => {
                resolve(object);
            })
        });
    }
}

export class PlyLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/PLYLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.PLYLoader(this.loadingManager).load(this.url, (geometry) => {
                resolve(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
            })
        });
    }
}

export class PrwmLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/PRWMLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.PRWMLoader(this.loadingManager).load(this.url, (geometry) => {
                let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({}));
                resolve(mesh);
            })
        });
    }
}

export class CreoViewLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        // we need to handle loading manager events ourselves
        this.loadingManager.itemStart(this.url);
        let creoViewLoader = await import("../loaders/CVThreeLoader");
        let CVThreeLoader = creoViewLoader.CVThreeLoader;

        const delay = time => new Promise(res => setTimeout(() => res(), time));

        const loadPvzModel = url => {
            return new Promise<THREE.Object3D>((resolve, reject) => {
                CVThreeLoader.LoadModel(this.url, (obj) => {
                    this.loadingManager.itemEnd(this.url);
                    resolve(obj);
                },
                    (obj) => {
                        this.loadingManager.itemError(this.url);
                        reject(obj);
                    },
                    true);
            });
        }

        if (window["cvApiInited"]) {
            await delay(200);
            return loadPvzModel(this.url);
        } else {
            let libthingloadPromise = new Promise((resolve) => {
                CVThreeLoader.Init('/Thingworx/Common/extensions/ThreeEditorThingworx_ExtensionPackage/ui/ThreeEditorThingworx/static/libthingload', () => {
                    console.log('CVThreeLoader Ready');
                    window["cvApiInited"] = true;
                    resolve();
                });
            })
            await libthingloadPromise;
            await delay(200);
            return loadPvzModel(this.url);
        }
    }
}

export class StlLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/STLLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.STLLoader(this.loadingManager).load(this.url, (geometry) => {
                let material;
                if ((<any>geometry).hasColors) {
                    material = new THREE.MeshPhongMaterial({
                        opacity: (<any>geometry).alpha,
                        vertexColors: THREE.VertexColors
                    });
                } else {
                    material = new THREE.MeshStandardMaterial();
                }
                var mesh = new THREE.Mesh(geometry, material);
                resolve(mesh);
            })
        });
    }
}

export class VtkLoader extends ModelLoader {
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/VTKLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.VRMLLoader(this.loadingManager).load(this.url, (geometry) => {
                let mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({}));
                resolve(mesh);
            })
        });
    }
}
// TODO: XLoader is missing
export class VrmlLoader extends ModelLoader {
    // TODO: does not work as this gets lost
    public async load(): Promise<THREE.Object3D> {
        const loader = await import('three/examples/jsm/loaders/VRMLLoader');
        return new Promise<THREE.Object3D>((resolve) => {
            new loader.VRMLLoader(this.loadingManager).load(this.url, (model) => {
                resolve(model);
            })
        });
    }
}

export interface ModelLoaderConstructor {
    new(url: string, texturePath: string, loadingManager: THREE.LoadingManager): ModelLoader;
}

export class ModelLoaderFactory {
    private static mapping: { [name: string]: ModelLoaderConstructor } = {
        "3mf": MfLoader,
        "3ds": TdsLoader,
        "tds": TdsLoader,
        "amf": AmfLoader,
        "assimpjson": AssimpJsonLoader,
        "assimp": AssimpLoader,
        "awd": AwdLoader,
        "babylon": BabylonLoader,
        "gcode": GCodeLoader,
        "dae": ColladaLoader,
        "fbx": FbxLoader,
        "glb": GltfLoader,
        "gltf": GltfLoader,
        "gltf1": LegacyGltfLoader,
        "kmz": KmzLoader,
        "md2": Md2Loader,
        "obj": ObjLoader,
        "playcanvas": PlayCanvasLoader,
        "ply": PlyLoader,
        "prwm": PrwmLoader,
        "pvz": CreoViewLoader,
        "ol": CreoViewLoader,
        "pvt": CreoViewLoader,
        "stl": StlLoader,
        "vtk": VtkLoader,
        "wrl": VrmlLoader
    }

    static getLoader(modelType): ModelLoaderConstructor {
        if (this.mapping[modelType]) {
            return this.mapping[modelType];
        } else {
            return this.mapping["default"];
        }
    }
}
