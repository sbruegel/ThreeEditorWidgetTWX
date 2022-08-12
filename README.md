# Three Editor for Thingworx

## Usage

The Three Editor widget is based on [three.js](http://threejs.org/) and is capable of displaying and interact with 3D models in various formats inside a Thingworx mashup. For a list of all the supported formats, please look at _CompatibleModels.ods_ file.

### How to get set up

* Import last version from [releases](/releases/latest) 
* Use the *Three Editor* widget in a mashup
* On the widgets, configure them according to the documentation
* To build the importable zip extension see [here](#setup-environment). 

### Developing

You can easily change what happens when a model is loaded. By default, it is either added to the scene *this.addObjectCommand* or it is a scene so it's just rendered *this.setSceneCommand*. So you can pass a callback to the Loader.loadFile that specifies what is happened after the file is loaded.

#This Extension is provided as-is and without warranty or support. It is not part of the PTC product suite. This project is licensed under the terms of the MIT license

### Setup Environment

First of all you need to have nodejs installed on your system, to be able to use npm.
You can see in this project we have a package.json, this defines us all necessary packages we need to start development.

Open the project folder in terminal and execute **npm install**

After doing so you notice that we are using TypeScript and Webpack in this Project
The following scripts are defined:

- **build** (builds the extension minified)
- **watch** (watches the source files, and whenever they change, do a build)
- **server** (??)
- **upload** (Uploads the extension to a Thingworx Server configured in credentials.json)
- **init** (rename the .ide.ts, .runtime.ts in src to the Package Name defined in package.json and do a dev build, not recommanded to execute till too much other files and functions need to renamed)

For more details about he build process see [demoWebpackWidget](http://roicentersvn/placatus/DemoWebpackWidget).

run them by using **npm run SCRIPT**

`npm run build`


### Use the upload build script

This wonderful entry point of a webpack script gives you the ability to build and directly upload the Widget to Thingworx. If widget is already installed it will firstly delete the last revision!

if not already created please create a **credentials.json** in the root of this project. Because of security reasons it is not part of this repo and will be excluded by gitignore!

```
{
    "thingworxServer": "https://ServerNameWithoutThingworx:8080",
    "thingworxUser": "Administrator",
    "thingworxPassword": "pwString"
}
```

`npm run upload`
