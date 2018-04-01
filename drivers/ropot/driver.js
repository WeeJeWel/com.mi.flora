'use strict';

const Homey = require('homey');
const FloraDriver = require('../../lib/FloraDriver.js');

class FloraDriverStick extends FloraDriver {
	
	onInit() {
		this.setLocalName('ropot');
		this.setVisibleName('Mi Flora Ropot');
		Homey.app.registerLocalName( this._localName );
	}
	
}

module.exports = FloraDriverStick;