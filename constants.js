export const XSENS_DOT_LOCALNAME = 'Xsens DOT'

export const BLE_STATES = {
	POWERED_ON: 'poweredOn',
	POWERED_OFF: 'poweredOff',
	RESETTING: 'resetting',
	UNSUPPORTED: 'unsupported',
	UNKNOWN: 'unknown',
	UNAUTHORIZED: 'unauthorized',
}

export const PERIPHERAL_STATES = {
	CONNECTED: 'connected',
	CONNECTING: 'connecting',
	DISCONNECTED: 'disconnected',
}

export const XSENS_DOT_BLE = {
	configuration: {
		uuid: '15171000494711e98646d663bd873d93',
		uuidShort: '1000',
		characteristics: [],
	},
	measurement: {
		uuid: '15172000494711e98646d663bd873d93',
		uuidShort: '2000',
		characteristics: [],
	},
	battery: {
		uuid: '15173000-4947-11e9-8646-d663bd873d93',
		uuidShort: '3000',
		characteristics: [
			'0x3001', // battery
		],
	},
	unknown1: {
		uuid: '15174000494711e98646d663bd873d93',
		uuidShort: '4000',
	},
	unknown2: {
		uuid: '15175000494711e98646d663bd873d93',
		uuidShort: '5000',
	},
	crash: {
		uuid: '15176000494711e98646d663bd873d9',
		uuidShort: '6000',
		characteristics: [],
	},
	message: {
		uuid: '15177000494711e98646d663bd873d93',
		uuidShort: '7000',
		characteristics: [],
	},
}
