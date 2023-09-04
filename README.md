# node-movella-dot

Node.js interface for the [Movella DOT](https://www.movella.com/products/wearables/movella-dot). These motion trackers are high-accuracy wearable inertial Bluetooth Low Energy (BLE) sensors.

## What does this library do?

This event-based Node.js library provides an easy-to-use interface for managing and receiving data from one or more Movella DOTsensors.

The following interactions with Movella DOT sensors are currently supported:

- Monitoring measurements (real-time streaming)
- Monitoring battery level
- Monitoring device status reports
- Reading sensor configuration (tag name, firmware version, etc.)

## Software prerequisites

This library is packaged as an [ECMAScript (ES) module](https://nodejs.org/api/esm.html#esm_modules_ecmascript_modules) which requires Node.js v12 or higher.

For Bluetooth connectivity, this library depends on the [@abandonware/noble](https://www.npmjs.com/package/@abandonware/noble) npm package. The installation prerequisites for using this package can be found [here](https://www.npmjs.com/package/@abandonware/noble#installation).

**Known issue**: On macOS, you might run into the issue that your Mac is unable to connect with Movella DOT sensors with a firmware version earlier than 1.6.0. Make sure to update your firmware to the latest version with the Movella DOT app to resolve this problem.

## Installation

```sh
yarn add @appliedcreative/movella-dot
```

or

```sh
npm install @appliedcreative/movella-dot --save
```

For usage examples, see the `examples` folder in the [node-movella-dot repository](https://github.com/njanssen/node-movella-dot/tree/main/examples) on GitHub.

## Basic usage

Use the following code to import the library into your application and connect to every available Movella DOT sensor:

```javascript
import movellaManager from '@vliegwerk/movella-dot'

movellaManager.on('dot', async (identifier) => {
    await movellasManager.connect(identifier)
})
```

A singleton instance of the Movella DOT Manager class is provided as the default export of this library. The following event is emitted when the manager discovers a new Movella DOT sensor:

- `dot` - the `identifier` argument contains the UUID used by the manager to identify the device. This would be a good moment to connect to the sensor, read sensor configuration data, and subscribe your application to measurement notifications.

On instantiation during the first import, the manager will automatically try to discover Movella DOT devices for 15 seconds. To start scanning for devices a moment later in time, use the following function:

```javascript
movellaManager.startScanning()
```

or, if you want the manager to scan for 30 seconds:

```javascript
movellaanager.startScanning(30000)
```

## Monitoring measurements (real-time streaming)

The following code can be used to start listening to measurement notifications of all your available Movella DOT sensors:

```javascript
movellaManager.on('dot', async (identifier) => {
    await movellaManager.connect(identifier)
    await movellaManager.subscribeMeasurement(identifier)
})

movellaManager.on('measurement', (identifier, data) => {
    console.log(`Measurement (${identifier}):`, data)
})
```

The following event is emitted for each measurement notification received from an Movella DOT sensor:

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
import movellaManager, { PAYLOAD_TYPE } from '../index.js'

const payloadType = PAYLOAD_TYPE.completeEuler

movellaManager.on('dot', async (identifier) => {
    await movellaManager.connect(identifier)
    await movellaManager.subscribeMeasurement(identifier, payloadType)
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
-   `deltaQuantities`
-   `deltaQuantitiesWithMag`
-   `rateQuantities`
-   `rateQuantitiesWithMag`
-   `customMode1`
-   `customMode2`
-   `customMode3`
-   `customMode5`

The payload types `highFidelity`, `highFidelityWithMag`, and `customMode4` are not supported by this library. These payload types can only be parsed by the official Movella DOT SDKs.

More detailed information about these measurement payloads can be found in the [Movella DOT User Manual](https://www.movella.com/hubfs/Movella%20DOT%20User%20Manual.pdf).

## Monitoring battery level

The following code can be used to start listening to battery notifications of all your available Movella DOT sensors:

```javascript
movellaManager.on('dot', async (identifier) => {
    await movellaManager.connect(identifier)
    await movellaManager.subscribeBattery(identifier)
})

movellaManager.on('battery', (identifier, data) => {
    console.log(`Battery level (${identifier}) = ${data.level}% ${data.charging ? '[charging]' : ''}`)
})
```

The following event is emitted for each battery notification received from an Movella DOT sensor:

- `battery` - the `identifier` argument contains the UUID of the device that sent the notification, and the `data` argument contains a Javascript object with the battery level information:

```javascript
{
    level: 11,
    charging: true
}
```

## Monitoring device status reports

The following code can be used to start listening to status notifications of all your available Movella DOT sensors:

```javascript
movellaManager.on('dot', async (identifier) => {
    await movellaManager.connect(identifier)
    await movellaManager.subscribeStatus(identifier)
})

movellaManager.on('status', (identifier, status) => {
    console.log(`Status (${identifier}) = ${status}`)
})
```

The following event is emitted for each device status report received from an Movella DOT sensor:

- `status` - the `identifier` argument contains the UUID of the device that sent the notification, and the `data` argument contains one of the values (e.g. `powerOff`) of the constant `STATUS_TYPE` exported by the library.

## Reading sensor configuration

The following code can be used to read the configuration of all your available Movella DOT sensors:

```javascript
movellaManager.on('dot', async (identifier) => {
    await movellaManager.connect(identifier)
    const configuration = movellaManager.configuration(identifier)
    console.log(`Configuration (${identifier}): `, configuration)
    await movellaManager.disconnect(identifier)
})
```

## Error handling

This library uses `async`/`await` to handle asynchronous function calls. In the event of an error in the library itself or an underlying library, an `Error` will be thrown. In your application, you can use `try`/`catch` to handle these errors:

```javascript
try {
    await movellaManager.connect(identifier)
    await movellaManager.subscribeMeasurement(identifier)
} catch (error) {
    console.error('Exception raised while connecting to Movella DOT: ', error)
}
```

## Library debug messages

Set the `DEBUG` environment variable to `movella-dot:*` to see the [debug](https://www.npmjs.com/package/debug) messages written by this library.
Set the variable to `movella-dot:*,noble` to see messages from both this library and noble:

```sh
DEBUG='movella-dot:*,noble' node examples/battery-monitor.js
```

## Extras

- This library is developed and published by [Applied Creative](https://www.appliedcreative.nl) and isn't sponsored or owned by Movella.
- Make sure to also check out the [Movella DOT server](https://github.com/xsens/xsens_dot_server) which is a Node.js application developed by Movella which also supports heading reset, clock synchronization, and offline measurement recording.
- More information about the Movella DOT can be found in the [Movella DOT User Manual](https://www.movella.com/hubfs/Movella%20DOT%20User%20Manual.pdf) and the [Movella DOT BLE Services Specifications](https://www.movella.com/hubfs/Downloads/Manuals/Movella%20DOT%20BLE%20Services%20Specifications.pdf).
- See the [License](LICENSE) file for license rights and limitations (MIT).
- Pull Requests are welcome!
