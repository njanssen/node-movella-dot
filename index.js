import createDebug from 'debug'
import Manager from './Manager.js'

const debug = createDebug('xsens-dot:index')
const manager = new Manager().getInstance()

setInterval(() => {
    debug(`index - available devices: ${manager.availableDevices()}`)
    debug(`index - connected devices: ${manager.connectedDevices()}`)
},2000)

setTimeout(() => {
    manager.connectAll()
},12000)


export default manager