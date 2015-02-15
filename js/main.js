'use strict';

var clock = new THREE.Clock();

var renderer, element;
var camera, scene;

var player, head;

var fullScreenButton;

var vrEffect;

var vrControls;
var posScale = 500;

var objects = [];


var has = {
	WebVR: !!navigator.getVRDevices
};


window.addEventListener('load', load);

function load() {
	init();
	animate();
}


function init() {
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);

	fullScreenButton = document.querySelector('#vr-button');

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xffffff, 0, 1500);

	player = new THREE.Object3D();
	head = new THREE.Object3D();

	head.add(camera);
	player.add(head);
	scene.add(player);

	setupRendering();

	setupWorld();
	setupLights();

	setupControls();
	setupEvents();
}


function setupWorld() {

	// floor
	var geometry = new THREE.PlaneGeometry(2000, 2000, 1, 1);
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

	var texture = THREE.ImageUtils.loadTexture('textures/checker.png');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;

	texture.repeat = new THREE.Vector2(20, 20);

	var material = new THREE.MeshBasicMaterial( { color: 0xcccccc, map: texture } );

	var mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = true;

	//scene.add(mesh);


	// cubes
	geometry = new THREE.BoxGeometry(30, 30, 30);

	for (var i = 0; i < 500; i ++) {

		var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

		object.material.ambient = object.material.color;

		object.position.x = Math.random() * 2000 - 1000;
		object.position.y = Math.random() * 1000 - 500;
		object.position.z = Math.random() * 2000 - 1000;

		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		object.scale.x = Math.random() * 2 + 1;
		object.scale.y = Math.random() * 2 + 1;
		object.scale.z = Math.random() * 2 + 1;

		object.castShadow = true;
		object.receiveShadow = true;

		scene.add(object);

		objects.push(object);
	}
}

function setupLights() {
	var light = new THREE.DirectionalLight(0xffffff, 1.5);
	light.position.set(1, 1, 1);
	scene.add(light);

	light = new THREE.DirectionalLight(0xffffff, 0.75);
	light.position.set(-1, -0.5, -1);
	scene.add(light);

	light = new THREE.AmbientLight(0x666666);
	scene.add(light);
}

function setupRendering() {
	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor(0xffffff, 0);

	function VREffectLoaded(error) {
		if (error) {
			fullScreenButton.innerHTML = error;
			fullScreenButton.classList.add('error');
		}
	}

	var config = {  };

	renderer.setSize(window.innerWidth, window.innerHeight);
	vrEffect = new THREE.VREffect(renderer, VREffectLoaded, config);

	element = renderer.domElement;
	document.body.appendChild(element);
}

function setupControls() {
	vrControls = new THREE.VRControls();
	vrControls.setScale(posScale);

	function setOrientationControls(e) {
		if (!e.alpha) {
			return;
		}

		vrControls = new THREE.DeviceOrientationControls(camera, true);
		vrControls.connect();
		vrControls.update();

		renderer.domElement.addEventListener('click', fullscreen, false);

		window.removeEventListener('deviceorientation', setOrientationControls, true);
	}
	window.addEventListener('deviceorientation', setOrientationControls, true);
}

function setupEvents() {
	window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('keydown', keyDown, false);

	fullScreenButton.addEventListener('click', function(){
		vrEffect.setFullScreen(true);
	}, true);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

// for mobile
function fullscreen() {
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element.msRequestFullscreen) {
		element.msRequestFullscreen();
	} else if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	}
}

function keyDown(e) {

	console.log(e.keyCode);
	switch (e.keyCode) {
		case 82: // R
			vrControls.zeroSensor();
			break;
		case 70: // F
			vrEffect.setFullScreen(true);
			break;
		case 219: // [
			if (document.mozFullScreenElement || document.webkitFullscreenElement)
				vrEffect.setRenderScale(vrEffect.getRenderScale()*1/1.1);
			break;
		case 221: // ]
			if (document.mozFullScreenElement || document.webkitFullscreenElement)
				vrEffect.setRenderScale(vrEffect.getRenderScale()*1.1);
			break;
		case 188: // <
			vrControls.setScale(vrControls.getScale()*1/1.1);
			break;
		case 190: // >
			vrControls.setScale(vrControls.getScale()*1.1);
			break;
	}

}

function animate(t) {
	requestAnimationFrame(animate);

	var dt = clock.getDelta();

	update(dt);
	render(dt);
}

function update(dt) {
	vrControls.update(head);
}

function render(dt) {
	vrEffect.render(scene, camera);
}
