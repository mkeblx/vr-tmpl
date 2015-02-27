
THREE.VREffect = function ( renderer, hmd ) {

	var cameraLeft = new THREE.PerspectiveCamera();
	var cameraRight = new THREE.PerspectiveCamera();

	this._renderer = renderer;
	this._renderScale = 1.1;

	this.preLeftRender  = function(){ };
	this.preRightRender = function(){ };

	this._init = function() {
		var self = this;

		var vrHMD = hmd.getHMD();
		self._vrHMD = vrHMD;
		self.leftEyeTranslation = vrHMD.getEyeTranslation( "left" );
		self.rightEyeTranslation = vrHMD.getEyeTranslation( "right" );
		self.leftEyeFOV = vrHMD.getRecommendedEyeFieldOfView( "left" );
		self.rightEyeFOV = vrHMD.getRecommendedEyeFieldOfView( "right" );
	};

	this._init();

	this.render = function ( scene, camera, renderTarget, forceClear ) {
		var renderer = this._renderer;
		var vrHMD = this._vrHMD;
		// VR render mode if HMD is available
		if ( vrHMD ) {
			this.renderStereo.apply( this, arguments );
			return;
		}
		// Regular render mode if not HMD
		renderer.render.apply( this._renderer , arguments );
	};

	this.setRenderScale = function ( scale, updateStyle ) {
		updateStyle = updateStyle !== undefined ? updateStyle : true;

		this._renderScale = scale;
		this._renderer.setSize( 1920*this._renderScale, 1080*this._renderScale, updateStyle );
	};

	this.getRenderScale = function( ) {
		return this._renderScale;
	};


	this.renderStereo = function( scene, camera, renderTarget, forceClear ) {

		var renderer = this._renderer;
		var renderWidth = renderTarget ? renderTarget.width : renderer.context.drawingBufferWidth;
		var renderHeight = renderTarget ? renderTarget.height : renderer.context.drawingBufferHeight;
		var eyeDivisionLine = renderWidth / 2;

		if ( camera.parent === undefined ) {
			camera.updateMatrixWorld();
		}

		this.setCamera( camera, 'left' );
		this.setCamera( camera, 'right' );

		if (renderTarget)
			renderer.setRenderTarget( renderTarget );

		// render left eye
		this.preLeftRender();

		crop( 0, 0, eyeDivisionLine, renderHeight );
		renderer.render( scene, cameraLeft, renderTarget, forceClear );

		// render right eye
		this.preRightRender();

		crop( eyeDivisionLine,0, eyeDivisionLine, renderHeight );
		renderer.render( scene, cameraRight, renderTarget, forceClear );

		// restore...
		renderer.setViewport( 0, 0, renderWidth, renderHeight );
		renderer.setScissor( 0, 0, renderWidth, renderHeight );
		renderer.enableScissorTest( false );


		function crop( x, y, w, h ) {
			renderer.setViewport( x, y, w, h );
			renderer.setScissor( x, y, w, h );
			renderer.enableScissorTest( true );
		}
	};

	this.setCamera = function( camera, eye ) {
		if (eye === 'left') {
			cameraLeft.projectionMatrix = this.FovToProjection( this.leftEyeFOV, true, camera.near, camera.far );

			camera.matrixWorld.decompose( cameraLeft.position, cameraLeft.quaternion, cameraLeft.scale );

			cameraLeft.position.add( this.leftEyeTranslation );
		}
		if (eye === 'right') {
			cameraRight.projectionMatrix = this.FovToProjection( this.rightEyeFOV, true, camera.near, camera.far );

			camera.matrixWorld.decompose( cameraRight.position, cameraRight.quaternion, cameraRight.scale );

			cameraRight.position.add( this.rightEyeTranslation );
		}
	};

	this.setFullScreen = function( enable ) {
		var renderer = this._renderer;
		var vrHMD = this._vrHMD;
		var canvasOriginalSize = this._canvasOriginalSize;
		if (!vrHMD) {
			return;
		}
		// If state doesn't change we do nothing
		if ( enable === this._fullScreen ) {
			return;
		}
		this._fullScreen = !!enable;

		// VR Mode disabled
		if ( !enable ) {
			// Restores canvas original size
			renderer.setSize( canvasOriginalSize.width, canvasOriginalSize.height );
			return;
		}
		// VR Mode enabled
		this._canvasOriginalSize = {
			width: renderer.domElement.width,
			height: renderer.domElement.height
		};

		this.startFullscreen();

		//setTimeout( this.setRenderScale.bind( this, this._renderScale ), 1000 );
	};

	this.startFullscreen = function() {
		var self = this;
		var renderer = this._renderer;
		var vrHMD = this._vrHMD;
		var canvas = renderer.domElement;
		var fullScreenChange =
			canvas.mozRequestFullScreen ? 'mozfullscreenchange' : 'webkitfullscreenchange';

		document.addEventListener( fullScreenChange, onFullScreenChanged, false );
		function onFullScreenChanged() {
			if ( !document.mozFullScreenElement && !document.webkitFullscreenElement ) {
				self.setFullScreen( false );
			}
		}
		if ( canvas.mozRequestFullScreen ) {
			canvas.mozRequestFullScreen( { vrDisplay: vrHMD } );
		} else {
			canvas.webkitRequestFullscreen( { vrDisplay: vrHMD } );
		}
	};


	this.FovToNDCScaleOffset = function( fov ) {
		var pxscale = 2.0 / (fov.leftTan + fov.rightTan);
		var pxoffset = (fov.leftTan - fov.rightTan) * pxscale * 0.5;
		var pyscale = 2.0 / (fov.upTan + fov.downTan);
		var pyoffset = (fov.upTan - fov.downTan) * pyscale * 0.5;
		return { scale: [pxscale, pyscale], offset: [pxoffset, pyoffset] };
	};

	this.FovPortToProjection = function( fov, rightHanded /* = true */, zNear /* = 0.01 */, zFar /* = 10000.0 */ ) {
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
	};

	this.FovToProjection = function( fov, rightHanded /* = true */, zNear /* = 0.01 */, zFar /* = 10000.0 */ ) {
		var DEG2RAD = Math.PI / 180.0;

		var fovPort = {
			upTan: Math.tan(fov.upDegrees * DEG2RAD),
			downTan: Math.tan(fov.downDegrees * DEG2RAD),
			leftTan: Math.tan(fov.leftDegrees * DEG2RAD),
			rightTan: Math.tan(fov.rightDegrees * DEG2RAD)
		};
		return this.FovPortToProjection(fovPort, rightHanded, zNear, zFar);
	};

};