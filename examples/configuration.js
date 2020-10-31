import xsensManager from '../index.js'

xsensManager.on('dot', async (identifier) => {
	try {
		await xsensManager.connect(identifier)
		console.log(`Configuration (${identifier}): `, xsensManager.configuration(identifier))
		await xsensManager.disconnect(identifier)
	} catch (error) {
		console.error('Exception raised while connecting to Xsens DOT: ', error)
	}
})
