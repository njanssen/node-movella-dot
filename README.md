# node-xsens-dot

Node.js interface for the [Xsens DOT](https://www.xsens.com/xsens-dot). These motion trackers are high-accuracy wearable inertial Bluetooth Low Energy (BLE) sensors.

## What does this library do?

This event-based Node.js library provides an easy-to-use interface for managing and receiving data from one or more Xsens DOT sensors.

The following interactions with Xsens DOT sensors are currently supported:

- Monitoring measurements (real-time streaming)
- Monitoring battery level
- Monitoring device status reports
- Reading sensor configuration (tag name, firmware version)

## Software prerequisites

This library is packaged as an [ECMAScript (ES) module](https://nodejs.org/api/esm.html#esm_modules_ecmascript_modules) which requires Node.js v12 or higher.

For Bluetooth connectivity, this library depends on the [@abandonware/noble](https://www.npmjs.com/package/@abandonware/noble) npm package. The installation prerequisites for using this package can be found [here](https://www.npmjs.com/package/@abandonware/noble#installation).

**Known issue**: On macOS, you might run into the issue that your Mac is unable to connect with Xsens DOT sensors with a firmware version earlier than 1.6.0. Make sure to update your firmware to the latest version with the Xsens DOT app to resolve this problem.

## Installation

```sh
yarn add @vliegwerk/xsens-dot
```

or

```sh
npm install @vliegwerk/xsens-dot --save
```

For usage examples, see the `examples` folder in the [node-xsens-dot repository](https://github.com/njanssen/node-xsens-dot/tree/main/examples) on GitHub.

## Basic usage

Use the following code to import the library into your application and connect to every available Xsens DOT sensor:

```javascript
import xsensManager from '@vliegwerk/xsens-dot'

xsensManager.on('dot', async (identifier) => {
    await xsensManager.connect(identifier)
})
```

A singleton instance of the Xsens DOT Manager class is provided as the default export of this library. The following event is emitted when the manager discovers a new Xsens DOT sensor:

- `dot` - the `identifier` argument contains the UUID used by the manager to identify the device. This would be a good moment to connect to the sensor, read sensor configuration data, and subscribe your application to measurement notifications.

On instantiation during the first import, the manager will automatically try to discover Xsens DOT devices for 15 seconds. To start scanning for devices a moment later in time, use the following function:

```javascript
xsensManager.startScanning()
```

or, if you want the manager to scan for 30 seconds:

```javascript
xsensManager.startScanning(30000)
```

## Monitoring measurements (real-time streaming)

The following code can be used to start listening to measurement notifications of all your available Xsens DOT sensors:

```javascript
xsensManager.on('dot', async (identifier) => {
    await xsensManager.connect(identifier)
    await xsensManager.subscribeMeasurement(identifier)
})

xsensManager.on('measurement', (identifier, data) => {
    console.log(`Measurement (${identifier}):`, data)
})
```

The following event is emitted for each measurement notification received from an Xsens DOT sensor:

- `measurement` - the `identifier` argument contains the UUID of the device that sent the notification, and the `data` argument contains a Javascript object with the measurement payload.

An example measurement payload:

```javascript
{
    timestamp: 49777528,
    quaternion: {
        w: 0.14728160202503204,
        x: -0.778212308883667,
        y: -0.5956636667251587,
        z: 0.1337108314037323
    },
    freeAcceleration: {
        x: 0.006057256832718849,
        y: 0.02522232010960579,
        z: 0.015676498413085938
    }
}
```

By default, you subscribe to measurement notifications of payload type `completeQuaternion` which contains quaternion orientation data and free acceleration data. You can also provide another payload type (exported by the library as constant `PAYLOAD_TYPE`) when you call the `subscribeMeasurement` function:

```javascript
import xsensManager, { PAYLOAD_TYPE } from '../index.js'

const payloadType = PAYLOAD_TYPE.completeEuler

xsensManager.on('dot', async (identifier) => {
    await xsensManager.connect(identifier)
    await xsensManager.subscribeMeasurement(identifier, payloadType)
})
```

The library currently supports the following payload types:

-   `extendedQuaternion`
-   `completeQuaternion`
-   `extendedEuler`
-   `completeEuler`
-   `orientationEuler`
-   `orientationQuaternion`
-   `freeAcceleration`

More detailed information about these measurement payloads can be found in the [Xsens DOT User Manual](https://www.xsens.com/hubfs/Downloads/Manuals/Xsens%20DOT%20User%20Manual.pdf).

## Monitoring battery level

The following code can be used to start listening to battery notifications of all your available Xsens DOT sensors:

```javascript
xsensManager.on('dot', async (identifier) => {
    await xsensManager.connect(identifier)
    await xsensManager.subscribeBattery(identifier)
})

xsensManager.on('battery', (identifier, data) => {
    console.log(`Battery level (${identifier}) = ${data.level}% ${data.charging ? '[charging]' : ''}`)
})
```

The following event is emitted for each battery notification received from an Xsens DOT sensor:

- `battery` - the `identifier` argument contains the UUID of the device that sent the notification, and the `data` argument contains a Javascript object with the battery level information:

```javascript
{
    level: 11,
    charging: true
}
```

## Monitoring device status reports

The following code can be used to start listening to status notifications of all your available Xsens DOT sensors:

```javascript
xsensManager.on('dot', async (identifier) => {
    await xsensManager.connect(identifier)
    await xsensManager.subscribeStatus(identifier)
})

xsensManager.on('status', (identifier, status) => {
    console.log(`Status (${identifier}) = ${status}`)
})
```

The following event is emitted for each battery notification received from an Xsens DOT sensor:

- `status` - the `identifier` argument contains the UUID of the device that sent the notification, and the `data` argument contains one of the values (e.g. `powerOff`) of the constant `STATUS_TYPE` exported by the library.

## Reading sensor configuration

The following code can be used to read the configuration of all your available Xsens DOT sensors:

```javascript
xsensManager.on('dot', async (identifier) => {
    await xsensManager.connect(identifier)
    const configuration = xsensManager.configuration(identifier)
    console.log(`Configuration (${identifier}): `, configuration)
    await xsensManager.disconnect(identifier)
})
```

## Error handling

This library uses `async`/`await` to handle asynchronous function calls. In the event of an error in the library itself or an underlying library, an `Error` will be thrown. In your application, you can use `try`/`catch` to handle these errors:

```javascript
try {
    await xsensManager.connect(identifier)
    await xsensManager.subscribeMeasurement(identifier)
} catch (error) {
    console.error('Exception raised while connecting to Xsens DOT: ', error)
}
```

## Library debug messages

Set the `DEBUG` environment variable to `xsens-dot:*` to see the [debug](https://www.npmjs.com/package/debug) messages written by this library.
Set the variable to `xsens-dot:*,noble` to see messages from both this library and noble:

```sh
DEBUG='xsens-dot:*,noble' node examples/battery-monitor.js
```

## Extras

- This library is developed and published by [me](https://www.vliegwerk.com) and isn't sponsored or owned by Xsens.
- Make sure to also check out the [Xsens DOT server](https://github.com/xsens/xsens_dot_server) which is a Node.js application developed by Xsens which also supports heading reset, clock synchronization, and offline measurement recording.
- More information about the Xsens DOT can be found in the [Xsens DOT User Manual](https://www.xsens.com/hubfs/Downloads/Manuals/Xsens%20DOT%20User%20Manual.pdf), [Xsens DOT BLE Services Specifications](https://www.xsens.com/hubfs/Downloads/Manuals/Xsens DOT BLE Services Specifications.pdf), and on the [Xsens Base Forum](https://base.xsens.com/hc/en-us/categories/360002285079-Wearable-Sensors-Platform).
- See the [License](LICENSE) file for license rights and limitations (MIT).
- Pull Requests are welcome!
