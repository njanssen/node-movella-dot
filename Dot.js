import createDebug from 'debug'
import EventEmitter from 'events'
import { PERIPHERAL_STATES } from './constants.js'
const debug = createDebug('xsens-dot:dot')

/**
 * Xsens DOT Sensor Class (BLE peripheral)
 */
class Dot extends EventEmitter {
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
		debug('connect - connecting to ', this.identifier)

		if (this.state === PERIPHERAL_STATES.CONNECTED) {
			// This peripheral is already connected
			debug('connect - already connected!')
			return true
		}

		this.peripheral.removeAllListeners()

		this.peripheral.on('disconnect', async () => {
			debug('peripheral/disconnected - emitting state change')
			await this.disconnect()
			this.emit('stateChange', this.state)
		})

		debug('connect - connecting..')

		try {
			await this.peripheral.connectAsync()

			debug('connect - discovering services and characteristics..')

			const {
				services,
				characteristics,
			} = await this.peripheral.discoverAllServicesAndCharacteristicsAsync()
			this.services = services
			this.characteristics = characteristics
		} catch(error) {
			debug('connect - error occured: ',error)
			return false
		}

		debug('connect - connected!')
		return true
	}

	disconnect = async () => {
		debug('disconnect - disconnecting')
		await this.peripheral.disconnectAsync()
	}

	connected = () => {
		return this.state === PERIPHERAL_STATES.CONNECTED
	}

	get state() {
		return this.peripheral.state
	}
}

export default Dot
