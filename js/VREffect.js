
THREE.VREffect = function ( renderer, hmd, cameras ) {

	this.cameraL = cameras[0];
	this.cameraR = cameras[1];

	this.useDistortion = true;

	this._renderer = renderer;

	this._renderScale = 1.1;

	this.preLeftRender  = function(){ };
	this.preRightRender = function(){ };

	this._init = function() {
		var vrHMD = hmd.getHMD();

		if (vrHMD === undefined)
			return;

		this._vrHMD = vrHMD;
	};

	this._init();

	this.render = function( scene, camera, renderTarget, forceClear ) {
		var renderer = this._renderer;
		var vrHMD = this._vrHMD;
		// VR render mode if HMD is available
		if ( vrHMD && this._fullScreen ) {
			this.renderStereo.apply( this, arguments );
			return;
		}
		// Regular render mode if not HMD
		renderer.render.apply( this._renderer , arguments );
	};

	Object.defineProperty( this, 'renderScale', {
		get: function() { return this._renderScale; },
		set: function(val) { this.setRenderScale( val ) }
		});

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
		var renderWidth = renderTarget ? renderTarget.width : renderer.context.drawingBufferWidth / window.devicePixelRatio;
		var renderHeight = renderTarget ? renderTarget.height : renderer.context.drawingBufferHeight / window.devicePixelRatio;
		var eyeDivisionLine = renderWidth / 2;

		if ( camera.parent === undefined ) {
			camera.updateMatrixWorld();
		}

		if ( renderTarget )
			renderer.setRenderTarget( renderTarget );

		renderer.clear();

		// render left eye
		this.preLeftRender();

		crop( 0, 0, eyeDivisionLine, renderHeight );
		renderer.render( scene, this.cameraL, renderTarget, forceClear );

		// render right eye
		this.preRightRender();

		crop( eyeDivisionLine,0, eyeDivisionLine, renderHeight );
		renderer.render( scene, this.cameraR, renderTarget, forceClear );

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
			if ( this.useDistortion )
				canvas.mozRequestFullScreen( { vrDisplay: vrHMD } );
			else
				canvas.mozRequestFullScreen();
		} else {
			if ( this.useDistortion )
				canvas.webkitRequestFullscreen( { vrDisplay: vrHMD } );
			else
				canvas.webkitRequestFullscreen();
		}
	};


};