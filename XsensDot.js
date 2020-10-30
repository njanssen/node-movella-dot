import createDebug from 'debug'
import EventEmitter from 'events'
import { type } from 'os'
import { PERIPHERAL_STATES, XSENS_DOT_PAYLOAD_TYPE, XSENS_DOT_BLE_SPEC } from './constants.js'
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

			const { services, characteristics } = await this.peripheral.discoverAllServicesAndCharacteristicsAsync()

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

	connected = () => {
		const connected = typeof this.characteristics !== undefined && this.state === PERIPHERAL_STATES.connected
		debug(`${this.identifier}/connected:`,connected)
		return connected
	}

	connecting = () => {
		return this.state === PERIPHERAL_STATES.connecting
	}

	get state() {
		return this.peripheral.state
	}

	subscribeBattery = async () => {
		debug(`${this.identifier}/subscribeBattery - subscribing.. `)

		if (!this.connected()) {
			debug(`${this.identifier}/subscribeBattery - Battery subscription request received while not connected`)
			return false
		}

		const batteryCharacteristic = this.characteristics[XSENS_DOT_BLE_SPEC.battery.characteristics.battery.uuid]
		await batteryCharacteristic.subscribeAsync()

		batteryCharacteristic.on(
			'data',
			(listenerBattery = (data) => {
				const battery = {
					// Battery level (%)
					level: data.readInt8(0), // 1 byte
					// Battery charging (boolean)
					charging: data.readInt8(1) ? true : false, // 1 byte
				}
				debug(`${this.identifier}/listenerBattery`, battery)
				this.emit('battery', battery)
			})
		)

		batteryCharacteristic.read()

		debug(`${this.identifier}/subscribeBattery - subscribed!`)
		return true
	}

	unsubscribeBattery = async () => {
		debug(`${this.identifier}/unsubscribeBattery - unsubscribing.. `)

		if (!this.connected()) {
			debug(`${this.identifier}/unsubscribeBattery - Battery unsubscription request received while not connected`)
			return false
		}

		const batteryCharacteristic = this.characteristics[XSENS_DOT_BLE_SPEC.battery.characteristics.battery.uuid]

		await batteryCharacteristic.unsubscribeAsync()
		batteryCharacteristic.removeListener('data', listenerBattery)

		debug(`${this.identifier}/unsubscribeBattery - unsubscribed!`)
		return true
	}

	subscribeMeasurement = async (payloadType = XSENS_DOT_PAYLOAD_TYPE.completeQuaternion) => {
		debug(`${this.identifier}/subscribeMeasurement - subscribing.. `)

		if (this.connected()) {
			debug(`${this.identifier}/subscribeMeasurement - Measurement subscription request received while not connected`)
			return false
		}

		const service = XSENS_DOT_BLE_SPEC.measurement
		const control = service.characteristics.control
		const measurement = service.characteristics[service.payloadCharacteristic[payloadType]]

		if (typeof measurement === 'undefined') {
			this.emit('error', new Error(`Measurement subscription request for unknown payload type (${payloadType})`))
		}

		const controlCharacteristic = this.characteristics[control.uuid]
		const measurementCharacteristic = this.characteristics[measurement.uuid]

		const buffer = Buffer.from([control.type.measurement, control.action.start, measurement.payload[payloadType]])

		await controlCharacteristic.writeAsync(buffer, false)

		await measurementCharacteristic.subscribeAsync()

		measurementCharacteristic.on(
			'data',
			(listenerMeasurement = (data) => {
				let measurement = {}

				switch (payloadType) {
					case XSENS_DOT_PAYLOAD_TYPE.extendedQuaternion:
						measurement = {
							timestamp: this.readTimestamp(data, 0), // 4 bytes
							quaternion: this.readQuaternion(data, 4), // 16 bytes
							freeAcceleration: this.readAcceleration(data, 20), // 12 bytes
							status: this.readStatus(data, 32), // 2 bytes
							clipCountAcc: this.readClipCount(data, 34), // 1 byte
							clipCountGyr: this.readClipCount(data, 35), // 1 byte
						}
						break
					case XSENS_DOT_PAYLOAD_TYPE.completeQuaternion:
						measurement = {
							timestamp: this.readTimestamp(data, 0), // 4 bytes
							quaternion: this.readQuaternion(data, 4), // 16 bytes
							freeAcceleration: this.readAcceleration(data, 20), // 12 bytes
						}
						break
					case XSENS_DOT_PAYLOAD_TYPE.extendedEuler:
						measurement = {
							timestamp: this.readTimestamp(data, 0), // 4 bytes
							euler: this.readEuler(data, 4), // 12 bytes
							freeAcceleration: this.readAcceleration(data, 16), // 12 bytes
							status: this.readStatus(data, 28), // 2 bytes
							clipCountAcc: this.readClipCount(data, 30), // 1 byte
							clipCountGyr: this.readClipCount(data, 31), // 1 byte
						}
						break
					case XSENS_DOT_PAYLOAD_TYPE.completeEuler:
						measurement = {
							timestamp: this.readTimestamp(data, 0), // 4 bytes
							euler: this.readEuler(data, 4), // 12 bytes
							freeAcceleration: this.readAcceleration(data, 16), // 12 bytes
						}
						break
					case XSENS_DOT_PAYLOAD_TYPE.orientationQuaternion:
						measurement = {
							timestamp: this.readTimestamp(data, 0), // 4 bytes
							quaternion: this.readQuaternion(data, 4), // 16 bytes
						}
						break
					case XSENS_DOT_PAYLOAD_TYPE.orientationEuler:
						measurement = {
							timestamp: this.readTimestamp(data, 0), // 4 bytes
							euler: this.readEuler(data, 4), // 12 bytes
						}
						break
					case XSENS_DOT_PAYLOAD_TYPE.freeAcceleration:
						measurement = {
							timestamp: this.readTimestamp(data, 0), // 4 bytes
							freeAcceleration: this.readAcceleration(data, 4), // 12 bytes
						}
						break
				}
				debug(`${this.identifier}/listenerMeasurement`, measurement)
				this.emit('measurement', measurement)
			})
		)

		debug(`${this.identifier}/subscribeMeasurement - subscribed!`)
		return true
	}

	unsubscribeMeasurement = async (payloadType = XSENS_DOT_PAYLOAD_TYPE.completeQuaternion) => {
		debug(`${this.identifier}/unsubscribeMeasurement - unsubscribing.. `)

		if (!this.connected()) {
			debug(`${this.identifier}/unsubscribeMeasurement - Measurement unsubscription request received while not connected`)
			return false
		}

		const service = XSENS_DOT_BLE_SPEC.measurement
		const measurement = service.characteristics[service.payloadCharacteristic[payloadType]]

		if (typeof measurement === 'undefined') {
			this.emit('error', new Error(`Measurement unsubscription request for unknown payload type (${payloadType})`))
		}

		const measurementCharacteristic = this.characteristics[measurement.uuid]

		await measurementCharacteristic.unsubscribeAsync()
		measurementCharacteristic.removeListener('data', listenerMeasurement)

		debug(`${this.identifier}/unsubscribeMeasurement - unsubscribed!`)
		return true
	}

	readTimestamp = (data, offset) => {
		// Timestamp (ms)
		return data.readUInt32LE(offset)
	}

	readQuaternion = (data, offset) => {
		// Quaternion (-)
		return {
			w: data.readFloatLE(offset), // 4 bytes
			x: data.readFloatLE(offset + 4), // 4 bytes
			y: data.readFloatLE(offset + 8), // 4 bytes
			z: data.readFloatLE(offset + 12), // 4 bytes
		}
	}

	readEuler = (data, offset) => {
		// Euler (degree)
		return {
			x: data.readFloatLE(offset), // 4 bytes
			y: data.readFloatLE(offset + 4), // 4 bytes
			z: data.readFloatLE(offset + 8), // 4 bytes
		}
	}

	readAcceleration = (data, offset) => {
		// Free acceleration (m/s^2)
		return {
			x: data.readFloatLE(offset), // 4 bytes
			y: data.readFloatLE(offset + 4), // 4 bytes
			z: data.readFloatLE(offset + 8), // 4 bytes
		}
	}

	readStatus = (data, offset) => {
		// Status
		let status = data.readInt16LE(offset) // 2 bytes
		status = (status & 0x1ff) << 8
		return status
	}

	readClipCount = (data, offset) => {
		// Clip count
		return data.readInt8(offset) // 1 byte
	}
}

export default XsensDot
