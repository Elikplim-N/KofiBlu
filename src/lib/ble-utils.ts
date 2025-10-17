// BLE Utility Functions for robust device management

export interface BLEError extends Error {
  code?: string;
  severity: 'warning' | 'error' | 'critical';
  recoverable: boolean;
}

export class BLEConnectionError extends Error implements BLEError {
  code: string;
  severity: 'warning' | 'error' | 'critical';
  recoverable: boolean;

  constructor(message: string, code: string, severity: 'warning' | 'error' | 'critical' = 'error', recoverable = true) {
    super(message);
    this.name = 'BLEConnectionError';
    this.code = code;
    this.severity = severity;
    this.recoverable = recoverable;
  }
}

// Common BLE error codes and their meanings
export const BLE_ERROR_CODES = {
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  GATT_SERVER_ERROR: 'GATT_SERVER_ERROR',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  CHARACTERISTIC_NOT_FOUND: 'CHARACTERISTIC_NOT_FOUND',
  WRITE_FAILED: 'WRITE_FAILED',
  READ_FAILED: 'READ_FAILED',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
  USER_CANCELLED: 'USER_CANCELLED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DEVICE_DISCONNECTED: 'DEVICE_DISCONNECTED',
} as const;

// Device capability detection
export interface DeviceCapabilities {
  supportsNotifications: boolean;
  supportsWrite: boolean;
  supportsWriteWithoutResponse: boolean;
  maxMTU: number;
  batteryService: boolean;
  deviceInfoService: boolean;
}

// Enhanced device filtering patterns
export const DEVICE_FILTERS = {
  ARDUINO: [
    { namePrefix: "Arduino" },
    { namePrefix: "Uno" },
    { namePrefix: "Nano" }
  ],
  ESP32: [
    { namePrefix: "ESP32" },
    { namePrefix: "ESP-32" },
    { namePrefix: "WROOM" }
  ],
  ESP8266: [
    { namePrefix: "ESP8266" },
    { namePrefix: "NodeMCU" },
    { namePrefix: "Wemos" }
  ],
  NORDIC: [
    { namePrefix: "Nordic" },
    { namePrefix: "nRF" },
    { namePrefix: "nRF52" },
    { namePrefix: "nRF51" }
  ],
  CUSTOM: [] as BluetoothLEScanFilter[]
};

export function createBLEError(error: any): BLEError {
  if (error instanceof BLEConnectionError) {
    return error;
  }

  const message = error?.message || String(error);
  
  // Map common error patterns to structured errors
  if (message.includes('User cancelled')) {
    return new BLEConnectionError(
      'Device selection was cancelled',
      BLE_ERROR_CODES.USER_CANCELLED,
      'warning',
      true
    );
  }
  
  if (message.includes('timeout')) {
    return new BLEConnectionError(
      'Connection timed out',
      BLE_ERROR_CODES.CONNECTION_TIMEOUT,
      'error',
      true
    );
  }
  
  if (message.includes('GATT')) {
    return new BLEConnectionError(
      'GATT server error occurred',
      BLE_ERROR_CODES.GATT_SERVER_ERROR,
      'error',
      true
    );
  }
  
  if (message.includes('Service not found')) {
    return new BLEConnectionError(
      'Required service not found on device',
      BLE_ERROR_CODES.SERVICE_NOT_FOUND,
      'error',
      false
    );
  }
  
  if (message.includes('permission') || message.includes('denied')) {
    return new BLEConnectionError(
      'Permission denied - please enable Bluetooth',
      BLE_ERROR_CODES.PERMISSION_DENIED,
      'critical',
      false
    );
  }

  // Generic error
  return new BLEConnectionError(
    message,
    'UNKNOWN_ERROR',
    'error',
    true
  );
}

// Device capability detection
export async function detectDeviceCapabilities(
  service: BluetoothRemoteGATTService,
  txChar: BluetoothRemoteGATTCharacteristic,
  rxChar: BluetoothRemoteGATTCharacteristic
): Promise<DeviceCapabilities> {
  const capabilities: DeviceCapabilities = {
    supportsNotifications: false,
    supportsWrite: false,
    supportsWriteWithoutResponse: false,
    maxMTU: 20, // Default BLE MTU
    batteryService: false,
    deviceInfoService: false
  };

  try {
    // Check TX characteristic properties for notifications
    if (txChar.properties.notify) {
      capabilities.supportsNotifications = true;
    }

    // Check RX characteristic properties for write capabilities
    if (rxChar.properties.write) {
      capabilities.supportsWrite = true;
    }
    
    if (rxChar.properties.writeWithoutResponse) {
      capabilities.supportsWriteWithoutResponse = true;
    }

    // Try to detect MTU size (this is approximate)
    try {
      const testData = new Uint8Array(244); // Max possible MTU - 3
      await rxChar.writeValue(testData);
      capabilities.maxMTU = 247; // Max MTU
    } catch {
      // Try smaller sizes
      for (const mtu of [185, 104, 23]) {
        try {
          const testData = new Uint8Array(mtu - 3);
          await rxChar.writeValue(testData);
          capabilities.maxMTU = mtu;
          break;
        } catch {
          continue;
        }
      }
    }

    // Check for common services
    try {
      const server = service.device.gatt;
      if (server) {
        // Battery service
        try {
          await server.getPrimaryService('battery_service');
          capabilities.batteryService = true;
        } catch {
          // Service not available
        }

        // Device information service
        try {
          await server.getPrimaryService('device_information');
          capabilities.deviceInfoService = true;
        } catch {
          // Service not available
        }
      }
    } catch (error) {
      console.warn('Error checking additional services:', error);
    }

  } catch (error) {
    console.warn('Error detecting device capabilities:', error);
  }

  return capabilities;
}

