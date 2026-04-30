import { PermissionsAndroid, Platform, Alert } from "react-native";

let RNBluetoothClassic = null;

if (Platform.OS === "android") {
  RNBluetoothClassic = require("react-native-bluetooth-classic");
}

class BlePrinter {
  constructor() {
    this.dataBuffer = [];
    this.isStable = false;
    this.stableData = null;
    this.latestWeight = "";
    this.connectedDevice = null;
    this.dataSubscription = null;
    this.targetMacs = [
      "66:32:60:5D:D4:CD",
      "66:32:D9:CC:DB:5F",
      "86:67:7A:96:91:75",
    ];
  }


  async requestPermissions() {
    if (Platform.OS !== "android") return true;

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      for (let key in granted) {
        if (granted[key] !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log(`${key} permission denied`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Permission error", error);
      return false;
    }
  }

 
  async scanAndConnect(onConnectedCallback) {
 
    if (Platform.OS !== "android" || !RNBluetoothClassic) {
      Alert.alert(
        "Not Supported",
        "Bluetooth Classic is not supported on iOS. Please use WiFi printer."
      );
      return;
    }

    const permissionsGranted = await this.requestPermissions();
    if (!permissionsGranted) {
      Alert.alert("Permission Error", "Required permissions are not granted");
      return;
    }

    try {
      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!isEnabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
        console.log("Bluetooth enabled");
      }

      await RNBluetoothClassic.cancelDiscovery();

      const discoveredDevices = await RNBluetoothClassic.startDiscovery();

      let device =
        discoveredDevices.find((d) => this.targetMacs.includes(d.id)) ||
        (await RNBluetoothClassic.getBondedDevices()).find((d) =>
          this.targetMacs.includes(d.id)
        );

      if (!device) {
        Alert.alert("Error", "Device not found. Please pair the device.");
        return;
      }

      await RNBluetoothClassic.cancelDiscovery();

      this.connectedDevice = await RNBluetoothClassic.connectToDevice(
        device.id
      );

      console.log("Connected to", this.connectedDevice);

      if (onConnectedCallback) onConnectedCallback();

      Alert.alert(
        "Success",
        `Bluetooth connected successfully to ${device.name}`
      );

      // Cleanup old subscription
      if (this.dataSubscription) {
        this.dataSubscription.remove();
        this.dataSubscription = null;
      }

      // Listen for incoming data
      this.dataSubscription = this.connectedDevice.onDataReceived((data) => {
        const weightData = this.extractWeight(data);
        if (weightData) {
          this.latestWeight = weightData;
          this.dataBuffer.push(weightData);

          if (this.dataBuffer.length > 10) {
            this.dataBuffer.shift();
          }

          this.checkStability();
        }
      });
    } catch (error) {
      console.error("Connection error", error);
      Alert.alert(
        "Error",
        `Failed to connect to the device: ${error.message}`
      );
    }
  }

  // ✅ Extract weight
  extractWeight(data) {
    const rawData = data?.data || "";
    const match = rawData.match(/(\d+(\.\d+)?)( ?kg)?/i);
    return match ? match[0].trim() : "";
  }

  // ✅ Stability check
  checkStability() {
    const uniqueValues = [...new Set(this.dataBuffer)];
    if (uniqueValues.length === 1) {
      this.stableData = uniqueValues[0];
      this.isStable = true;
    } else {
      this.isStable = false;
    }
  }

  // ✅ Print text
  async printText(text) {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Not Supported",
        "Printing via Bluetooth is not supported on iOS"
      );
      return;
    }

    if (!this.connectedDevice) {
      Alert.alert("Error", "No device connected.");
      return;
    }

    try {
      const command = `\x1B\x40${text}\n`;
      await this.connectedDevice.write(command);
      console.log("Print command sent successfully");
    } catch (error) {
      console.error("Print error", error);
      Alert.alert("Print Error", "Failed to print text.");
    }
  }

  // ✅ Stop scanning
  async stopScan() {
    if (Platform.OS === "android" && RNBluetoothClassic) {
      await RNBluetoothClassic.cancelDiscovery();
    }
  }

  // ✅ Disconnect
  async disconnect() {
    try {
      if (this.dataSubscription) {
        this.dataSubscription.remove();
        this.dataSubscription = null;
      }

      if (this.connectedDevice) {
        await this.connectedDevice.disconnect();
        this.connectedDevice = null;
        console.log("Device disconnected");
      }
    } catch (error) {
      console.error("Disconnect error", error);
    }
  }
}

const blePrinter = new BlePrinter();
export default blePrinter;