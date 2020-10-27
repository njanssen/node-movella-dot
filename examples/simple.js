import createDebug from 'debug'
import xsensManager from '../index.js'
const debug = createDebug('xsens-dot:example:connection')

xsensManager.on('error', (error) => {
    debug(error)
    process.exit(1)
})

setInterval(() => {
    debug(`Available Xsens DOTs: ${xsensManager.nrOfAvailableDots()}`)
    debug(`Connected Xsens DOTs: ${xsensManager.nrOfConnectedDots()}`)
},2000)

setTimeout(() => {
    xsensManager.connectAll()
},12000)
