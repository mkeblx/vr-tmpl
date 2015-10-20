'use strict';

var clock = new THREE.Clock();

var renderer, element;
var camera, scene;

var player, head;
var initialPos = { x: 0, y: 0, z: 30 };
var moving = false;

var vrHMD;
var vrPlayerController;

var objects = [];
var cubes;
var raycaster, INTERSECTED;

var options = {
		scale: 1,
		posScale: 10
	};


vrHMD = new VRHMD( load );

var fileSensor;

var loader = new THREE.TextureLoader();

var useDistortion = true;
document.getElementById('distortion-toggle').addEventListener('click', function(event){
		useDistortion = !useDistortion;

		window.e = event.target.innerHTML = useDistortion ? 'Distortion' : 'No Distortion';
	}, false);


function load(error) {
	var fullScreenButton = document.getElementById('enter-vr');

	if (error) {
		fullScreenButton.innerHTML = error;
		fullScreenButton.classList.add('error');

		console.log(error);
	}

	fullScreenButton.addEventListener('click', function(){
		vrPlayerController.effect.useDistortion = useDistortion;

		vrPlayerController.effect.setFullScreen(true);
	}, false);


	init();
	animate();
}


function init() {

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xffffff, 0, 1500);

	raycaster = new THREE.Raycaster();

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);


	setupRendering();

	console.log( vrHMD );

	vrPlayerController = new THREE.VRPlayerController( vrHMD, options, renderer, camera );

	player = vrPlayerController.player;
	scene.add(player);
	player.position.copy(initialPos);

	head = vrPlayerController.head;
	var cursor = new THREE.Mesh(
		new THREE.SphereGeometry(0.04),
		new THREE.MeshBasicMaterial({ color: 0x3366ff }) );
	cursor.position.set(0,0,-5);
	head.add(cursor);

	setupWorld();
	setupLights();

	setupEvents();

	fileSensor = new FilePositionSensorVRDevice({
		file: 'data/sensor-data.json'
	});
}


function setupWorld() {

	// floor
	var geometry = new THREE.PlaneGeometry(2000, 2000, 1, 1);
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

	var texture = loader.load('textures/checker.png');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;

	texture.repeat = new THREE.Vector2(20, 20);

	var material = new THREE.MeshBasicMaterial( { color: 0xcccccc, map: texture } );

	var mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = true;

	//scene.add(mesh);

	// cubes
	cubes = new THREE.Object3D();

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

		//object.castShadow = true;
		//object.receiveShadow = true;

		cubes.add(object);

		objects.push(object);
	}

	var s = 1/50;
	cubes.scale.set(s,s,s);
	scene.add(cubes);
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
	renderer.setClearColor( 0xffffff );

	var U = 256;
	//renderer.setSize(U*2, U);
	renderer.setSize(window.innerWidth, window.innerHeight);

	element = renderer.domElement;
	document.body.appendChild(element);
}


function setupEvents() {
	//window.addEventListener('resize', onWindowResize, false);
	document.addEventListener('keydown', keyDown, false);

	element.addEventListener('click', function(event){

		if (document.webkitFullscreenElement || document.mozFullScreenElement) {
			console.log('click');

			if ( INTERSECTED ) {
				// TODO: more satisfying... animate+audio
				cubes.remove( INTERSECTED );
			}
		}

	}, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}


function keyDown(e) {

	console.log(e.keyCode);
	switch (e.keyCode) {
		case 32: // space
			moving = !moving;
			break;
		case 68: // d
			if (INTERSECTED) cubes.remove(INTERSECTED);
			break;
	}

	vrPlayerController.keydown(e);

}

function animate(t) {
	requestAnimationFrame(animate);

	var dt = clock.getDelta();

	update(dt);
	render(dt);
}

function update(dt) {
	var pos = head.getWorldPosition();
	var rot = head.getWorldQuaternion();

  var dir = new THREE.Vector3(0,0,-1);
  dir = dir.applyQuaternion( rot );

	raycaster.set( pos, dir );

	var intersects = raycaster.intersectObjects( objects, false );

	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
			INTERSECTED.material.emissive.setHex( 0xff0000 );
		}
	} else {
		if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

		INTERSECTED = null;
	}

	if (moving)
		player.position.z -= 0.3*dt;

	if (player.position.z < -15) {
		player.position.copy(initialPos);
	}

	vrPlayerController.update(dt);
}

function render(dt) {
	vrPlayerController.render(scene);
}
