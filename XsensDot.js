import createDebug from 'debug'
import EventEmitter from 'events'
import { PERIPHERAL_STATES, XSENS_DOT_PAYLOAD_TYPE, XSENS_DOT_BLE_SPEC } from './constants.js'
const debug = createDebug('xsens-dot:dot')

/**
 * Xsens DOT Sensor Class (BLE peripheral)
 */
class XsensDot extends EventEmitter {
	constructor(identifier, options) {
		super()

		this.identifier = identifier
		this.configuration = {}

		this.peripheral = options.peripheral
		this.characteristics = options.characteristics || {}

		debug(`${this.identifier}/XsensDot - initialized new Xsens DOT instance`)
	}

	connect = async () => {
		if (this.connected) return

		this.peripheral.removeAllListeners()

		this.peripheral.on('disconnect', async () => {
			debug(`${this.identifier}/disconnect`)
			this.emit('disconnect')
		})

		try {
			await this.peripheral.connectAsync()

			const { services, characteristics } = await this.peripheral.discoverAllServicesAndCharacteristicsAsync()

			this.characteristics = {}
			for (const characteristic of characteristics) {
				this.characteristics[characteristic.uuid] = characteristic
			}

			this.configuration = await this.queryConfiguration()
		} catch (error) {
			debug(`${this.identifier}/connect - Error occured:`, error)
			this.emit('error', error)
			return
		}

		debug(`${this.identifier}/connect - connected`)
	}

	disconnect = async () => {
		await this.peripheral.disconnectAsync()
	}

	queryConfiguration = async () => {
		if (!this.connected) return

		const informationCharacteristic = this.characteristics[XSENS_DOT_BLE_SPEC.configuration.characteristics.information.uuid]
		const controlCharacteristic = this.characteristics[XSENS_DOT_BLE_SPEC.configuration.characteristics.control.uuid]

		const information = await informationCharacteristic.readAsync()
		const control = await controlCharacteristic.readAsync()

		const configuration = {
			tag: this.readTag(control, 8),
			firmware: {
				version: this.readVersion(information, 6),
				date: this.readDate(information, 9),
			},
		}

		debug(`${this.identifier} - queryConfiguration:`, configuration)
		return configuration
	}

	subscribeStatus = async (notify = true) => {
		if (!this.connected) return false

		const reportCharacteristic = this.characteristics[XSENS_DOT_BLE_SPEC.configuration.characteristics.report.uuid]

		if (notify) {
			await reportCharacteristic.subscribeAsync()
			reportCharacteristic.on('data', this.listenerStatus.bind(this))
		} else {
			await reportCharacteristic.unsubscribeAsync()
			reportCharacteristic.removeListener('data', this.listenerStatus)
		}

		debug(`${this.identifier}/subscribeStatus - status notifications ${notify ? 'enabled' : 'disabled'}`)
		return true
	}

	unsubscribeStatus = async () => {
		return await this.subscribeStatus(false)
	}

	listenerStatus = (data) => {
		const status = XSENS_DOT_BLE_SPEC.configuration.characteristics.report.status[data.readInt8(0)] // 1 byte
		debug(`${this.identifier}/listenerStatus - Status notification:`, status)
		this.emit('status', status)
	}

	subscribeBattery = async (notify = true) => {
		if (!this.connected) return false

		const batteryCharacteristic = this.characteristics[XSENS_DOT_BLE_SPEC.battery.characteristics.battery.uuid]

		if (notify) {
			await batteryCharacteristic.subscribeAsync()
			batteryCharacteristic.on('data', this.listenerBattery.bind(this))
			batteryCharacteristic.read()
		} else {
			await batteryCharacteristic.unsubscribeAsync()
			batteryCharacteristic.removeListener('data', this.listenerBattery)
		}

		debug(`${this.identifier}/subscribeBattery - battery notifications ${notify ? 'enabled' : 'disabled'}`)
		return true
	}

	unsubscribeBattery = async () => {
		return await this.subscribeBattery(false)
	}

	listenerBattery = (data) => {
		const battery = {
			// Battery level (%)
			level: data.readInt8(0), // 1 byte
			// Battery charging (boolean)
			charging: data.readInt8(1) ? true : false, // 1 byte
		}
		debug(`${this.identifier}/listenerBattery - Battery notification:`, battery)
		this.emit('battery', battery)
	}

	subscribeMeasurement = async (payloadType = XSENS_DOT_PAYLOAD_TYPE.completeQuaternion, notify = true) => {
		if (!this.connected) return false

		const service = XSENS_DOT_BLE_SPEC.measurement
		const control = service.characteristics.control
		const measurement = service.characteristics[service.payloadCharacteristic[payloadType]]

		if (typeof measurement === 'undefined') {
			this.emit('error', new Error(`Measurement subscription request for unknown payload type (${payloadType})`))
			return false
		}

		const controlCharacteristic = this.characteristics[control.uuid]
		const measurementCharacteristic = this.characteristics[measurement.uuid]

		const message = Buffer.from([control.type.measurement, notify ? control.action.start : control.action.stop, measurement.payload[payloadType]])
		await controlCharacteristic.writeAsync(message, false)

		if (notify) {
			await measurementCharacteristic.subscribeAsync()
			measurementCharacteristic.on('data', this.listenerMeasurement.bind(this, payloadType))
		} else {
			await measurementCharacteristic.unsubscribeAsync()
			measurementCharacteristic.removeListener('data', this.listenerMeasurement)
		}

		debug(`${this.identifier}/subscribeMeasurement - measurement notifications ${notify ? 'enabled' : 'disabled'}`)
		return true
	}

