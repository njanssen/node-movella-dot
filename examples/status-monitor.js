import xsensManager, { STATUS_TYPE } from '../index.js'

xsensManager.on('dot', async (identifier) => {
	try {
		await xsensManager.connect(identifier)
		await xsensManager.subscribeStatus(identifier)
	} catch (error) {
		console.error('Exception raised while connecting to Xsens DOT: ', error)
	}
})

xsensManager.on('status', (identifier, status) => {
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
	await xsensManager.disconnectAll()
	process.exit()
})
