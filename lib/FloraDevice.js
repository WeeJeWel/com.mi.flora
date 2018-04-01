'use strict';

const Homey = require('homey');

const POLL_INTERVAL = 1000 * 60 * 15; // 15 min

class FloraDevice extends Homey.Device {
	
	onInit() {		
		this.setUnavailable('Not connected');
		
		this._data = this.getData();
		this._address = this._data.address;
				
		let advertisement = Homey.app.getFloraAdvertisement( this._address )
		if( advertisement ) {
			this._onAdvertisement( advertisement );
		} else {		
			Homey.app.once(`advertisement:${this._address}`, this._onAdvertisement.bind(this))
		}
		
		this.log(`${this.constructor.name} has been inited`, this._address);
	}
	
	onDeleted() {
		if( this._pollInterval ) clearInterval(this._pollInterval);
	}
	
	_onAdvertisement( advertisement ) {
		this._pollInterval = setInterval(this._poll.bind(this), POLL_INTERVAL);
		this._poll();
		this.setAvailable();
	}
	
	_poll() {		
		Homey.app.getFloraDeviceData( this._address )
			.then(data => this._onData(data))			
			.catch( this.error )
	}
	
	_onData() {
		throw new Error('Not implemented');
	}
	
}

module.exports = FloraDevice;