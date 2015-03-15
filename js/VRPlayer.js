'use strict';

/*
VR Player Controller
*/
THREE.VRPlayer = function( vrHMD, renderer, camera ) {

	this.camera = camera;

	this.cameraLeft  = new THREE.PerspectiveCamera();
	this.cameraRight = new THREE.PerspectiveCamera();


	var head = new THREE.Object3D();
	head.add(this.camera);
	this.head = head;

	var  leftEyeTranslation = vrHMD.getHMD().getEyeTranslation( 'left' );
	var rightEyeTranslation = vrHMD.getHMD().getEyeTranslation( 'right' );

	this.cameraLeft.position.add( leftEyeTranslation ).multiplyScalar( 1 );
	this.cameraRight.position.add( rightEyeTranslation ).multiplyScalar( 1 );
	head.add( this.cameraLeft );
	head.add( this.cameraRight );

	var player = new THREE.Object3D();
	player.add(head);
	this.player = player;


	this.effect = new THREE.VREffect( renderer, vrHMD, [ this.cameraLeft, this.cameraRight ] );


	this.posScale = 10;
	this.controls = new THREE.VRControls( head, vrHMD );
	this.controls.setScale( this.posScale );

	this.scene = null;


	this.update = function() {
		this.controls.update();
	};


	this.render = function(scene) {
		this.effect.render( scene, this.camera );
	};

	this.keydown = function(e) {
		switch (e.keyCode) {
			case 82: // R
				this.controls.resetSensor();
				break;
			case 70: // F
				this.effect.setFullScreen(true);
				break;
			case 219: // [
				if (document.mozFullScreenElement || document.webkitFullscreenElement)
					this.effect.setRenderScale(this.effect.getRenderScale()*1/1.1);
				break;
			case 221: // ]
				if (document.mozFullScreenElement || document.webkitFullscreenElement)
					this.effect.setRenderScale(this.effect.getRenderScale()*1.1);
				break;
			case 188: // <
				this.controls.setScale(this.controls.getScale()*1/1.1);
				break;
			case 190: // >
				this.controls.setScale(this.controls.getScale()*1.1);
				break;
		}

	};

};

