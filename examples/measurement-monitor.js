import movellaManager, { PAYLOAD_TYPE } from '../index.js'

const payloadType = PAYLOAD_TYPE.completeEuler

movellaManager.on('dot', async (identifier) => {
	try {
		await movellaManager.connect(identifier)
		await movellaManager.subscribeMeasurement(identifier, payloadType)
	} catch (error) {
		console.error('Exception raised while connecting to Movella DOT: ', error)
	}
})

movellaManager.on('measurement', (identifier, data) => {
	console.log(`Measurement (${identifier}):`, data)
})

process.on('SIGINT', async () => {
	await movellaManager.disconnectAll()
	process.exit()
})
