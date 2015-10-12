/**
 * @author dmarcos / https://github.com/dmarcos
 */

THREE.VRControls = function ( obj, hmd ) {

	this._scale = 1;

	Object.defineProperty( this, 'scale', {
		get: function() { return this._scale; },
		set: function(val) { this._scale = val; }
		});

	this._init = function() {
		var self = this;
		self._vrInput = hmd.getInput();
		self.obj = obj;
	};

	this._init();

	this.setInput = function( input ) {
		this._vrInput = input;
	}

	this.update = function() {
		var obj = this.obj;

		if ( this._vrInput === undefined ) return;

		var state = this._vrInput.getState();

		if ( obj && state.orientation !== null ) {
			obj.quaternion.copy( state.orientation );
		}

		if ( obj && state.position !== null ) {
			obj.position.copy( state.position ).multiplyScalar( this._scale );
		}

	};

	this.getState = function() {
		if ( this._vrInput === undefined ) return null;

		return this._vrInput.getState();
	};

	this.getScale = function() {
		return this.scale;
	};

	this.setScale = function( val ) {
		this.scale = val;
	};

	this.resetSensor = function() {
		if ( this._vrInput === undefined ) return;

		this._vrInput.zeroSensor && this._vrInput.zeroSensor();
	};
	this.zeroSensor = this.resetSensor;

};