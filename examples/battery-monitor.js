import xsensManager from '../index.js'

xsensManager.on('dot', async (identifier) => {
	await xsensManager.connect(identifier)
	await xsensManager.subscribeBattery(identifier)
})

xsensManager.on('battery', (identifier, data) => {
	console.log(`Battery level (${identifier}) = ${data.level}% ${data.charging ? '[charging]' : ''}`)
})

process.on('SIGINT', async () => {
	await xsensManager.disconnectAll()
	process.exit()
})

xsensManager.on('error', (error) => {
	console.error(error)
	process.exit(1)
})
