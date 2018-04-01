'use strict';

const FloraDevice = require('../../lib/FloraDevice.js');

class FloraDeviceRopot extends FloraDevice {
	
	async _onData( data ) {
		let temperature = data.readUInt16LE(0) / 10;
		let moisture = data.readUInt16BE(6);
		let fertility = data.readUInt16LE(8);
		
		this.log('Got readings', { temperature, moisture, fertility });
			
		return Promise.all([
			this.setCapabilityValue('measure_temperature', temperature),
			this.setCapabilityValue('flora_measure_moisture', moisture),
			this.setCapabilityValue('flora_measure_fertility', fertility),
		]);
	}
	
}

module.exports = FloraDeviceRopot;