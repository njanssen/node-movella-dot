import createDebug from 'debug'
import xsensManager from '../index.js'
const debug = createDebug('xsens-dot:example')

xsensManager.on('error', (error) => {
    debug(error)
    process.exit(1)
})

setTimeout(async () => {
    await xsensManager.connectAll()
    await xsensManager.subscribeBatteryAll()
    xsensManager.on('battery', (identifier,data) => {
        debug(`Battery level (${identifier}) = ${data.level}%`)
    })
},10000)
