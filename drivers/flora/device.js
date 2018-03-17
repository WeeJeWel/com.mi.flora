'use strict';

const Homey = require('homey');

const POLL_INTERVAL = 1000 * 60 * 15; // 15 min

class FloraDevice extends Homey.Device {
	
	onInit() {		
		this.setUnavailable( 'Not connected' );
		
		this._data = this.getData();
		this._address = this._data.address;
		
		this._driver = this.getDriver();
		
		let advertisement = this._driver.getFloraAdvertisement( this._address )
		if( advertisement ) {
			this._onAdvertisement( advertisement );
		} else {		
			this._driver.once(`advertisement:${this._address}`, this._onAdvertisement.bind(this))
		}
		
		this.log('FloraDevice has been inited', this._address);
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
		this._driver.getFloraDeviceData( this._address )
			.then(({ temperature, luminance, moisture, fertility }) => {
				this.log('Got readings', { temperature, luminance, moisture, fertility })
					
				return Promise.all([
					this.setCapabilityValue('measure_temperature', temperature),
					this.setCapabilityValue('measure_luminance', luminance),
					this.setCapabilityValue('flora_measure_moisture', moisture),
					this.setCapabilityValue('flora_measure_fertility', fertility),
				]);
			})
			.catch( this.error )
	}
	
}

module.exports = FloraDevice;