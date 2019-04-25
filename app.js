'use strict';

const Homey = require('homey');

const SCAN_INTERVAL = 1000 * 60 * 1; // 1 min
const DATA_SERVICE_UUID = '0000120400001000800000805f9b34fb';
const DATA_CHARACTERISTIC_UUID = '00001a0100001000800000805f9b34fb';
const REALTIME_CHARACTERISTIC_UUID = '00001a0000001000800000805f9b34fb';
const REALTIME_META_VALUE = Buffer.from([0xA0, 0x1F]);

class FloraApp extends Homey.App {
  
  onInit() {
    this.log('FloraApp has been inited');
    
    this._allowedLocalNames = [];
    this._getFloraDeviceDataPromises = {};
    
    this.scan();
    this._scanInterval = setInterval( this.scan.bind(this), SCAN_INTERVAL );
    
    this._advertisements = {};    
  }
  
  scan() {
    this.log('Scanning for Flora devices...');
    
    Homey.ManagerBLE.discover()
      .then( advertisements => {          
        return advertisements.filter(advertisement => {
          return this._allowedLocalNames.includes(advertisement.localName);
        })
      })
      .then( advertisements => {
        return advertisements.forEach(advertisement => {
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
    if( this._getFloraDeviceDataPromises[advertisementAddress] )
      return this._getFloraDeviceDataPromises[advertisementAddress];
    
    this._getFloraDeviceDataPromises[advertisementAddress] = Promise.resolve().then(async () => {
      this.log('getFloraDeviceData', advertisementAddress)
      
      const advertisement = this._advertisements[advertisementAddress];
      if(!advertisement)
        throw new Error('Invalid Device Address');
      
      this.log('advertisement.connect()');
      const peripheral = await advertisement.connect();    
      const cleanup = () => {
        this.log('cleanup()');
        delete this._getFloraDeviceDataPromises[advertisementAddress];
        peripheral.disconnect().catch(err => {
          this.error('Disconnect error:', err);
        }); 
      }
      
      try {
        this.log('peripheral.discoverServices()');
        const services = await peripheral.discoverServices();
        
        const dataService = services.find(service => service.uuid === DATA_SERVICE_UUID);
        if(!dataService)
          throw new Error('Missing data service');
        
        this.log('dataService.discoverCharacteristics()');
        const dataServiceCharacteristics = await dataService.discoverCharacteristics();
        const dataCharacteristic = dataServiceCharacteristics.find(characteristic => characteristic.uuid === DATA_CHARACTERISTIC_UUID);
        if(!dataCharacteristic)
          throw new Error('Missing data characteristic');
          
        const realtimeCharacteristic = dataServiceCharacteristics.find(characteristic => characteristic.uuid === REALTIME_CHARACTERISTIC_UUID);
        if(!realtimeCharacteristic)
          throw new Error('Missing realtime characteristic');
          
        this.log('realtimeCharacteristic.write()');
        await realtimeCharacteristic.write(REALTIME_META_VALUE);
        
        this.log('dataCharacteristic.read()');
        const dataCharacteristicValue = await dataCharacteristic.read();
        
        cleanup();
        
        this.log('dataCharacteristicValue:', dataCharacteristicValue);
        return dataCharacteristicValue;
      } catch( err ) {
        cleanup();
        throw err;
      }
    });
    
    return this._getFloraDeviceDataPromises[advertisementAddress];
  }
  
}

module.exports = FloraApp;