/**
 * @author dmarcos / https://github.com/dmarcos
 */

THREE.VRControls = function ( obj, hmd ) {

	this.scale = 1;

	this._init = function () {
		var self = this;
		self._vrInput = hmd.getInput();
		self.obj = obj;
	};

	this._init();

	this.update = function( ) {
		var obj = this.obj;

		if ( this._vrInput === undefined ) return;

		var state = this._vrInput.getState();

		if ( obj && state.orientation !== null ) {
			obj.quaternion.copy( state.orientation );
		}

		if (obj && state.position !== null ) {
			obj.position.copy( state.position ).multiplyScalar( this.scale );
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

		this._vrInput.zeroSensor && this._vrInput.zeroSensor();
	};

};