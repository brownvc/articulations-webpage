/*
Copyright (c) 2011 Doeke de Wolf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function modelviewer() {

// retrieving url parameters
function getUrlParam(name) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regex = new RegExp("[\\?&]"+name+"=([^&#]*)");
  var results = regex.exec(window.location.href);
  if (results == null) return "";
	param = results[1];
	// fix weird bug in chrome that appends / to url if port is specified
	if (param.charAt(param.length-1) == '/') {
		param = param.substr(0, param.length-1);
	}
  return param;
}

var objFilename = getUrlParam('obj');
//var texFilename = getUrlParam('tex');
//var specFilename = getUrlParam('spec');
var bgColor = getUrlParam('bg');

//objFilename = './models/imploding_collada_export.obj';
//texFilename = './models/Laye02DiffuseMap0000.jpg';
//specFilename = './models/Laye02SpecularMap0000.jpg';
objFilename = './models/japanknife.obj';
texFilename = './models/japanknife.jpg';
specFilename = './models/japanknife.jpg';

if (!objFilename) console.error('No object file name was given.');



// initialization
var canvas = document.getElementById('modelviewer');
var statusElem = document.getElementById('statustext');
var renderer = new GLGE.Renderer(canvas);
var mouseInput = new GLGE.MouseInput(canvas);
var keyInput = new GLGE.KeyInput();
var frametimes = [];
var width = 1, height = 1;

// scene

var scene = new GLGE.Scene();
renderer.setScene(scene);

scene.setBackgroundColor('#' + (bgColor || '222'));
scene.setAmbientColor('#aaa');

// object

var object = new GLGE.Wavefront();
object.setSrc(objFilename);
// rotate object to compensate for xy / xz planes\
object.setRot(Math.PI/2, Math.PI/2, 0);
scene.addChild(object);

var object2 = new GLGE.Collada();
object2.setSrc(objFilename);
scene.addChild(object2);

// camera

var camera = new GLGE.Camera();
zoom(); // sets camera to default position
camera.setLookat([0, 0, .02]);
camera.setFovY(35);
camera.updateMatrix();
scene.setCamera(camera);


// lights

var light = new GLGE.Light();
light.setLoc(1, 2, 2); // y x z
light.setType(GLGE.L_POINT);
light.setColor('#fff');
light.setAttenuation(1.5, 0.00000001, 0.00001);
scene.addChild(light);



// intialization


var loaded = false;
var zoffset = 0;

// called when object is actually loaded
function onLoad() {	
	// first rescale to normalize for size
	var bvol = object.getBoundingVolume();
	var sx = bvol.limits[1] - bvol.limits[0];
	var sy = bvol.limits[3] - bvol.limits[2];
	var sz = bvol.limits[5] - bvol.limits[4];
	var scale = 1 / Math.max(sx, sy, sz);
	object.setScale(scale, scale, scale);
	
	centerObject();
	
	// load color texture
	if (texFilename) {
	//if (false) {
		var tex = new GLGE.Texture;
		tex.setSrc(texFilename);
		var mat = object.getMaterial();
		mat.addTexture(tex);
		var layer = mat.getLayers()[0];
		if (!layer) {
			layer = new GLGE.MaterialLayer;
			layer.setTexture(tex);
			layer.setMapto(GLGE.M_COLOR);
			layer.setMapinput(GLGE.UV1);
			mat.addMaterialLayer(layer);
			mat.setAlpha(1);
		} else {
			layer.setTexture(tex);
		}
	}
	
	// load spec texture
	if (specFilename) {
	//if (false) {
		var tex = new GLGE.Texture;
		tex.setSrc(specFilename);
		var mat = object.getMaterial();
		mat.addTexture(tex);
		var colorlayer = mat.getLayers()[0];
		var layer = new GLGE.MaterialLayer(colorlayer); // clone instance from color layer
		layer.setTexture(tex);
		layer.setMapto(GLGE.M_SPECULAR);
		mat.addMaterialLayer(layer);
	}
	
	console.log('onload', object);
	//object.drawType = GLGE.DRAW_LINELOOPS;
}





// update fps text
function updateFps(fps) {
	statusElem.innerText = objFilename + '   ' + fps.toFixed(1) + ' fps';
}


// center object

var panX = 0, panY = 0;
function centerObject() {
	object.setLoc(0, 0, 0);
	var bvol = object.getBoundingVolume();
	object.setLoc(-bvol.center[0] - panX, -bvol.center[1], -bvol.center[2] - panY);
}



// mouse dragging

var dragging = false;
var shiftDragging = false;
var ctrlDragging = false;
var hasDragged = false;
var prevMousePos = mouseInput.getMousePosition();

canvas.onmousedown = function(ev) {
	if (ev.button != 0) return;
	hasDragged = true;
	if (keyInput.isKeyPressed(GLGE.KI_SHIFT)) {
		shiftDragging = true;
	} else if (keyInput.isKeyPressed(GLGE.KI_CTRL)) {
		ctrlDragging = true;
	} else {
		dragging = true;
	}
	prevMousePos = mouseInput.getMousePosition();
};

document.onmouseup = function(ev) {
	dragging = shiftDragging = ctrlDragging = false;
}


// mouse wheel zooming

function wheel(event){
	var delta = 0;
	if (!event) event = window.event;
	if (event.wheelDelta) {
		delta = event.wheelDelta/120; 
		if (window.opera) delta = -delta;
	} else if (event.detail) {
		delta = -event.detail/3;
	}
	if (delta)
		onscroll(delta);
        if (event.preventDefault)
                event.preventDefault();
        event.returnValue = false;
}
	
if (window.addEventListener)
	window.addEventListener('DOMMouseScroll', wheel, false);
window.onmousewheel = document.onmousewheel = wheel;

function onscroll(delta) { zoom(delta); }


// zooming

function zoom(delta) {
	var y = camera.getLocY()
	y -= y * delta / 20;
	y = Math.min(20, Math.max(1, y));
	if (!delta) y = 1.9; // default position
	camera.setLoc(0, y, y / 7);
	
}

// panning
function pan(dx, dy) {
	var zoomlevel = camera.getLocY()
	var factor = .005 * zoomlevel;
	panX += dx * factor;
	panY += dy * factor;
	panX = Math.max(-2, Math.min(2, panX));
	panY = Math.max(-2, Math.min(2, panY));
	centerObject();
}


// rendering

function render() {
	if (object.loading) return; // has not loaded yet
	
	// check if loaded
	if (!loaded) {
		loaded = true;
		onLoad();
	}
	
	// slowly rotate
	if (!hasDragged) {
		var a = object.getRotY() + .01;
		object.setRotY(a);
		centerObject();
	}
	
	// zooming
	if (keyInput.isKeyPressed(GLGE.KI_C)) zoom(1);
	if (keyInput.isKeyPressed(GLGE.KI_X)) zoom(-1);
	
	// panning
	if (keyInput.isKeyPressed(GLGE.KI_LEFT_ARROW)) pan(-1, 0);
	if (keyInput.isKeyPressed(GLGE.KI_RIGHT_ARROW)) pan(1, 0);
	if (keyInput.isKeyPressed(GLGE.KI_UP_ARROW)) pan(0, -1);
	if (keyInput.isKeyPressed(GLGE.KI_DOWN_ARROW)) pan(0, 1);
	
	
	// mouse dragging
	if (!mouseInput.isButtonDown(GLGE.MI_LEFT))
		dragging = shiftDragging = ctrlDragging = false;
	
	
	var mousePos = mouseInput.getMousePosition();
	var dx = mousePos.x - prevMousePos.x;
	var dy = mousePos.y - prevMousePos.y;
	prevMousePos = mousePos;
	
	if (dragging) { // rotating
		var roty = object.getRotY() + dx * 10 / width;
		object.setRotY(roty % (Math.PI * 2));
		var rotx = object.getRotX() - dy * 10 / height;
		object.setRotX(rotx % (Math.PI * 2));		
		// adjust pos for rotations
		centerObject();
	} else if (shiftDragging) { // panning
		var factor = 370 / (width + height);
		pan(dx * factor, dy * factor);
	} else if (ctrlDragging) { // zooming
		if (dy + dx) zoom((dy + dx) * 100 / (width + height));
	}
	
	// detect window resizing
	var w = canvas.clientWidth;
	var h = canvas.clientHeight;
	if (w != width || h != height) {
		//renderer = new GLGE.Renderer(canvas);
		//renderer.setScene(scene);
		canvas.width = w;
		canvas.height = h;
		renderer.setViewportWidth(w);
		renderer.setViewportHeight(h);
		width = w;
		height = h;
		camera.setAspect(w / h);
	}
	
	// update statustext
	var len = frametimes.length;
	if (len == 0) { // model viewer was just started
		updateFps(0);
	} else if (len >= 30) {
		var fps = (frametimes.pop() - frametimes.shift()) / len;
		updateFps(fps);
		frametimes = [];
	}
	frametimes.push((new Date).getTime());

	
	// render
	renderer.render();
}

setInterval(render, 1000/60.);










}



