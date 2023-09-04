import movellaManager from '../index.js'

movellaManager.on('dot', async (identifier) => {
	try {
		await movellaManager.connect(identifier)
		await movellaManager.subscribeBattery(identifier)
	} catch (error) {
		console.error('Exception raised while connecting to Movella DOT: ', error)
	}
})

movellaManager.on('battery', (identifier, data) => {
	console.log(`Battery level (${identifier}) = ${data.level}% ${data.charging ? '[charging]' : ''}`)
})

process.on('SIGINT', async () => {
	await movellaManager.disconnectAll()
	process.exit()
})
