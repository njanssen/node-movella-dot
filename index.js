import createDebug from 'debug'
import Manager from './Manager.js'

const debug = createDebug('xsens-dot:index')
const manager = new Manager().getInstance()

manager.on('error', (error) => {
    debug('Error occured: ',error)
    process.exit(1)
})

setInterval(() => {
    debug(`index - available devices: ${manager.nrOfAvailableDevices()}`)
    debug(`index - connected devices: ${manager.nrOfConnectedDevices()}`)
},2000)

setTimeout(() => {
    manager.connectAll()
},12000)

export default manager