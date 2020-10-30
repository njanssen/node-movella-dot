import xsensManager from '../index.js'

xsensManager.on('dot', async (identifier) => {
	await xsensManager.connect(identifier)
	console.log(`Configuration (${identifier}): `,xsensManager.configuration(identifier))
	await xsensManager.disconnect(identifier)
})

xsensManager.on('error', (error) => {
	console.error(error)
	process.exit(1)
})
