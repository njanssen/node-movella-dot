import xsensManager, { PAYLOAD_TYPE } from '../index.js'

const payloadType = PAYLOAD_TYPE.completeEuler

xsensManager.on('dot', async (identifier) => {
	await xsensManager.connect(identifier)
	await xsensManager.subscribeMeasurement(identifier, payloadType)
})

xsensManager.on('measurement', (identifier, data) => {
	console.log(`Measurement (${identifier}):`, data)
})

xsensManager.on('error', async (error) => {
	console.error(error)
	await xsensManager.disconnectAll()
	process.exit(1)
})

process.on('SIGINT', async () => {
	await xsensManager.disconnectAll()
	process.exit()
})