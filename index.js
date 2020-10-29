import XsensManager from './XsensManager.js'
import { XSENS_DOT_PAYLOAD_TYPE } from './constants.js'

export const PAYLOAD_TYPE = XSENS_DOT_PAYLOAD_TYPE
export default new XsensManager().getInstance()
