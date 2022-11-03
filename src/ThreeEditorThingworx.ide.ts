// automatically import the css file
import { ThingworxComposerWidget } from 'typescriptwebpacksupport/widgetIDESupport';

@ThingworxComposerWidget
class ThreeEditorThingworx extends TWComposerWidget {

    widgetIconUrl(): string {
        return require( './images/ThreeEditorThingworx.png' );
    }

    widgetProperties(): TWWidgetProperties {
        require( "./styles/ThreeModelViewer.ide.css" );
        return {
            'name': 'Three Editor',
            'description': 'Three Js based 3d Editor',
            'category': ['Common'],
            'supportsAutoResize': true,
            'properties': {
                'Width': {
                    'description': 'Total width of the widget',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 640,
                    'isBindingTarget': false
                },
                'Height': {
                    'description': 'Total height of the widget',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 800,
                    'isBindingTarget': false
                },
                'ModelUrl': {
                    'description': 'URL to the model',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'defaultValue': 0.0,
                    'isBindingTarget': true
                },
                'ModelType': {
                    'description': 'Type of the model. If Auto-detect use the file extension',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'defaultValue': 'Auto-Detect',
                    'isBindingTarget': true,
                    'selectOptions': [{
                        value: 'Auto-Detect',
                        text: 'Auto-Detect'
                    }, {
                        value: 'dae',
                        text: 'Collada'
                    }, {
                        value: '3mf',
                        text: '3mf'
                    }, {
                        value: 'amf',
                        text: 'amf'
                    }, {
                        value: 'awd',
                        text: 'awd'
                    }, {
                        value: 'babylon',
                        text: 'babylon'
                    }, {
                        value: 'ctm',
                        text: 'ctm'
                    }, {
                        value: 'fbx',
                        text: 'fbx'
                    }, {
                        value: 'gltf',
                        text: 'gltf'
                    }, {
                        value: 'json',
                        text: 'json'
                    }, {
                        value: 'md2',
                        text: 'md2'
                    }, {
                        value: 'obj',
                        text: 'obj'
                    }, {
                        value: 'ply',
                        text: 'ply'
                    }, {
                        value: 'stl',
                        text: 'stl'
                    }, {
                        value: 'gltf',
                        text: 'gltf'
                    }, {
                        value: 'vtk',
                        text: 'vtk'
                    }, {
                        value: 'wrl',
                        text: 'wrl'
                    }, {
                        value: 'gltf1',
                        text: 'LegacyGLTF'
                    }, {
                        value: 'gcode',
                        text: 'gcode'
                    }, {
                        value: 'assimpjson',
                        text: 'assimpjson'
                    }, {
                        value: 'sea',
                        text: 'sea'
                    }, {
                        value: 'x',
                        text: 'x'
                    }, {
                        value: 'pvz',
                        text: 'pvz'
                    }, {
                        value: 'ol',
                        text: 'ol'
                    }, {
                        value: 'pvt',
                        text: 'ol'
                    }]
                },
                'DrawAxisHelpers': {
                    'description': 'Draw Axis Helpers to visualize the the 3 axes in a simple way. The X axis is red. The Y axis is green. The Z axis is blue ',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true,
                    'isBindingTarget': true
                },
                'DrawGridHelpers': {
                    'description': 'Draw Grid Helpers on the ground',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true,
                    'isBindingTarget': true
                },
                'ResetSceneOnModelChange': {
                    'description': 'Reset the scene whenever the model changes',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true,
                    'isBindingTarget': true
                },
                'AddLightsToSceneFiles': {
                    'description': 'When loading scene files, add the default lights',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true,
                    'isBindingTarget': true
                },
                'CameraControls': {
                    'description': 'Enable controlling the camera',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': true,
                    'isBindingTarget': true
                },
                'CameraAutoRotate': {
                    'description': 'Set to true to automatically rotate around the target',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingTarget': true
                },
                'EnableRaycast': {
                    'description': 'Enable process to get coordinates of model intersection from curser',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingTarget': true
                },
                'EnableSelection': {
                    'description': 'Enable selection of child elements in the scene',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingTarget': true
                },
                'TransformControls': {
                    'description': 'Enable editing the scene using translate/rotate/scale commands',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': false,
                },
                'ShowStats': {
                    'description': 'Show render statistics (FPS, memory, CPU)',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingTarget': true
                },
                'LightIntensity': {
                    'description': 'The intensity of the light. Use a value between 0 and 1',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 0.8,
                    'isBindingTarget': true
                },
                'SceneTree': {
                    'description': 'A tree of all the elements in the scene',
                    'baseType': 'INFOTABLE',
                    'isVisible': true,
                    'isBindingSource': true
                },
                'SelectedItem': {
                    'description': 'The id currently selected item in the scene',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingSource': true,
                    'isBindingTarget': true
                },
                'SelectedItemName': {
                    'description': 'The name currently selected item in the scene',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingSource': true
                },
                'TotalPinNumber': {
                    'description': 'Defines how much pin a user can place',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 2,
                    'isBindingSource': true
                },
                'PlacedPins': {
                    'description': 'A list of all placed points if Raycasting is enabled',
                    'baseType': 'INFOTABLE',
                    'isVisible': true,
                    'isBindingSource': true,
                    'isBindingTarget': true
                },
                'TexturePath': {
                    'description': 'If textures are requested, what is the path to get them. If null, defaults to the folder where the scene is stored.',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingTarget': true
                },
                'Rotation Z': {
                    'description': 'Rotation along the X axis of the Model',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 0.0,
                    'isBindingTarget': true
                },
                'Rotation Y': {
                    'description': 'Rotation along the Y axis of the Model',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 0.0,
                    'isBindingTarget': true
                },
                'Rotation X': {
                    'description': 'Rotation along the Z axis of the Model',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 0.0,
                    'isBindingTarget': true
                },
                'TweenInterval': {
                    'description': 'In miliseconds, how long should the rotation animation last',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 500.0,
                    'isBindingTarget': true
                },
                'Quaternion': {
                    'description': 'Rotation Quaternion for the model. Represented as comma sepparated X,Y,Z,W',
                    'baseType': 'STRING',
                    'isVisible': true,
                    'defaultValue': 0.0,
                    'isBindingTarget': true
                },
                'ModelYOffset': {
                    'description': 'Positions the model on a Y offset vs the grid',
                    'baseType': 'NUMBER',
                    'isVisible': true,
                    'defaultValue': 0.0,
                    'isBindingTarget': true
                },
                'EnableQuaternionRotation': {
                    'description': 'Use Quaternions for rotation rather than eulers',
                    'baseType': 'BOOLEAN',
                    'isVisible': true,
                    'defaultValue': false,
                    'isBindingTarget': true
                },
                'BackgroundStyle': {
                    'baseType': 'STYLEDEFINITION',
                    'defaultValue': '',
                    'description': 'The background of the widget. Opacity is supported'
                },
                'OverridenModelChilds': {
                    'baseType': 'INFOTABLE',
                    'defaultValue': '',
                    'description': 'Infotable describing the overriden model child items',
                    'isBindingTarget': true

                },
                'Animations': {
                    'baseType': 'STRING',
                    'defaultValue': '',
                    'description': 'Dump of animation clips to play. See the AnimationClip docs. Must be a json',
                    'isBindingTarget': true

                }
            }
        }
    };

