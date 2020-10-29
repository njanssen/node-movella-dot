import XsensManager from './XsensManager.js'
import { XSENS_DOT_PAYLOAD } from './constants.js'

export const PAYLOAD_TYPE = XSENS_DOT_PAYLOAD
export default new XsensManager().getInstance()
