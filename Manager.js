import createDebug from 'debug'
import noble from '@abandonware/noble'
import EventEmitter from 'events'
import { v4 as uuidv4 } from 'uuid'
import { BLE_STATES, XSENS_DOT_LOCALNAME } from './constants.js'
import Dot from './Dot.js'
import { timeStamp } from 'console'

const debug = createDebug('xsens-dot:manager')

/**
 * Xsens DOT Manager Class (BLE central)
 */
class Manager extends EventEmitter {
	constructor(options = {}) {
		super()
		this.central = noble
		this.devices = new Map()

		this.central.on('stateChange', (state) => {
			debug('central/stateChange:', state)
			switch (state) {
				case BLE_STATES.POWERED_ON:
					this.startScanning()
					break
				case BLE_STATES.POWERED_OFF:
				case BLE_STATES.RESETTING:
				case BLE_STATES.UNSUPPORTED:
				case BLE_STATES.UNKNOWN:
				case BLE_STATES.UNAUTHORIZED:
					this.emit('error',new Error('central/stateChange: BLE adapter not available!'))
					break
			}
		})

		this.central.on('scanStart', async () => {
			debug('central/scanStart')
		})

		this.central.on('scanStop', async () => {
			debug('central/scanStop')
		})

		this.central.on('discover', async (peripheral) => {
			if (
				peripheral.advertisement.localName === XSENS_DOT_LOCALNAME &&
				typeof peripheral.identifier === 'undefined'
			) {
				debug(
					`central/discover: discovered a new ${XSENS_DOT_LOCALNAME}`
				)
				const identifier = uuidv4()
				debug(
					`central/discover - adding ${XSENS_DOT_LOCALNAME} to manager with UUID ${identifier}`
				)
				peripheral.identifier = identifier
				const dot = new Dot(identifier, { peripheral: peripheral })
				this.devices.set(identifier, dot)
			}
		})

		this.central.on('warning', (message) => {
			console.warn('central/warning: ', message)
		})

		debug('Manager initialized')
	}

	reset = async () => {
		this.central.resetAsync()
	}

	startScanning = async (duration = 10000) => {
		this.central.startScanningAsync([], true)
		setTimeout(() => {
			this.central.stopScanning()
		},duration)
	}

	stopScanning = async () => {
		this.central.stopScanningAsync()
	}

	availableDevices = () => {
		return this.devices.size
	}

	connectedDevices = () => {
		return Array.from(this.devices.values()).filter((dot) => {
			dot.state === 'connected'
		}).length
	}

	connect = async (identifier) => {
		debug(`connect - connecting device ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (dot.state !== 'connected') {
				dot.removeAllListeners()
				await dot.connect()

				// TODO Create listeners for events

			}
		}
	}

	connectAll = async () => {
		debug(`disconnect - connecting all available devices`)
		for (let identifier of this.devices.keys()) {
			this.connect(identifier)
		}
	}

	disconnect = async (identifier) => {
		debug(`disconnect - disconnecting device ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (dot.state === 'connecting' || dot.state === 'connected') {
				await dot.disconnect()
				dot.removeAllListeners()
			}
		}
	}

	disconnectAll = async () => {
		debug(`disconnectAll - disconnecting all devices`)
		for (let identifier of this.devices.keys()) {
			this.disconnect(identifier)
		}
	}
}

/**
 * Xsens DOT Manager Singleton
 */
class Singleton {
	constructor() {
		if (!Singleton.instance) {
			Singleton.instance = new Manager()
		}
	}

	getInstance() {
		return Singleton.instance
	}
}

export default Singleton
