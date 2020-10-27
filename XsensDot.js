import createDebug from 'debug'
import EventEmitter from 'events'
import { PERIPHERAL_STATES } from './constants.js'
const debug = createDebug('xsens:dot')

/**
 * Xsens DOT Sensor Class (BLE peripheral)
 */
class XsensDot extends EventEmitter {
	constructor(identifier, options = {}) {
		super()

		this.identifier = identifier
		this.tag = undefined

		this.peripheral = options.peripheral
		this.services = options.services
		this.characteristics = options.characteristics

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

			this.services = services
			this.characteristics = characteristics
		} catch(error) {
			debug(`${this.identifier}/connect - Error occured`)
			emit(error)
			return
		}

		debug(`${this.identifier}/connect - connected!`)
	}

	disconnect = async () => {
		debug(`${this.identifier}/disconnect`)
		await this.peripheral.disconnectAsync()
	}

	connected = () => {
		return this.state === PERIPHERAL_STATES.CONNECTED
	}

	get state() {
		return this.peripheral.state
	}
}

export default XsensDot
