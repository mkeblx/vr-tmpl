(function(){
'use strict';

/**
 * The base class for all VR devices.
 */
function VRDevice() {
  this.hardwareUnitId = 'webvr-polyfill hardwareUnitId';
  this.deviceId = 'webvr-polyfill deviceId';
  this.deviceName = 'webvr-polyfill deviceName';
}

/**
 * The base class for all VR position sensor devices.
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();


/**
 * File sensor, for playback of recorded sensor data
 */
function FilePositionSensorVRDevice( options ) {
  this.deviceId = 'pos-sensor:file';
  this.deviceName = 'VR Position Device (pos-sensor:file)';

  this.file = options.file;
  this.data = [];
  this.i = 0;

  this._loadFile( this.file );

  this.hasOrientation = false;
  this.hasPosition    = false;
}
FilePositionSensorVRDevice.prototype = new PositionSensorVRDevice();

FilePositionSensorVRDevice.prototype._loadFile = function( file ) {
  var self = this;

  fetch(file)
    .then(function(resp){ return resp.json() })
    .then(function(resp){
      var data = resp.data;

      var len = data.length;
      for (var i = 0; i < len; i++) {
        var state = data[i];
        self.data.push( state );
      }

      if (len) {
        if (self.data[0].orientation)
          self.hasOrientation = true;
        if (self.data[0].position)
          self.hasPosition = true;
      }

    });
};

/**
 * Returns {orientation: {x,y,z,w}, position: {x,y,z}}.
 */
FilePositionSensorVRDevice.prototype.getState = function() {

  var state = {
    hasOrientation: this.hasOrientation,
    orientation: this.hasOrientation ? this._getOrientation( this.i ) : null,
    hasPosition: this.hasPosition,
    position: this.hasPosition ? this._getPosition( this.i ) : null
  }

  this.i++;
  if (this.i >= this.data.length)
    this.i = 0;

  return state;

};

FilePositionSensorVRDevice.prototype.getImmediateState = function( i ) {
  return this.getState( i );
};

FilePositionSensorVRDevice.prototype.resetSensor = function() {

};

FilePositionSensorVRDevice.prototype._getOrientation = function( i ) {
  var d = this.data[ i ].orientation;

  if (!d) return null;

  var orientation = Array.isArray(d) ?
    { x: d[0], y: d[1], z: d[2], w: d[3] } :
    { x: d.x,  y: d.y,  z: d.z,  w: d.w };

  return orientation;
};

FilePositionSensorVRDevice.prototype._getPosition = function( i ) {
  var d = this.data[ i ].position;

  if (!d) return null;

  var position = Array.isArray(d) ?
    { x: d[0], y: d[1], z: d[2] } :
    { x: d.x,  y: d.y,  z: d.z };

  return position;
};

window.FilePositionSensorVRDevice = FilePositionSensorVRDevice;

})();