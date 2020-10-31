import createDebug from 'debug'
import noble from '@abandonware/noble'
import EventEmitter from 'events'
import Dot from './XsensDot.js'
import { v4 as uuidv4 } from 'uuid'
import { BLE_STATES, XSENS_DOT_BLE_SPEC } from './constants.js'

const debug = createDebug('xsens-dot:manager')

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
					this.emit('error', new Error(`No BLE adapter available (${state})`))
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
			if (peripheral.advertisement.localName === XSENS_DOT_BLE_SPEC.localName && typeof peripheral.identifier === 'undefined') {
				const identifier = uuidv4()
				peripheral.identifier = identifier
				const dot = new Dot(identifier, { peripheral: peripheral })
				this.devices.set(identifier, dot)

				debug(`central/discover - discovered new DOT (${identifier})`)
				this.emit('dot', identifier)
			}
		})

		this.central.on('warning', (message) => {
			debug('central/warning:', message)
		})

		debug('XsensDotManager - initialized Xsens DOT manager instance')
	}

	reset = async () => {
		await this.central.resetAsync()
	}

	startScanning = async (duration = 15000) => {
		this.central.startScanningAsync([], true)

		setTimeout(() => {
			this.central.stopScanning()
		}, duration)
	}

	stopScanning = async () => {
		this.central.stopScanningAsync()
	}

	connectAll = async () => {
		for (let identifier of this.devices.keys()) {
			await this.connect(identifier)
		}
	}

	connect = async (identifier) => {
		const dot = this.getDevice(identifier)
		if (!dot.connected) {
			dot.on('disconnect', () => {
				debug(`${identifier}/disconnect`)
				dot.removeAllListeners()
				// TODO Remove dot instance from list of available devices
			})

			dot.on('error', (error) => {
				debug(`${identifier}/error - Error occured:`, error)
				this.emit('error', error)
			})

			await dot.connect()
			debug(`${identifier}/connect - connected`)
		}
	}

	disconnectAll = async () => {
		for (let identifier of this.devices.keys()) {
			this.disconnect(identifier)
		}
	}

	disconnect = async (identifier) => {
		const dot = this.getDevice(identifier)
		if (dot.connecting || dot.connected) {
			await dot.disconnect()
			dot.removeAllListeners()
			debug(`${identifier}/disconnect - disconnected`)
		}
	}

	configuration = (identifier) => {
		return this.getDevice(identifier).configuration
	}

	subscribeStatusAll = async () => {
		for (let identifier of this.devices.keys()) {
			this.subscribeStatus(identifier)
		}
	}

	subscribeStatus = async (identifier, notify = true) => {
		const dot = this.getDevice(identifier)
		if (notify()) {
			if (await dot.subscribeStatus()) {
				dot.on('status', this.listenerStatus.bind(this, identifier))
			}
		} else {
			if (await dot.unsubscribeStatus()) {
				dot.removeListener('status', this.listenerStatus)
			}
		}
		debug(`${identifier}/subscribeStatus - status notifications ${notify ? 'enabled' : 'disabled'}`)
	}

	listenerStatus = (identifier, status) => {
		debug(`${identifier}/listenerStatus`, status)
		this.emit('status', identifier, status)
	}

	unsubscribeStatusAll = async () => {
		for (let identifier of this.devices.keys()) {
			await this.subscribeStatus(identifier, false)
		}
	}

	unsubscribeStatus = async (identifier) => {
		return await subscribeStatus(identifier, false)
	}

	subscribeBatteryAll = async () => {
		debug(`subscribeBatteryAll`)
		for (let identifier of this.devices.keys()) {
			this.subscribeBattery(identifier)
		}
	}

	subscribeBattery = async (identifier) => {
		debug(`subscribeBattery - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (await dot.subscribeBattery()) {
				dot.on('battery', this.listenerBattery.bind(this, identifier))
			}
		} else {
			this.emit('error', new Error(`Battery subscription request for unknown identifier (${identifier})`))
		}
	}

	listenerBattery = (identifier, data) => {
		debug(`${identifier}/listenerBattery`, data)
		this.emit('battery', identifier, data)
	}

	unsubscribeBatteryAll = async () => {
		debug(`unsubscribeBatteryAll`)
		for (let identifier of this.devices.keys()) {
			await this.unsubscribeBattery(identifier)
		}
	}

	unsubscribeBattery = async (identifier) => {
		debug(`unsubscribeBattery - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (await dot.unsubscribeBattery()) {
				dot.removeListener('battery', this.listenerBattery)
			}
		} else {
			this.emit('error', new Error(`Battery unsubscription request for unknown identifier (${identifier})`))
		}
	}

	subscribeMeasurementAll = async (payloadType) => {
		debug(`subscribeMeasurementAll`)
		for (let identifier of this.devices.keys()) {
			this.subscribeMeasurement(identifier, payloadType)
		}
	}

	subscribeMeasurement = async (identifier, payloadType) => {
		debug(`subscribeMeasurement - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (await dot.subscribeMeasurement(payloadType)) {
				dot.on('measurement', this.listenerMeasurement.bind(this, identifier))
			}
		} else {
			this.emit('error', new Error(`Measurement subscription request for unknown identifier (${identifier})`))
		}
	}

	listenerMeasurement = (identifier, data) => {
		debug(`${identifier}/listenerMeasurement`, data)
		this.emit('measurement', identifier, data)
	}

	unsubscribeMeasurementAll = async (payloadType) => {
		debug(`unsubscribeMeasurementAll`)
		for (let identifier of this.devices.keys()) {
			await this.unsubscribeMeasurement(identifier, payloadType)
		}
	}

	unsubscribeMeasurement = async (identifier, payloadType) => {
		debug(`unsubscribeMeasurement - ${identifier}`)
		const dot = this.devices.get(identifier)
		if (typeof dot !== 'undefined') {
			if (await dot.unsubscribeMeasurement(payloadType)) {
				dot.removeListener('measurement', this.listenerMeasurement)
			}
		} else {
			this.emit('error', new Error(`Measurement unsubscription request for unknown identifier (${identifier})`))
		}
	}

	getDevice = (identifier) => {
		const dot = this.devices.get(identifier)
		if (typeof dot === 'undefined') {
			throw new Error(`Device request for unknown identifier (${identifier})`)
		}
		return dot
	}

	get nrOfAvailableDots() {
		return this.devices.size
	}

	get identifiersOfAvailableDots() {
		return this.devices.keys()
	}

	get nrOfConnectedDots() {
		return Array.from(this.devices.values()).filter((dot) => {
			return dot.connected
		}).length
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
