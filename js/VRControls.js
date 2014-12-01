/**
 * @author dmarcos / https://github.com/dmarcos
 */

THREE.VRControls = function ( done ) {

	this.scale = 1;

	this._init = function () {
		var self = this;
		if ( !navigator.getVRDevices ) {
			if ( done ) {
				done("Your browser is not VR Ready");
			}
			return;
		}

		navigator.getVRDevices().then( gotVRDevices );

		function gotVRDevices( devices ) {
			var vrInput;
			var error;
			for ( var i = 0; i < devices.length; ++i ) {
				if ( devices[i] instanceof PositionSensorVRDevice ) {
					vrInput = devices[i]
					self._vrInput = vrInput;
					break; // We keep the first we encounter
				}
			}
			if ( done ) {
				if ( !vrInput ) {
				 error = 'HMD not available';
				}
				done( error );
			}
		}
	};

	this._init();

	this.update = function( obj ) {

		if ( this._vrInput === undefined ) return;

		var state = this._vrInput.getState();

		if ( obj && state.orientation !== null ) {
			obj.quaternion.copy( state.orientation );
		}

		if (obj && state.position !== null ) {
			var pos = new THREE.Vector3()
				.copy( state.position )
				.multiplyScalar( this.scale );

			obj.position.copy( pos );
		}

	};

	this.getState = function() {
		if ( this._vrInput === undefined ) return null;

		return this._vrInput.getState();
	};

	this.getScale = function() {
		return this.scale;
	};

	this.setScale = function(val) {
		this.scale = val;
	};

	this.zeroSensor = function() {

		if ( this._vrInput === undefined ) return;

		this._vrInput.zeroSensor();

	};

};