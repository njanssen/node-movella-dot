import createDebug from 'debug'
import xsensManager, { PAYLOAD_TYPE } from '../index.js'
const debug = createDebug('xsens:example')

const payloadType = PAYLOAD_TYPE.completeEuler

xsensManager.on('error', async (error) => {
	debug(error)
	await xsensManager.disconnectAll()
	process.exit(1)
})

xsensManager.on('dot', async (identifier) => {
	await xsensManager.connect(identifier)
	await xsensManager.subscribeMeasurement(identifier, payloadType)
})

xsensManager.on('measurement', (identifier, data) => {
	console.log(`Measurement (${identifier}):`, data)
})

process.on('SIGINT', async () => {
	await xsensManager.unsubscribeMeasurementAll(payloadType)
	await xsensManager.disconnectAll()
	process.exit()
})
