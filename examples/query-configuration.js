import xsensManager from '../index.js'

xsensManager.on('dot', async (identifier) => {
	await xsensManager.connect(identifier)
	const configuration = await xsensManager.queryConfiguration(identifier)
	console.log(`Configuration (${identifier}): `,configuration)
	await xsensManager.disconnect(identifier)
})

xsensManager.on('error', (error) => {
	console.error(error)
	process.exit(1)
})