    widgetServices(): Dictionary<TWWidgetService> {
        return {
            "PurgePins": {
                "description": "Can be invoked to clear all placed pins."
            }
        };
    };

    widgetEvents(): Dictionary<TWWidgetEvent> {
        return {
            "LoadDone": {
                "description": "Triggers if model loading was successful.",
                "warnIfNotBound": false
            },
            "LoadError": {
                "description": "Triggers if model loading was not successful.",
                "warnIfNotBound": false
            },
            "PinsPlaced": {
                "description": "Triggers if all pins are placed see TotalPinCount.",
                "warnIfNotBound": false
            }
        };
    }

    renderHtml(): string {
        return '<div class="widget-content widget-model-viewer"></div>';
    };

    afterRender(): void {
    }

    beforeDestroy(): void {
    }

    getSourceDatashape(propertyName): any {
        switch (propertyName) {
            case "SceneTree":
                return {
                    "name": {
                        "name": "name",
                        "baseType": "STRING"
                    },
                    "id": {
                        "name": "id",
                        "baseType": "STRING"
                    },
                    "parentId": {
                        "name": "parentId",
                        "baseType": "STRING"
                    }
                };
            case "PlacedPins":
                return {
                    "position": {
                        "name": "position",
                        "baseType": "STRING"
                    },
                    "rotation": {
                        "name": "rotation",
                        "baseType": "STRING"
                    }
                };
            default:
                break;
        }
    }

}