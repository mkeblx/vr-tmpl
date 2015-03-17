'use strict';

/*
VR Player Controller
*/
THREE.VRPlayerController = function( vrHMD, renderer, camera ) {

	this.camera = camera;

	this.cameraLeft  = new THREE.PerspectiveCamera();
	this.cameraRight = new THREE.PerspectiveCamera();

	//console.log( vrHMD );

	var HMD = vrHMD.getHMD();
	var input = vrHMD.getInput();

	var  leftEyeTranslation = HMD.getEyeTranslation( 'left' );
	var rightEyeTranslation = HMD.getEyeTranslation( 'right' );

	var  leftEyeFOV = HMD.getRecommendedEyeFieldOfView( 'left' );
	var rightEyeFOV = HMD.getRecommendedEyeFieldOfView( 'right' );

	this._init = function() {

		//this.setCamera( camera, 'left', leftEyeFOV );
		//this.setCamera( camera, 'right', rightEyeFOV );
		this.cameraLeft.projectionMatrix  = this.FovToProjection( leftEyeFOV, true, camera.near, camera.far );
		this.cameraRight.projectionMatrix = this.FovToProjection( rightEyeFOV, true, camera.near, camera.far );

		var head = new THREE.Object3D();
		head.add(this.camera);
		this.head = head;


		var scale = 1;
		this.cameraLeft.position.copy( leftEyeTranslation ).multiplyScalar( scale );
		this.cameraRight.position.copy( rightEyeTranslation ).multiplyScalar( scale );
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

	};

	this._init();


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
					this.effect.renderScale = this.effect.renderScale * 1/1.1;
				break;
			case 221: // ]
				if (document.mozFullScreenElement || document.webkitFullscreenElement)
					this.effect.renderScale = this.effect.renderScale * 1.1;
				break;
			case 188: // <
				this.controls.scale = this.controls.scale * 1/1.1;
				break;
			case 190: // >
				this.controls.scale = this.controls.scale * 1.1;
				break;
		}

	};

	this.setCamera = function( camera, eye, eyeFOV ) {
		var eyeCam = eye === 'left' ? this.cameraLeft : this.cameraRight;
		//var eyeFOV = eye === 'left' ? this.leftEyeFOV	: this.rightEyeFOV;

		eyeCam.projectionMatrix = this.FovToProjection( eyeFOV, true, camera.near, camera.far );
	};

};

THREE.VRPlayerController.prototype = {

	FovToNDCScaleOffset: function( fov ) {
		var pxscale = 2.0 / (fov.leftTan + fov.rightTan);
		var pxoffset = (fov.leftTan - fov.rightTan) * pxscale * 0.5;
		var pyscale = 2.0 / (fov.upTan + fov.downTan);
		var pyoffset = (fov.upTan - fov.downTan) * pyscale * 0.5;
		return { scale: [pxscale, pyscale], offset: [pxoffset, pyoffset] };
	},

	FovPortToProjection: function( fov, rightHanded /* = true */, zNear /* = 0.01 */, zFar /* = 10000.0 */ ) {
		rightHanded = rightHanded === undefined ? true : rightHanded;
		zNear = zNear === undefined ? 0.01 : zNear;
		zFar = zFar === undefined ? 10000.0 : zFar;

		var handednessScale = rightHanded ? -1.0 : 1.0;

		// start with an identity matrix
		var mobj = new THREE.Matrix4();
		var m = mobj.elements;

		// and with scale/offset info for normalized device coords
		var scaleAndOffset = this.FovToNDCScaleOffset(fov);

		// X result, map clip edges to [-w,+w]
		m[0*4+0] = scaleAndOffset.scale[0];
		m[0*4+1] = 0.0;
		m[0*4+2] = scaleAndOffset.offset[0] * handednessScale;
		m[0*4+3] = 0.0;

		// Y result, map clip edges to [-w,+w]
		// Y offset is negated because this proj matrix transforms from world coords with Y=up,
		// but the NDC scaling has Y=down (thanks D3D?)
		m[1*4+0] = 0.0;
		m[1*4+1] = scaleAndOffset.scale[1];
		m[1*4+2] = -scaleAndOffset.offset[1] * handednessScale;
		m[1*4+3] = 0.0;

		// Z result (up to the app)
		m[2*4+0] = 0.0;
		m[2*4+1] = 0.0;
		m[2*4+2] = zFar / (zNear - zFar) * -handednessScale;
		m[2*4+3] = (zFar * zNear) / (zNear - zFar);

		// W result (= Z in)
		m[3*4+0] = 0.0;
		m[3*4+1] = 0.0;
		m[3*4+2] = handednessScale;
		m[3*4+3] = 0.0;

		mobj.transpose();

		return mobj;
	},

	FovToProjection: function( fov, rightHanded /* = true */, zNear /* = 0.01 */, zFar /* = 10000.0 */ ) {
		var DEG2RAD = Math.PI / 180.0;

		var fovPort = {
			upTan: Math.tan(fov.upDegrees * DEG2RAD),
			downTan: Math.tan(fov.downDegrees * DEG2RAD),
			leftTan: Math.tan(fov.leftDegrees * DEG2RAD),
			rightTan: Math.tan(fov.rightDegrees * DEG2RAD)
		};
		return this.FovPortToProjection(fovPort, rightHanded, zNear, zFar);
	}


};

