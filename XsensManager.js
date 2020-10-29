import createDebug from 'debug'
import noble from '@abandonware/noble'
import EventEmitter from 'events'
import Dot from './XsensDot.js'
import { v4 as uuidv4 } from 'uuid'
import { BLE_STATES, XSENS_DOT_SPEC } from './constants.js'

const debug = createDebug('xsens:manager')

/**
 * Xsens DOT Manager Class (BLE central)
 */
class XsensManager extends EventEmitter {
	constructor(options = {}) {
		super()
		this.central = noble
		this.devices = new Map()

		this.central.on('stateChange', (state) => {
			debug('central/stateChange:', state)
			switch (state) {
				case BLE_STATES.poweredOn:
					this.startScanning()
					break
				case BLE_STATES.poweredOff:
				case BLE_STATES.resetting:
				case BLE_STATES.unsupported:
				case BLE_STATES.unknown:
				case BLE_STATES.unauthorized:
					this.emit('error', new Error(`BLE adapter not available (${state})`))
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
				peripheral.advertisement.localName === XSENS_DOT_SPEC.localName &&
				typeof peripheral.identifier === 'undefined'
			) {
				const identifier = uuidv4()
				debug(`central/discover - discovered new DOT (${identifier})`)
				peripheral.identifier = identifier
				const dot = new Dot(identifier, { peripheral: peripheral })
				this.devices.set(identifier, dot)

				this.emit('dot', identifier)
			}
		})

		this.central.on('warning', (message) => {
			debug('central/warning:', message)
		})

		debug('Xsens DOT manager initialized')
	}

	reset = async () => {
		this.central.resetAsync()
	}

	startScanning = async (duration = 10000) => {
		this.central.startScanningAsync([], true)
		setTimeout(() => {
			this.central.stopScanning()
		}, duration)
	}

	stopScanning = async () => {
		this.central.stopScanningAsync()
	}

	nrOfAvailableDots = () => {
		return this.devices.size
	}

	nrOfConnectedDots = () => {
		return Array.from(this.devices.values()).filter((dot) => {
			return dot.connected()
		}).length
	}

	connect = async (identifier) => {
		debug(`connect - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (!dot.connected()) {
				dot.removeAllListeners()

				dot.on('disconnected', () => {
					debug(`${identifier}/disconnected`)
					dot.removeAllListeners()
				})

				dot.on('error', (error) => {
					debug(`${identifier}/error - Error occured:`, error)
					this.emit('error', error)
				})

				await dot.connect()

				// TODO Create listeners for events
			}
		} else {
			this.emit('error', new Error(`Connection request for unknown identifier (${identifier})`))
		}
	}

	connectAll = async () => {
		debug(`connectAll`)
		for (let identifier of this.devices.keys()) {
			await this.connect(identifier)
		}
	}

	disconnect = async (identifier) => {
		debug(`disconnect - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (dot.connecting() || dot.connected()) {
				await dot.disconnect()
				dot.removeAllListeners()
			}
		} else {
			this.emit('error', new Error(`Disconnecting request for unknown identifier (${identifier})`))
		}
	}

	disconnectAll = async () => {
		debug(`disconnectAll`)
		for (let identifier of this.devices.keys()) {
			this.disconnect(identifier)
		}
	}

	subscribeBattery = async (identifier) => {
		debug(`subscribeBattery - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			await dot.subscribeBattery()
			dot.on('battery', (data) => {
				debug(`${identifier}/battery`, data)
				this.emit('battery', identifier, data)
			})
		}
	}

	subscribeBatteryAll = async () => {
		debug(`subscribeBatteryAll`)
		for (let identifier of this.devices.keys()) {
			this.subscribeBattery(identifier)
		}
	}

	subscribeMeasurement = async (identifier, payloadType = undefined) => {
		debug(`subscribeMeasurement - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			await dot.subscribeMeasurement(payloadType)
			dot.on('measurement', (data) => {
				debug(`${identifier}/measurement`, data)
				this.emit('measurement', identifier, data)
			})
		}
	}

	subscribeMeasurementAll = async () => {
		debug(`subscribeMeasurementAll`)
		for (let identifier of this.devices.keys()) {
			this.subscribeMeasurement(identifier)
		}
	}
}

/**
 * Xsens DOT Manager Singleton
 */
class Singleton {
	constructor() {
		if (!Singleton.instance) {
			Singleton.instance = new XsensManager()
		}
	}

	getInstance() {
		return Singleton.instance
	}
}

export default Singleton
