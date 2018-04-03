'use strict';

const FloraDevice = require('../../lib/FloraDevice.js');

class FloraDeviceRopot extends FloraDevice {
	
	async _onData( data ) {
		let temperature = data[0].readUInt16LE(0) / 10;
		let moisture = data[0].readUInt16BE(6);
		let fertility = data[0].readUInt16LE(8);
		let batteryLevel = parseInt(data[1].toString('hex', 0, 1), 16);
		let firmwareVersion = data[1].toString('ascii', 2, data[1].length);

		this.log('Got readings', { temperature, moisture, fertility, batteryLevel, firmwareVersion });
			
		return Promise.all([
			this.setCapabilityValue('measure_battery', batteryLevel),
			this.setCapabilityValue('measure_temperature', temperature),
			this.setCapabilityValue('flora_measure_moisture', moisture),
			this.setCapabilityValue('flora_measure_fertility', fertility),
		]);
	}
	
}

module.exports = FloraDeviceRopot;