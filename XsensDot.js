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

			this.characteristics = {};
			for (const characteristic of characteristics) {
				this.characteristics[characteristic.uuid] = characteristic;
			}

		} catch(error) {
			debug(`${this.identifier}/connect - Error occured`)
			this.emit(error)
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
		const batteryCharacteristic = this.characteristics[XSENS_DOT_SPEC.battery.characteristics.battery]
		await batteryCharacteristic.subscribeAsync()

		batteryCharacteristic.on('data',(data) => {
			const level = data.readInt8()
			const charging = data.readInt8() ? true : false
			this.emit('battery',{
				level : level,
				charging : charging
			})
		})

		debug(`${this.identifier}/subscribeBattery - subscribed!`)
	}

	connected = () => {
		return this.state === PERIPHERAL_STATES.connected
	}

	get state() {
		return this.peripheral.state
	}
}

export default XsensDot
