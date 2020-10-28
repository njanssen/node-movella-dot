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
		characteristics: {
			information: "15171001494711e98646d663bd873d93", // Read
			control: "15171002494711e98646d663bd873d93", // Read, Write
			report: "15171004494711e98646d663bd873d93" // Read, Write
		}
	},
	measurement: {
		uuid: '15172000494711e98646d663bd873d93',
		characteristics: {
			control : "15172001494711e98646d663bd873d93", // Read, Write
			measurementMediumPayload: "15172003494711e98646d663bd873d93", // Notify
			measurementShortPayload: "15172004494711e98646d663bd873d93", // Notify
			orientationResetControl: "15172006494711e98646d663bd873d93", // Read, Write
			orientationResetStatus: "15172007494711e98646d663bd873d93", // Read
			orientationResetData: "15172008494711e98646d663bd873d93", // Read

		}
	},
	battery: {
		uuid: '15173000494711e98646d663bd873d93',
		characteristics: {
			battery : '15173001494711e98646d663bd873d93', // Read, Notify
		},
	},
	crash: {
		uuid: '15176000494711e98646d663bd873d9',
		characteristics: {
			manager : "15176001494711e98646d663bd873d9", // Read, Write
			information : "15176002494711e98646d663bd873d9", // Notify
		},
	},
	message: {
		uuid: '15177000494711e98646d663bd873d93',
		characteristics: {
			control: '15177001494711e98646d663bd873d93', // Write
			acknowledge: '15177002494711e98646d663bd873d93', // Read
			notification: '15177003494711e98646d663bd873d93', // Notify
		},
	},
}
