import xsensManager, { PAYLOAD_TYPE } from '../index.js'

const payloadType = PAYLOAD_TYPE.completeEuler

xsensManager.on('dot', async (identifier) => {
	try {
		await xsensManager.connect(identifier)
		await xsensManager.subscribeMeasurement(identifier, payloadType)
	} catch (error) {
		console.error('Exception raised while connecting to Xsens DOT: ', error)
	}
})

xsensManager.on('measurement', (identifier, data) => {
	console.log(`Measurement (${identifier}):`, data)
})

process.on('SIGINT', async () => {
	await xsensManager.disconnectAll()
	process.exit()
})
