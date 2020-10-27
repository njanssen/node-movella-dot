export const XSENS_DOT_LOCALNAME = 'Xsens DOT'

export const BLE_STATES = {
	poweredOn: 'poweredOn',
	poweredOff: 'poweredOff',
	resetting: 'resetting',
	unsupported: 'unsupported',
	unknown: 'unknown',
	unauthorized: 'unauthorized',
}

export const PERIPHERAL_STATES = {
	connected: 'connected',
	connecting: 'connecting',
	disconnected: 'disconnected',
	disconnecting: 'disconnecting',
}

export const XSENS_DOT_SPEC = {
	configuration: {
		uuid: '15171000494711e98646d663bd873d93',
		characteristics: [],
	},
	measurement: {
		uuid: '15172000494711e98646d663bd873d93',
		characteristics: {
			control : "15172001494711e98646d663bd873d93"
		}
	},
	battery: {
		uuid: '15173000494711e98646d663bd873d93',
		characteristics: {
			battery : '15173001494711e98646d663bd873d93', // Read, Notify
		},
	},
	unknown1: {
		uuid: '15174000494711e98646d663bd873d93',
		characteristics: [],
	},
	unknown2: {
		uuid: '15175000494711e98646d663bd873d93',
		characteristics: [],
	},
	crash: {
		uuid: '15176000494711e98646d663bd873d9',
		characteristics: [],
	},
	message: {
		uuid: '15177000494711e98646d663bd873d93',
		characteristics: [],
	},
}
