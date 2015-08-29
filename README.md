VR Three.js template
===================
Using WebVR native browser support

Basic player object that add to scene.

Works with Oculus DK2 when paired with a browser build that supports WebVR.

### Usage

```html
<!-- include scripts -->
<script src="js/webvr-polyfill.js"></script>

<script src="js/VRHMD.js"></script>
<script src="js/VREffect.js"></script>
<script src="js/VRControls.js"></script>

<script src="js/VRPlayerController.js"></script>
```

```js
var renderer;
var scene;

// player object: only manipulate this position & orientation, don't modify camera directly
var player, head;
var initialPos = { x: 0, y: 0, z: 30 };

var vrHMD;
var vrPlayerController;

var options = {
    scale: 1, // eye separation (IPD) scale
    posScale: 10 // positional tracking scale
  };

// detect VR headsets
vrHMD = new THREE.VRHMD( load );

function load( error ) {
  if ( error ) {
    console.log( error );
  }

  init();
  animate();
}

function init() {
  scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 3000 );

  // initialize player controller
  vrPlayerController = new THREE.VRPlayerController( vrHMD, options, renderer, camera );

  player = vrPlayerController.player;

  player.position.copy( initialPos );
  // note: must add player to scene
  scene.add( player );

  // can access head object for attaching a fixed HUD
  // (although generally against best practices)
  // or getting orientation
  head = vrPlayerController.head;
}

function animate( t ){
  requestAnimationFrame( animate );

  var dt = clock.getDelta();

  update( dt );
  render( dt );
}

function update() {
  // player.position = ...

  // updates player head position and orientation based on HMD
  vrPlayerController.update( dt );
}

function render( dt ) {
  vrPlayerController.render( scene );
}

```
### Credits
Three.js : http://github.com/mrdoob/three.js
WebVR polyfill : http://github.com/borismus/webvr-polyfill