// Message chunking for large data
export function chunkMessage(message: string, maxChunkSize: number = 20): string[] {
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  
  if (messageBytes.length <= maxChunkSize) {
    return [message];
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < messageBytes.length) {
    const chunkBytes = messageBytes.slice(offset, offset + maxChunkSize);
    const chunk = new TextDecoder().decode(chunkBytes);
    chunks.push(chunk);
    offset += maxChunkSize;
  }

  return chunks;
}

// Connection quality assessment
export interface ConnectionQuality {
  signal: 'excellent' | 'good' | 'poor' | 'critical';
  latency: number;
  stability: number; // 0-100
  errors: number;
}

export class ConnectionMonitor {
  private pingCount = 0;
  private successCount = 0;
  private errorCount = 0;
  private latencies: number[] = [];
  private startTime = Date.now();

  recordSuccess(latency: number) {
    this.pingCount++;
    this.successCount++;
    this.latencies.push(latency);
    
    // Keep only last 20 latency measurements
    if (this.latencies.length > 20) {
      this.latencies.shift();
    }
  }

  recordError() {
    this.pingCount++;
    this.errorCount++;
  }

  getQuality(): ConnectionQuality {
    const averageLatency = this.latencies.length > 0 
      ? this.latencies.reduce((sum, lat) => sum + lat, 0) / this.latencies.length 
      : 0;

    const successRate = this.pingCount > 0 ? this.successCount / this.pingCount : 1;
    const stability = Math.round(successRate * 100);

    let signal: ConnectionQuality['signal'] = 'excellent';
    if (averageLatency > 1000 || successRate < 0.7) signal = 'critical';
    else if (averageLatency > 500 || successRate < 0.85) signal = 'poor';
    else if (averageLatency > 200 || successRate < 0.95) signal = 'good';

    return {
      signal,
      latency: Math.round(averageLatency),
      stability,
      errors: this.errorCount
    };
  }

  reset() {
    this.pingCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.latencies = [];
    this.startTime = Date.now();
  }
}

// Device information utilities
export async function getDeviceInfo(device: BluetoothDevice): Promise<{
  name: string;
  id: string;
  rssi?: number;
  batteryLevel?: number;
  manufacturerData?: string;
}> {
  const info = {
    name: device.name || 'Unknown Device',
    id: device.id,
    rssi: undefined as number | undefined,
    batteryLevel: undefined as number | undefined,
    manufacturerData: undefined as string | undefined
  };

  try {
    if (device.gatt?.connected) {
      // Try to get battery level
      try {
        const batteryService = await device.gatt.getPrimaryService('battery_service');
        const batteryChar = await batteryService.getCharacteristic('battery_level');
        const batteryData = await batteryChar.readValue();
        info.batteryLevel = batteryData.getUint8(0);
      } catch {
        // Battery service not available
      }
    }
  } catch (error) {
    console.warn('Error getting device info:', error);
  }

  return info;
}

// Validate BLE support and permissions
export async function validateBLEEnvironment(): Promise<{
  supported: boolean;
  available: boolean;
  secure: boolean;
  issues: string[];
}> {
  const result = {
    supported: false,
    available: false,
    secure: false,
    issues: [] as string[]
  };

  // Check if running in browser
  if (typeof window === 'undefined') {
    result.issues.push('Not running in browser environment');
    return result;
  }

  // Check Web Bluetooth support
  if (!navigator.bluetooth) {
    result.issues.push('Web Bluetooth not supported in this browser');
    return result;
  }

  result.supported = true;

  // Check if HTTPS (required for Web Bluetooth)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    result.issues.push('HTTPS required for Web Bluetooth (except on localhost)');
  } else {
    result.secure = true;
  }

  // Check availability
  try {
    const available = await navigator.bluetooth.getAvailability();
    result.available = available;
    
    if (!available) {
      result.issues.push('Bluetooth adapter not available or disabled');
    }
  } catch (error) {
    result.issues.push('Cannot check Bluetooth availability');
  }

  return result;
}