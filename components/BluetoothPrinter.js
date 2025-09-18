import RNBluetoothClassic from "react-native-bluetooth-classic";
import { PermissionsAndroid, Platform, Alert } from "react-native";

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
      "86:67:7A:96:91:75"
    ];
  }

  async requestPermissions() {
    if (Platform.OS === "android") {
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
    return true;
  }

  async scanAndConnect(onConnectedCallback) {
    if (Platform.OS !== "android") return;

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
      console.log("Previous discovery cancelled");

      // Start discovery and get devices
      const discoveredDevices = await RNBluetoothClassic.startDiscovery();
      console.log("Discovered devices:", discoveredDevices);

      
      let device =
        discoveredDevices.find((d) => this.targetMacs.includes(d.id)) ||
        (await RNBluetoothClassic.getBondedDevices()).find((d) =>
          this.targetMacs.includes(d.id)
        );

      if (device) {
        await RNBluetoothClassic.cancelDiscovery();
        console.log("Discovery cancelled before connecting");

        this.connectedDevice = await RNBluetoothClassic.connectToDevice(
          device.id
        );
        console.log("Connected to", this.connectedDevice);

        if (onConnectedCallback) onConnectedCallback();

        Alert.alert(
          "Success",
          `Bluetooth connected successfully to ${device.name}`
        );

        // Clean old subscription if exists
        if (this.dataSubscription) {
          this.dataSubscription.remove();
          this.dataSubscription = null;
        }

        // Listen for data
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
      } else {
        Alert.alert("Error", "Device not found. Please pair the device.");
      }
    } catch (error) {
      console.error("Connection error", error);
      Alert.alert("Error", `Failed to connect to the device: ${error.message}`);
    }
  }

  extractWeight(data) {
    const rawData = data.data || "";
    // More flexible regex: matches "12", "12.3", "12.3 kg", "12 kg"
    const match = rawData.match(/(\d+(\.\d+)?)( ?kg)?/i);
    return match ? match[0].trim() : "";
  }

  checkStability() {
    const uniqueValues = [...new Set(this.dataBuffer)];
    if (uniqueValues.length === 1) {
      this.stableData = uniqueValues[0];
      this.isStable = true;
    } else {
      this.isStable = false;
    }
  }

  async printText(text) {
    if (!this.connectedDevice) {
      Alert.alert("Error", "No device connected.");
      return;
    }

    try {
      const command = `\x1B\x40${text}\n`; // Initialize + text
      await this.connectedDevice.write(command);
      console.log("Print command sent successfully");
    } catch (error) {
      console.error("Print error", error);
      Alert.alert("Print Error", "Failed to print text.");
    }
  }

  async stopScan() {
    await RNBluetoothClassic.cancelDiscovery();
    console.log("Discovery cancelled");
  }

  async disconnect() {
    if (this.dataSubscription) {
      this.dataSubscription.remove();
      this.dataSubscription = null;
    }
    if (this.connectedDevice) {
      await this.connectedDevice.disconnect();
      console.log("Device disconnected");
      this.connectedDevice = null;
    }
  }
}

const blePrinter = new BlePrinter();
export default blePrinter;
