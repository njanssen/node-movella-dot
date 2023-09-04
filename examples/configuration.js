import movellaManager from '../index.js'

movellaManager.on('dot', async (identifier) => {
	try {
		await movellaManager.connect(identifier)
		console.log(`Configuration (${identifier}): `, movellaManager.configuration(identifier))
		await movellaManager.disconnect(identifier)
	} catch (error) {
		console.error('Exception raised while connecting to Movella DOT: ', error)
	}
})
