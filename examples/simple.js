import createDebug from 'debug'
import xsensManager from '../index.js'
const debug = createDebug('xsens-dot:example')

xsensManager.on('error', (error) => {
    debug(error)
    process.exit(1)
})

setTimeout(() => {
    xsensManager.connectAll()
},10000)
