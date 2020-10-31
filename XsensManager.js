import createDebug from 'debug'
import noble from '@abandonware/noble'
import EventEmitter from 'events'
import Dot from './XsensDot.js'
import { v4 as uuidv4 } from 'uuid'
import { BLE_STATE, XSENS_DOT_BLE_SPEC } from './constants.js'

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
				case BLE_STATE.poweredOn:
					this.startScanning()
					break
				case BLE_STATE.poweredOff:
				case BLE_STATE.resetting:
				case BLE_STATE.unsupported:
				case BLE_STATE.unknown:
				case BLE_STATE.unauthorized:
					debug(`central/stateChange: no BLE adapter available (${state})`)
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
				debug(`central/discover - discovered new Xsens DOT (${identifier})`)

				const dot = new Dot(identifier, { peripheral: peripheral })
				this.devices.set(identifier, dot)
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

	subscribeStatusAll = async (notify) => {
		for (let identifier of this.devices.keys()) {
			this.subscribeStatus(identifier, notify)
		}
	}

	subscribeStatus = async (identifier, notify = true) => {
		const dot = this.getDevice(identifier)
		if (notify) {
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
		debug(`${identifier}/listenerStatus - status notification:`, status)
		this.emit('status', identifier, status)
	}

	unsubscribeStatusAll = async () => {
		await this.subscribeStatusAll(false)
	}

	unsubscribeStatus = async (identifier) => {
		return await subscribeStatus(identifier, false)
	}

	subscribeBatteryAll = async (notify) => {
		for (let identifier of this.devices.keys()) {
			this.subscribeBattery(identifier, notify)
		}
	}

	subscribeBattery = async (identifier, notify = true) => {
		const dot = this.getDevice(identifier)
		if (notify) {
			if (await dot.subscribeBattery()) {
				dot.on('battery', this.listenerBattery.bind(this, identifier))
			}
		} else {
			if (await dot.unsubscribeBattery()) {
				dot.removeListener('battery', this.listenerBattery)
			}
		}
		debug(`${identifier}/subscribeBattery - battery notifications ${notify ? 'enabled' : 'disabled'}`)
	}

	listenerBattery = (identifier, data) => {
		debug(`${identifier}/listenerBattery - battery notification:`, data)
		this.emit('battery', identifier, data)
	}

	unsubscribeBatteryAll = async () => {
		await this.subscribeBatteryAll(false)
	}

	unsubscribeBattery = async (identifier) => {
		return await this.subscribeBattery(identifier, false)
	}

	subscribeMeasurementAll = async (payloadType, notify) => {
		for (let identifier of this.devices.keys()) {
			this.subscribeMeasurement(identifier, payloadType, notify)
		}
	}

	subscribeMeasurement = async (identifier, payloadType, notify = true) => {
		const dot = this.getDevice(identifier)
		if (notify) {
			if (await dot.subscribeMeasurement(payloadType)) {
				dot.on('measurement', this.listenerMeasurement.bind(this, identifier))
			}
		} else {
			if (await dot.unsubscribeMeasurement(payloadType)) {
				dot.removeListener('measurement', this.listenerMeasurement)
			}
		}
		debug(`${identifier}/subscribeMeasurement - measurement notifications ${notify ? 'enabled' : 'disabled'}`)
	}

	listenerMeasurement = (identifier, data) => {
		debug(`${identifier}/listenerMeasurement - measurement notification:`, data)
		this.emit('measurement', identifier, data)
	}

	unsubscribeMeasurementAll = async (payloadType) => {
		await this.subscribeMeasurementAll(payloadType, false)
	}

	unsubscribeMeasurement = async (identifier, payloadType) => {
		await this.subscribeMeasurement(identifier, payloadType, false)
	}

	getDevice = (identifier) => {
		const dot = this.devices.get(identifier)
		if (typeof dot === 'undefined') {
			throw new Error(`Trying to get device for unknown identifier: ${identifier}`)
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
