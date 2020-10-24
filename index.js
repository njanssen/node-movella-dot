'use strict'

const debug = require('debug')('xsens-dot')
const noble = require('@abandonware/noble')
const EventEmitter = require('events')
const { XSENS_DOT_BLE } = require('./constants')

class XsensDot extends EventEmitter {
	constructor(options = {}) {
		super()
		this.central = noble

		this.sensors = []

		this.central.on('stateChange', (state) => {
            debug('central/stateChange:', state)
			switch (state) {
                case 'poweredOn':
                    this.startScanning()
                    break
                case 'poweredOff':
					// Detected Bluetooth adapter has been disabled
                case 'resetting':
                case 'unsupported':
                case 'unknown':
                case 'unauthorized':
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
			// debug('central/discover - discovered a peripheral')
			const localName = peripheral.advertisement.localName
			if (localName === 'Xsens DOT') {
                debug('central/discover: peripheral is an Xsens DOT')
                await this.stopScanning()
                await this.connect(peripheral)
			}
		})

		this.central.on('warning', (message) => {
			console.warn('central/warning: ', message)
		})

		debug('XsensDot initialized')
	}

	connect = async (peripheral) => {
		const uuid = peripheral.uuid

		debug('central/connect - connecting to peripheral',uuid)
		await peripheral.connectAsync()
		debug('central/connect - connected to',uuid)

		debug('central/connect - discovering services')
		const services = await peripheral.discoverServicesAsync()
        debug('central/connect - discovered services:', services.map((val,idx,arr) => { return val.uuid }))

		debug('central/connect - discovering characteristics for service', services[0].toString())
        const characteristics = await services[0].discoverCharacteristicsAsync([])
		debug('central/connect - discovered characteristics:', characteristics)
    }

    disconnect = (peripheral) => {
        debug('disconnect - disconnecting')
        peripheral.disconnect()
        peripheral.once('disconnect', () => {
            debug('central/disconnect - disconnected')
        })
    }

    reset = async () => {
        this.central.resetAsync()
    }

	startScanning = async () => {
		this.central.startScanningAsync([], true)
	}

	stopScanning = async () => {
		this.central.stopScanningAsync()
	}
}

const dot = new XsensDot()

module.exports = XsensDot
