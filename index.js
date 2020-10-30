import XsensManager from './XsensManager.js'
import { XSENS_DOT_PAYLOAD_TYPE, XSENS_DOT_STATUS_TYPE } from './constants.js'

export const PAYLOAD_TYPE = XSENS_DOT_PAYLOAD_TYPE
export const STATUS_TYPE = XSENS_DOT_STATUS_TYPE
export default new XsensManager().getInstance()
