import xsensManager, { STATUS_TYPE } from '../index.js'

xsensManager.on('dot', async (identifier) => {
	await xsensManager.connect(identifier)
	await xsensManager.subscribeStatus(identifier)
})

xsensManager.on('status', (identifier, status) => {
	console.log(`Status (${identifier}) = ${status}`)
})

xsensManager.on('error', (error) => {
	console.error(error)
	process.exit(1)
})

process.on('SIGINT', async () => {
	await xsensManager.disconnectAll()
	process.exit()
})
