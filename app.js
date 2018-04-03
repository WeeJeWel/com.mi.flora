'use strict';

const Homey = require('homey');

const SCAN_INTERVAL = 1000 * 60 * 1; // 1 min
const DATA_SERVICE_UUID = '0000120400001000800000805f9b34fb';
const DATA_CHARACTERISTIC_UUID = '00001a0100001000800000805f9b34fb';
const FIRMWARE_CHARACTERISTIC_UUID = '00001a0200001000800000805f9b34fb';
const REALTIME_CHARACTERISTIC_UUID = '00001a0000001000800000805f9b34fb';
const REALTIME_META_VALUE = Buffer.from([0xA0, 0x1F]);

class FloraApp extends Homey.App {
	
	onInit() {
		this.log('FloraApp has been inited');
		
		this._allowedLocalNames = [];
		
		this.scan();
		this._scanInterval = setInterval( this.scan.bind(this), SCAN_INTERVAL );
		
		this._advertisements = {};		
	}
	
	scan() {
		this.log('Scanning for Flora devices...');
		
		Homey.ManagerBLE.discover()
			.then( advertisements => {
				if( advertisements.length === 0 )
					this.log('Found no devices');
					
				return advertisements.filter(advertisement => {
					return this._allowedLocalNames.includes(advertisement.localName);
				})
			})
			.then( advertisements => {
				advertisements.forEach(advertisement => {
					if( this._advertisements[advertisement.address] ) return;
					
					this.log('Found a device', advertisement.address, advertisement.localName);
					
					this._advertisements[advertisement.address] = advertisement;
					
					process.nextTick(() => {
						this.emit('advertisement', advertisement);
						this.emit(`advertisement:${advertisement.address}`, advertisement)
					});
				})
			})
			.catch( this.error )
		
	}
	
	registerLocalName( name ) {
		this._allowedLocalNames.push( name );
	}
	
	getFloraAdvertisements() {
		return this._advertisements;
	}
	
	getFloraAdvertisement( advertisementAddress ) {
		return this._advertisements[advertisementAddress];
	}
	
	async getFloraDeviceData( advertisementAddress ) {
		let advertisement = this._advertisements[advertisementAddress];
		if( !advertisement ) throw new Error('Invalid Device Address');
		
		let disconnect = function(){};
		
		return advertisement.connect()
			.then( peripheral => {
				
				disconnect = () => {
					process.nextTick(() => {
						try {
							peripheral.disconnect(() => {})
						} catch( err ) {
							this.error( err );
						}
					})
				}
				
				return peripheral.discoverServices();
			})
			.then( services => {
				for( let i = 0; i < services.length; i++ ) {
					let service = services[i];
					if( service.uuid === DATA_SERVICE_UUID ) return service;
				}
				throw new Error('Missing data service');
			})
			.then( dataService => {
				return dataService.discoverCharacteristics();
			})
			.then( characteristics => {
				
				let dataCharacteristic;
				let firmwareCharacteristic;
				
				for( let i = 0; i < characteristics.length; i++ ) {
					let characteristic = characteristics[i];					
					if( characteristic.uuid === DATA_CHARACTERISTIC_UUID )
						dataCharacteristic = characteristic;
					else if( characteristic.uuid === FIRMWARE_CHARACTERISTIC_UUID )
						firmwareCharacteristic = characteristic;
				}
				
				// for this to work, we must first enable realtime data
				for( let i = 0; i < characteristics.length; i++ ) {
					let characteristic = characteristics[i];						
					if( characteristic.uuid === REALTIME_CHARACTERISTIC_UUID )
						return characteristic.write(REALTIME_META_VALUE).then(() => {
							if( !dataCharacteristic )
								throw new Error('Missing data characteristic');

							if( !firmwareCharacteristic )
								throw new Error('Missing firmware characteristic');

							return [dataCharacteristic, firmwareCharacteristic];
						})
				}
				throw new Error('Missing data & realtime characteristic');
			})
			.then( characteristic => {
				return Promise.all([characteristic[0].read(), characteristic[1].read()]);
			})
			.then( data => {
				disconnect();
				return data;
			})
			.catch( err => {
				disconnect();
				throw err;
			})
	}
	
}

module.exports = FloraApp;