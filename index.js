import MovellaManager from './MovellaManager.js'
import { MOVELLA_DOT_PAYLOAD_TYPE, MOVELLA_DOT_STATUS_TYPE } from './constants.js'

export const PAYLOAD_TYPE = MOVELLA_DOT_PAYLOAD_TYPE
export const STATUS_TYPE = MOVELLA_DOT_STATUS_TYPE
export default new MovellaManager().getInstance()