	unsubscribeMeasurement = async (payloadType = XSENS_DOT_PAYLOAD_TYPE.completeQuaternion) => {
		return await this.subscribeMeasurement(false)
	}

	listenerMeasurement = (payloadType, data) => {
		let measurement = {}

		switch (payloadType) {
			case XSENS_DOT_PAYLOAD_TYPE.extendedQuaternion:
				measurement = {
					timestamp: this.readTimestamp(data, 0),
					quaternion: this.readQuaternion(data, 4),
					freeAcceleration: this.readAcceleration(data, 20),
					status: this.readStatus(data, 32),
					clipCountAcc: this.readClipCount(data, 34),
					clipCountGyr: this.readClipCount(data, 35),
				}
				break
			case XSENS_DOT_PAYLOAD_TYPE.completeQuaternion:
				measurement = {
					timestamp: this.readTimestamp(data, 0),
					quaternion: this.readQuaternion(data, 4),
					freeAcceleration: this.readAcceleration(data, 20),
				}
				break
			case XSENS_DOT_PAYLOAD_TYPE.extendedEuler:
				measurement = {
					timestamp: this.readTimestamp(data, 0),
					euler: this.readEuler(data, 4),
					freeAcceleration: this.readAcceleration(data, 16),
					status: this.readStatus(data, 28),
					clipCountAcc: this.readClipCount(data, 30),
					clipCountGyr: this.readClipCount(data, 31),
				}
				break
			case XSENS_DOT_PAYLOAD_TYPE.completeEuler:
				measurement = {
					timestamp: this.readTimestamp(data, 0),
					euler: this.readEuler(data, 4),
					freeAcceleration: this.readAcceleration(data, 16),
				}
				break
			case XSENS_DOT_PAYLOAD_TYPE.orientationQuaternion:
				measurement = {
					timestamp: this.readTimestamp(data, 0),
					quaternion: this.readQuaternion(data, 4),
				}
				break
			case XSENS_DOT_PAYLOAD_TYPE.orientationEuler:
				measurement = {
					timestamp: this.readTimestamp(data, 0),
					euler: this.readEuler(data, 4),
				}
				break
			case XSENS_DOT_PAYLOAD_TYPE.freeAcceleration:
				measurement = {
					timestamp: this.readTimestamp(data, 0),
					freeAcceleration: this.readAcceleration(data, 4),
				}
				break
		}
		debug(`${this.identifier}/listenerMeasurement - Measurement notification:`, measurement)
		this.emit('measurement', measurement)
	}

	readVersion = (data, offset) => {
		return `${data.readInt8(offset)}.${data.readInt8(offset + 1)}.${data.readInt8(offset + 2)}`
	}

	readDate = (data, offset) => {
		const pad = (n) => {
			return (n < 10 ? '0' : '') + n
		}
		const date = `${data.readInt16LE(offset)}-${pad(data.readInt8(offset + 2))}-${pad(data.readInt8(offset + 3))}`
		const time = `${pad(data.readInt8(offset + 4))}:${pad(data.readInt8(offset + 5))}:${pad(data.readInt8(offset + 6))}`
		return new Date(date + 'T' + time)
	}

	readTag = (data, offset) => {
		const bytes = data.slice(offset, offset + 16)
		return bytes.toString('utf8', 0, bytes.indexOf('\x00'))
	}

	readTimestamp = (data, offset) => {
		return data.readUInt32LE(offset)
	}

	readQuaternion = (data, offset) => {
		return {
			w: data.readFloatLE(offset),
			x: data.readFloatLE(offset + 4),
			y: data.readFloatLE(offset + 8),
			z: data.readFloatLE(offset + 12),
		}
	}

	readEuler = (data, offset) => {
		return {
			x: data.readFloatLE(offset),
			y: data.readFloatLE(offset + 4),
			z: data.readFloatLE(offset + 8),
		}
	}

	readAcceleration = (data, offset) => {
		return {
			x: data.readFloatLE(offset),
			y: data.readFloatLE(offset + 4),
			z: data.readFloatLE(offset + 8),
		}
	}

	readStatus = (data, offset) => {
		let status = data.readInt16LE(offset)
		status = (status & 0x1ff) << 8
		return status
	}

	readClipCount = (data, offset) => {
		return data.readInt8(offset)
	}

	get connected() {
		const connected = this.state === PERIPHERAL_STATES.connected && Object.keys(this.characteristics).length > 0
		return connected
	}

	get connecting() {
		return this.state === PERIPHERAL_STATES.connecting
	}

	get state() {
		return this.peripheral.state
	}
}

export default XsensDot
