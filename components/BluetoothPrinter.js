import RNBluetoothClassic from "react-native-bluetooth-classic";
import { PermissionsAndroid, Platform, Alert } from "react-native";

class BlePrinter {
  constructor() {
    this.dataBuffer = [];
    this.isStable = false;
    this.stableData = null;
    this.latestWeight = "";
    this.connectedDevice = null;
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
    if (Platform.OS === "android") {
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

        await RNBluetoothClassic.startDiscovery();
        console.log("Discovery started");

        setTimeout(async () => {
          const bondedDevices = await RNBluetoothClassic.getBondedDevices();
          //console.log("Bonded devices:", bondedDevices);

          if (bondedDevices.length === 0) {
            Alert.alert("No Devices Found", "No bonded devices found.");
            return;
          }

          const device = bondedDevices.find(
            (d) => d.id === "66:32:60:5D:D4:CD"
          );
          if (device) {
            await RNBluetoothClassic.cancelDiscovery();
            console.log("Discovery cancelled before connecting");

            this.connectedDevice = await RNBluetoothClassic.connectToDevice(device.id);
            console.log("Connected to", this.connectedDevice);
            if (onConnectedCallback) {
              onConnectedCallback();
            }
            Alert.alert(
              "Success",
              `Bluetooth is connected successfully to ${device.name}`
            );

            this.connectedDevice.onDataReceived((data) => {
              const weightData = this.extractWeight(data);
              this.latestWeight = weightData;
              this.dataBuffer.push(weightData);

              if (this.dataBuffer.length > 10) {
                this.dataBuffer.shift();
              }

              this.checkStability();
            });
          } else {
            Alert.alert("Error", "Device not found. Please pair the device.");
          }
        }, 10000);
      } catch (error) {
        console.error("Connection error", error);
        Alert.alert(
          "Error",
          `Failed to connect to the device: ${error.message}`
        );
      }
    }
  }

  extractWeight(data) {
    const rawData = data.data || "";
    const match = rawData.match(/(\d+\.\d+ kg)/);
    return match ? match[0] : "";
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
    if (this.connectedDevice) {
      try {
        // ESC/POS commands for text printing
        const command = `\x1B\x40${text}\n\x1D\x56\x00`; // Initialize printer + print text + cut paper
        await this.connectedDevice.write(command);
        console.log("Print command sent successfully");
      } catch (error) {
        console.error("Print error", error);
        Alert.alert("Print Error", "Failed to print text.");
      }
    } else {
      Alert.alert("Error", "No device connected.");
    }
  }

  async stopScan() {
    await RNBluetoothClassic.cancelDiscovery();
    console.log("Discovery cancelled");
  }
}

const blePrinter = new BlePrinter(); // Create an instance of BlePrinter
export default blePrinter;
