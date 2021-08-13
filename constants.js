export const BLE_STATE = {
	poweredOn: 'poweredOn',
	poweredOff: 'poweredOff',
	resetting: 'resetting',
	unsupported: 'unsupported',
	unknown: 'unknown',
	unauthorized: 'unauthorized',
}

export const PERIPHERAL_STATE = {
	connected: 'connected',
	connecting: 'connecting',
	disconnected: 'disconnected',
	disconnecting: 'disconnecting',
}

export const XSENS_DOT_PAYLOAD_TYPE = Object.freeze({
	extendedQuaternion: 'extendedQuaternion',
	completeQuaternion: 'completeQuaternion',
	extendedEuler: 'extendedEuler',
	completeEuler: 'completeEuler',
	orientationEuler: 'orientationEuler',
	orientationQuaternion: 'orientationQuaternion',
	freeAcceleration: 'freeAcceleration',
})

export const XSENS_DOT_STATUS_TYPE = Object.freeze({
	successful: 'successful',
	powerOff: 'powerOff',
	deviceBusy: 'deviceBusy',
	illegalCommand: 'illegalCommand',
	powerSaving: 'powerSaving',
	buttonCallback: 'buttonCallback'
})

export const XSENS_DOT_BLE_SPEC = {
	localName: 'Xsens DOT',
	configuration: {
		uuid: '15171000494711e98646d663bd873d93',
		characteristics: {
			information: {
				// Read
				uuid: '15171001494711e98646d663bd873d93',
			},
			control: {
				// Read, Write
				uuid: '15171002494711e98646d663bd873d93',
			},
			report: {
				// Notify
				uuid: '15171004494711e98646d663bd873d93',
				status: {
					0: 'successful',
					1: 'powerOff',
					2: 'deviceBusy',
					3: 'illegalCommand',
					4: 'powerSaving',
					5: 'buttonCallback',
				},
			},
		},
	},
	measurement: {
		uuid: '15172000494711e98646d663bd873d93',
		payloadCharacteristic: {
			extendedQuaternion: 'measurementMediumPayload',
			completeQuaternion: 'measurementMediumPayload',
			extendedEuler: 'measurementMediumPayload',
			completeEuler: 'measurementMediumPayload',
			orientationEuler: 'measurementShortPayload',
			orientationQuaternion: 'measurementShortPayload',
			freeAcceleration: 'measurementShortPayload',
		},
		characteristics: {
			control: {
				// Read, Write
				uuid: '15172001494711e98646d663bd873d93',
				type: {
					// 1 byte
					measurement: 0x01,
				},
				action: {
					// 1 byte
					stop: 0x00,
					start: 0x01,
				},
			},
			measurementMediumPayload: {
				// Notify
				uuid: '15172003494711e98646d663bd873d93',
				payload: {
					// 1 byte
					extendedQuaternion: 2,
					completeQuaternion: 3,
					extendedEuler: 7,
					completeEuler: 16,
				},
			},
			measurementShortPayload: {
				// Notify
				uuid: '15172004494711e98646d663bd873d93',
				payload: {
					// 1 byte
					orientationEuler: 4,
					orientationQuaternion: 5,
					freeAcceleration: 6,
				},
			},
			orientationResetControl: '15172006494711e98646d663bd873d93', // Read, Write
			orientationResetStatus: '15172007494711e98646d663bd873d93', // Read
			orientationResetData: '15172008494711e98646d663bd873d93', // Read
		},
	},
	battery: {
		uuid: '15173000494711e98646d663bd873d93',
		characteristics: {
			battery: {
				// Read, Notify
				uuid: '15173001494711e98646d663bd873d93',
			},
		},
	},
	crash: {
		uuid: '15176000494711e98646d663bd873d9',
		characteristics: {
			manager: {
				// Read, Write
				uuid: '15176001494711e98646d663bd873d9',
			},
			information: {
				// Notify
				uuid: '15176002494711e98646d663bd873d9',
			},
		},
	},
	message: {
		uuid: '15177000494711e98646d663bd873d93',
		characteristics: {
			control: {
				// Write
				uuid: '15177001494711e98646d663bd873d93',
			},
			acknowledge: {
				// Read
				uuid: '15177002494711e98646d663bd873d93',
			},
			notification: {
				// Notify
				uuid: '15177003494711e98646d663bd873d93',
			},
		},
	},
}
