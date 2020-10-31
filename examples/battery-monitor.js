import xsensManager from '../index.js'

xsensManager.on('dot', async (identifier) => {
	try {
		await xsensManager.connect(identifier)
		await xsensManager.subscribeBattery(identifier)
	} catch (error) {
		console.error('Exception raised while connecting to Xsens DOT: ', error)
	}
})

xsensManager.on('battery', (identifier, data) => {
	console.log(`Battery level (${identifier}) = ${data.level}% ${data.charging ? '[charging]' : ''}`)
})

process.on('SIGINT', async () => {
	await xsensManager.disconnectAll()
	process.exit()
})
