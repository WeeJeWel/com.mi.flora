'use strict';

const Homey = require('homey');

class FloraDriver extends Homey.Driver {
	
	setVisibleName(visibleName) {
		this._visibleName = visibleName;
	}
	
	setLocalName(localName) {
		this._localName = localName;
	}
	
	onPair( socket ) {
		socket.on('list_devices', ( data, callback ) => {
			let devices = [];
			const advertisements = Homey.app.getFloraAdvertisements();
			for( let advertisementAddress in advertisements ) {
				let advertisement = advertisements[advertisementAddress];
				if( advertisement.localName !== this._localName ) continue;
				
				devices.push({
					name: this._visibleName,
					data: {
						address: advertisementAddress,
					}
				})
			}
			callback( null, devices );
		})
	}
	
}

module.exports = FloraDriver;