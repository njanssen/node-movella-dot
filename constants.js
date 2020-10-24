const XSENS_DOT_BLE = {
	configuration: {
		uuid: '15171000494711e98646d663bd873d93',
		characteristics : [
		]
	},
	measurement: {
		uuid: '15172000494711e98646d663bd873d93',
		characteristics : [
		]
	},
	battery: {
		uuid: '15173000494711e98646d663bd873d93',
		characteristics : [
			'0x3001' // battery
		]
	},
	unknown1: {
		uuid: '15174000494711e98646d663bd873d93'
	},
	unknown2: {
		uuid: '15175000494711e98646d663bd873d93'
	},
	crash: {
		uuid : '15176000494711e98646d663bd873d9',
		characteristics : [
		]
	},
    message: {
		uuid :'15177000494711e98646d663bd873d93',
		characteristics : [
		]
	}
}

module.exports = Object.freeze({
    XSENS_DOT_BLE: XSENS_DOT_BLE
})