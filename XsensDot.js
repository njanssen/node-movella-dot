import createDebug from 'debug'
import EventEmitter from 'events'
import { PERIPHERAL_STATES, XSENS_DOT_SPEC } from './constants.js'
const debug = createDebug('xsens:dot')

/**
 * Xsens DOT Sensor Class (BLE peripheral)
 */
class XsensDot extends EventEmitter {
	constructor(identifier, options) {
		super()

		this.identifier = identifier
		this.tag = undefined

		this.peripheral = options.peripheral
		this.characteristics = options.characteristics || {}

		debug('Xsens DOT sensor initialized')
	}

	connect = async () => {
		if (this.connected()) {
			debug(`${this.identifier}/connect - already connected!`)
			return
		}

		debug(`${this.identifier}/connect - connecting..`)

		this.peripheral.removeAllListeners()

		this.peripheral.on('disconnect', async () => {
			debug(`${this.identifier}/disconnected`)
			this.emit('disconnected')
		})

		try {
			await this.peripheral.connectAsync()

			const {
				services,
				characteristics,
			} = await this.peripheral.discoverAllServicesAndCharacteristicsAsync()

			this.characteristics = {}
			for (const characteristic of characteristics) {
				this.characteristics[characteristic.uuid] = characteristic
			}
		} catch (error) {
			debug(`${this.identifier}/connect - Error occured:`, error)
			this.emit('error', error)
			return
		}

		debug(`${this.identifier}/connect - connected!`)
	}

	disconnect = async () => {
		debug(`${this.identifier}/disconnect`)
		await this.peripheral.disconnectAsync()
	}

	subscribeBattery = async () => {
		debug(`${this.identifier}/subscribeBattery - subscribing.. `)
		const batteryCharacteristic = this.characteristics[
			XSENS_DOT_SPEC.battery.characteristics.battery
		]
		await batteryCharacteristic.subscribeAsync()

		batteryCharacteristic.on('data', (data) => {
			const battery = {
				level: data.readInt8(0),
				charging: data.readInt8(1) ? true : false,
			}
			debug(`${this.identifier}/battery`, battery)
			this.emit('battery', battery)
		})

		batteryCharacteristic.read()

		debug(`${this.identifier}/subscribeBattery - subscribed!`)
	}

	subscribeMeasurement = async () => {
		debug(`${this.identifier}/subscribeMeasurement - subscribing.. `)

		const controlCharacteristic = this.characteristics[
			XSENS_DOT_SPEC.measurement.characteristics.control
		]

		const measurementCharacteristic = this.characteristics[
			XSENS_DOT_SPEC.measurement.characteristics.measurementMediumPayload
		]

		const buffer = Buffer.from([0x01, 0x01, 0x03]) // Complete (Quaternion)
		await controlCharacteristic.writeAsync(buffer, false)

		await measurementCharacteristic.subscribeAsync()

		measurementCharacteristic.on('data', (data) => {
			const measurement = {
				// Timestamp (ms) - 4 bytes
				timestamp: data.readUInt32LE(0),
				// Quaternion (-) - w, x, y, z - 16 bytes
				quaternion: {
					w: data.readFloatLE(4),
					x: data.readFloatLE(8),
					y: data.readFloatLE(12),
					z: data.readFloatLE(16),
				},
				// Free acceleration (m/s^2) - x, y, z - 12 bytes
				acceleration: {
					x : data.readFloatLE(20),
					y : data.readFloatLE(24),
					z : data.readFloatLE(28),
				},
			}
			debug(`${this.identifier}/measurement`, measurement)
			this.emit('measurement', measurement)
		})

		debug(`${this.identifier}/subscribeMeasurement - subscribed!`)
	}

	connected = () => {
		return this.state === PERIPHERAL_STATES.connected
	}

	connecting = () => {
		return this.state === PERIPHERAL_STATES.connecting
	}

	get state() {
		return this.peripheral.state
	}
}

export default XsensDot
