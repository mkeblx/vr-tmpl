
THREE.VRHMD = function ( done ) {

	this._init = function() {
		var self = this;
		if ( !navigator.getVRDevices ) {
			if ( done ) {
				done("Your browser is not VR Ready");
			}
			return;
		}

		navigator.getVRDevices().then( gotVRDevices );

		function gotVRDevices( devices ) {
			var vrHMD;
			var vrInput;
			var error;

			for ( var i = 0; i < devices.length; ++i ) {
				if ( devices[i] instanceof HMDVRDevice ) {
					vrHMD = devices[i];
					self._vrHMD = vrHMD;

					self.leftEyeTranslation = vrHMD.getEyeTranslation( "left" );
					self.rightEyeTranslation = vrHMD.getEyeTranslation( "right" );
					self.leftEyeFOV = vrHMD.getRecommendedEyeFieldOfView( "left" );
					self.rightEyeFOV = vrHMD.getRecommendedEyeFieldOfView( "right" );

					break; // We keep the first we encounter
				}
			}

			for ( var i = 0; i < devices.length; ++i ) {
				if ( devices[i] instanceof PositionSensorVRDevice ) {
					vrInput = devices[i]
					self._vrInput = vrInput;

					break; // We keep the first we encounter
				}
			}

			if ( done ) {
				if ( !vrHMD ) {
					error = 'HMD not available';
				}
				done( error );
			}
		}
	};

	this._init();

	this.getHMD = function() {
		return this._vrHMD;
	}

	this.getInput = function() {
		return this._vrInput;
	}

};
