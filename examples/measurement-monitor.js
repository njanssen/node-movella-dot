import createDebug from 'debug'
import xsensManager, { PAYLOAD_TYPE } from '../index.js'
const debug = createDebug('xsens:example')

xsensManager.on('error', (error) => {
	debug(error)
	process.exit(1)
})

xsensManager.on('dot', async (identifier) => {
	await xsensManager.connect(identifier)
	await xsensManager.subscribeMeasurement(identifier, PAYLOAD_TYPE.orientationQuaternion)
})

xsensManager.on('measurement', (identifier, data) => {
	debug(
		`Measurement (${identifier}):`,data
	)
})

process.on('SIGINT', async () => {
	await xsensManager.disconnectAll()
	process.exit()
})
