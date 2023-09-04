import movellaManager, { STATUS_TYPE } from '../index.js'

movellaManager.on('dot', async (identifier) => {
	try {
		await movellaManager.connect(identifier)
		await movellaManager.subscribeStatus(identifier)
	} catch (error) {
		console.error('Exception raised while connecting to Movella DOT: ', error)
	}
})

movellaManager.on('status', (identifier, status) => {
	switch (status) {
		case STATUS_TYPE.powerOff:
		case STATUS_TYPE.powerSaving:
		case STATUS_TYPE.successful:
		case STATUS_TYPE.deviceBusy:
		case STATUS_TYPE.buttonCallback:
			case STATUS_TYPE.illegalCommand:
			console.log(`Status (${identifier}) = ${status}`)
	}
})

process.on('SIGINT', async () => {
	await movellaManager.disconnectAll()
	process.exit()
})
