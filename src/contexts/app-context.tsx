
"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ControlComponent, ControlProfile, ControlType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  createBLEError, 
  ConnectionMonitor, 
  detectDeviceCapabilities,
  getDeviceInfo,
  validateBLEEnvironment,
  chunkMessage,
  DEVICE_FILTERS,
  type BLEError,
  type ConnectionQuality,
  type DeviceCapabilities
} from "@/lib/ble-utils";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

interface BLEDevice {
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  service: BluetoothRemoteGATTService | null;
  txCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  rxCharacteristic: BluetoothRemoteGATTCharacteristic | null;
}

interface AppContextType {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  connectionError: BLEError | null;
  connectionQuality: ConnectionQuality | null;
  deviceCapabilities: DeviceCapabilities | null;
  connect: (deviceFilter?: BluetoothLEScanFilter[] | keyof typeof DEVICE_FILTERS) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  scanDevices: () => Promise<BluetoothDevice[]>;
  testConnection: () => Promise<boolean>;
  validateEnvironment: () => Promise<boolean>;
  serialData: string[];
  sendSerial: (data: string) => Promise<boolean>;
  clearSerial: () => void;
  controls: ControlComponent[];
  addControl: (type: ControlType, label: string) => void;
  removeControl: (id: string) => void;
  updateControl: (id: string, updates: Partial<ControlComponent>) => void;
  setControls: (controls: ControlComponent[]) => void;
  profiles: ControlProfile[];
  saveProfile: (name: string) => void;
  loadProfile: (name: string) => void;
  deleteProfile: (name: string) => void;
  getProfileNames: () => string[];
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PROFILES_STORAGE_KEY = "kofiblu_profiles";
const DEVICE_STORAGE_KEY = "kofiblu_last_device";

// Nordic UART Service
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
// RX Characteristic (App -> Device)
const RX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
// TX Characteristic (Device -> App)
const TX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// Connection constants
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000; // 2 seconds
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const MAX_MESSAGE_LENGTH = 20; // BLE typical MTU limit

// Default device patterns - now using DEVICE_FILTERS from utils
const DEFAULT_PATTERNS = [
  ...DEVICE_FILTERS.ARDUINO,
  ...DEVICE_FILTERS.ESP32,
  ...DEVICE_FILTERS.ESP8266,
  ...DEVICE_FILTERS.NORDIC,
  { services: [UART_SERVICE_UUID] }
];


export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<BLEError | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [bleDevice, setBleDevice] = useState<BLEDevice>({
    device: null,
    server: null,
    service: null,
    txCharacteristic: null,
    rxCharacteristic: null
  });
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [lastDeviceInfo, setLastDeviceInfo] = useState<{id: string; name: string} | null>(null);
  const [connectionMonitor] = useState(() => new ConnectionMonitor());

  const [serialData, setSerialData] = useState<string[]>([]);
  const [controls, setControls] = useState<ControlComponent[]>([]);
  const [profiles, setProfiles] = useState<ControlProfile[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const isConnected = connectionStatus === 'connected';

  // Load last device info on mount
  useEffect(() => {
    try {
      const storedDevice = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (storedDevice) {
        setLastDeviceInfo(JSON.parse(storedDevice));
      }
    } catch (error) {
      console.error("Failed to load last device from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (storedProfiles) {
        setProfiles(JSON.parse(storedProfiles));
      }
    } catch (error) {
      console.error("Failed to load profiles from localStorage:", error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (bleDevice.device?.gatt?.connected) {
        cleanupConnection();
      }
    };
  }, []);

  // Enhanced connection monitoring with quality assessment
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    const interval = setInterval(async () => {
      if (bleDevice.device?.gatt?.connected === false) {
        console.log("Connection lost detected by heartbeat");
        connectionMonitor.recordError();
        handleUnexpectedDisconnect();
      } else if (isConnected) {
        // Perform a connection quality test
        try {
          const start = Date.now();
          await testConnection();
          const latency = Date.now() - start;
          connectionMonitor.recordSuccess(latency);
          setConnectionQuality(connectionMonitor.getQuality());
        } catch (error) {
          connectionMonitor.recordError();
          setConnectionQuality(connectionMonitor.getQuality());
        }
      }
    }, HEARTBEAT_INTERVAL);
    
    setHeartbeatInterval(interval);
  }, [bleDevice.device, isConnected]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      setHeartbeatInterval(null);
    }
  }, [heartbeatInterval]);

  const handleNotifications = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      try {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(value);
        const timestamp = new Date().toLocaleTimeString();
        setSerialData(prev => [...prev, `[${timestamp}] <- ${text.trim()}`]);
      } catch (error) {
        console.error("Failed to decode received data:", error);
        setSerialData(prev => [...prev, `[ERROR] Failed to decode received data`]);
      }
    }
  }, []);

  const cleanupConnection = useCallback(() => {
    try {
      if (bleDevice.txCharacteristic) {
        bleDevice.txCharacteristic.removeEventListener('characteristicvaluechanged', handleNotifications);
        bleDevice.txCharacteristic.stopNotifications().catch(console.error);
      }
      if (bleDevice.device) {
        bleDevice.device.removeEventListener('gattserverdisconnected', handleDisconnect);
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }, [bleDevice, handleNotifications]);
  
  const handleDisconnect = useCallback(() => {
    cleanupConnection();
    stopHeartbeat();
    
    setBleDevice({
      device: null,
      server: null,
      service: null,
      txCharacteristic: null,
      rxCharacteristic: null
    });
    
    setConnectionStatus('disconnected');
    setDeviceName(null);
    setDeviceId(null);
    setConnectionError(null);
    setReconnectAttempts(0);
    setMessageQueue([]);
    
    toast({ title: "Device Disconnected" });
  }, [toast, cleanupConnection, stopHeartbeat]);

  const handleUnexpectedDisconnect = useCallback(async () => {
    console.log("Unexpected disconnect detected");
    setConnectionStatus('reconnecting');
    
    if (reconnectAttempts < RECONNECT_ATTEMPTS && lastDeviceInfo) {
      setReconnectAttempts(prev => prev + 1);
      toast({ 
        title: "Connection Lost", 
        description: `Attempting to reconnect... (${reconnectAttempts + 1}/${RECONNECT_ATTEMPTS})` 
      });
      
      setTimeout(async () => {
        try {
          await reconnect();
        } catch (error) {
          console.error("Reconnection failed:", error);
          if (reconnectAttempts >= RECONNECT_ATTEMPTS - 1) {
            setConnectionStatus('error');
            setConnectionError('Failed to reconnect after multiple attempts');
            toast({ 
              variant: "destructive", 
              title: "Reconnection Failed", 
              description: "Please try connecting manually" 
            });
          }
        }
      }, RECONNECT_DELAY);
    } else {
      handleDisconnect();
    }
  }, [reconnectAttempts, lastDeviceInfo, toast, handleDisconnect]);

  const validateEnvironment = async (): Promise<boolean> => {
    try {
      const validation = await validateBLEEnvironment();
      
      if (validation.issues.length > 0) {
        const criticalIssues = validation.issues.filter(issue => 
          issue.includes('not supported') || issue.includes('HTTPS required')
        );
        
        if (criticalIssues.length > 0) {
          toast({
            variant: "destructive",
            title: "BLE Environment Issues",
            description: criticalIssues[0],
          });
          return false;
        } else {
          toast({
            variant: "destructive",
            title: "BLE Warning",
            description: validation.issues[0],
          });
        }
      }
      
      return validation.supported && validation.available;
    } catch (error) {
      console.error('Environment validation failed:', error);
      return false;
    }
  };

  const scanDevices = async (): Promise<BluetoothDevice[]> => {
    if (!(await validateEnvironment())) return [];
    
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: DEFAULT_PATTERNS,
        optionalServices: [UART_SERVICE_UUID]
      });
      return [device];
    } catch (error) {
      const bleError = createBLEError(error);
      console.error("Device scan failed:", bleError);
      throw bleError;
    }
  };

  const connectToDevice = async (device: BluetoothDevice): Promise<BLEDevice> => {
    setConnectionStatus('connecting');
    setConnectionError(null);
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
    );
    
    const connectionPromise = async (): Promise<BLEDevice> => {
      if (!device.gatt) {
        throw new Error("GATT server not available on this device.");
      }
      
      device.addEventListener('gattserverdisconnected', handleUnexpectedDisconnect);
      
      const server = await device.gatt.connect();
      console.log("GATT server connected");
      
      const service = await server.getPrimaryService(UART_SERVICE_UUID);
      console.log("UART service found");
      
      const rx = await service.getCharacteristic(RX_CHARACTERISTIC_UUID);
      const tx = await service.getCharacteristic(TX_CHARACTERISTIC_UUID);
      console.log("Characteristics found");
      
      await tx.startNotifications();
      tx.addEventListener('characteristicvaluechanged', handleNotifications);
      console.log("Notifications started");
      
      // Detect device capabilities
      const capabilities = await detectDeviceCapabilities(service, tx, rx);
      console.log("Device capabilities detected:", capabilities);
      setDeviceCapabilities(capabilities);
      
      return {
        device,
        server,
        service,
        rxCharacteristic: rx,
        txCharacteristic: tx
      };
    };
    
    return Promise.race([connectionPromise(), timeoutPromise]);
  };

  const testConnection = async (): Promise<boolean> => {
    if (!isConnected || !bleDevice.rxCharacteristic) {
      return false;
    }
    
    try {
      // Send a small test message to verify connection
      const testMessage = 'PING\n';
      const encoder = new TextEncoder();
      await bleDevice.rxCharacteristic.writeValue(encoder.encode(testMessage));
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  const connect = async (deviceFilter?: BluetoothLEScanFilter[] | keyof typeof DEVICE_FILTERS) => {
    if (!(await validateEnvironment())) return;
    
    try {
      setConnectionStatus('connecting');
      
      let filters: BluetoothLEScanFilter[];
      
      if (Array.isArray(deviceFilter)) {
        filters = deviceFilter;
      } else if (typeof deviceFilter === 'string' && deviceFilter in DEVICE_FILTERS) {
        filters = DEVICE_FILTERS[deviceFilter];
      } else {
        filters = DEFAULT_PATTERNS;
      }
      
      const requestOptions = { 
        filters, 
        optionalServices: [UART_SERVICE_UUID] 
      };
      
      const device = await navigator.bluetooth.requestDevice(requestOptions);
      
      const connectedDevice = await connectToDevice(device);
      
      setBleDevice(connectedDevice);
      setConnectionStatus('connected');
      setDeviceName(device.name || 'Unknown Device');
      setDeviceId(device.id);
      setReconnectAttempts(0);
      connectionMonitor.reset();
      
      // Store device info for reconnection  
      const deviceInfo = await getDeviceInfo(device);
      setLastDeviceInfo({ id: deviceInfo.id, name: deviceInfo.name });
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify({ id: deviceInfo.id, name: deviceInfo.name }));
      
      startHeartbeat();
      
      toast({ 
        title: "Device Connected", 
        description: `Successfully connected to ${device.name || 'Unknown Device'}` 
      });
      
    } catch (error) {
      const bleError = createBLEError(error);
      console.error("Bluetooth connection failed:", bleError);
      
      setConnectionStatus('error');
      setConnectionError(bleError);
      
      toast({ 
        variant: "destructive", 
        title: "Connection Failed", 
        description: bleError.message,
      });
      
      handleDisconnect();
    }
  };

  const reconnect = async (): Promise<void> => {
    if (!lastDeviceInfo) {
      throw new Error("No previous device information available for reconnection");
    }
    
    try {
      // Try to reconnect to the same device
      await connect([{ services: [UART_SERVICE_UUID] }]);
    } catch (error) {
      const bleError = createBLEError(error);
      console.error("Reconnection failed:", bleError);
      throw bleError;
    }
  };

  const disconnect = async () => {
    try {
      setConnectionStatus('disconnected');
      
      if (bleDevice.device?.gatt?.connected) {
        cleanupConnection();
        bleDevice.device.gatt.disconnect();
      }
      
      handleDisconnect();
    } catch (error) {
      console.error("Error during disconnect:", error);
      handleDisconnect(); // Force cleanup
    }
  };
  
  const sendSerial = async (data: string): Promise<boolean> => {
    if (!bleDevice.rxCharacteristic || !isConnected) {
      toast({ variant: "destructive", title: "Not Connected", description: "Cannot send data, no device connected." });
      return false;
    }
    
    if (!data || data.trim() === '') {
      toast({ variant: "destructive", title: "Invalid Data", description: "Cannot send empty data." });
      return false;
    }
    
    try {
      const dataToSend = data.trim() + '\n';
      const maxChunkSize = deviceCapabilities?.maxMTU ? deviceCapabilities.maxMTU - 3 : MAX_MESSAGE_LENGTH;
      
      // Use utility function for message chunking
      const chunks = chunkMessage(dataToSend, maxChunkSize);
      
      for (const chunk of chunks) {
        const encoder = new TextEncoder();
        
        // Choose write method based on device capabilities
        if (deviceCapabilities?.supportsWriteWithoutResponse) {
          await bleDevice.rxCharacteristic.writeValueWithoutResponse(encoder.encode(chunk));
        } else {
          await bleDevice.rxCharacteristic.writeValue(encoder.encode(chunk));
        }
        
        // Small delay between chunks if multiple
        if (chunks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      const timestamp = new Date().toLocaleTimeString();
      setSerialData(prev => [...prev, `[${timestamp}] -> ${data}`]);
      return true;
      
    } catch (error) {
      const bleError = createBLEError(error);
      console.error("Failed to send data:", bleError);
      
      // Check if it's a connection error
      if (bleError.code === 'GATT_SERVER_ERROR' || bleError.code === 'DEVICE_DISCONNECTED') {
        handleUnexpectedDisconnect();
      }
      
      toast({ 
        variant: "destructive", 
        title: "Send Error", 
        description: bleError.message 
      });
      return false;
    }
  };

  const clearSerial = () => setSerialData([]);

  const addControl = (type: ControlType, label: string) => {
    const newControl: ControlComponent = {
      id: `${type}-${Date.now()}`,
      type,
      label,
    };
    if (type === 'button') {
        (newControl as any).command = `BTN:${newControl.id}:1`;
    }
    if (type === 'switch') {
        (newControl as any).onCommand = `SW:${newControl.id}:1`;
        (newControl as any).offCommand = `SW:${newControl.id}:0`;
    }
    if (type === 'slider') {
      (newControl as any).orientation = 'horizontal';
      (newControl as any).min = 0;
      (newControl as any).max = 100;
      (newControl as any).prefix = `SLD:${newControl.id}`;
    }
    setControls(prev => [...prev, newControl]);
  };

  const removeControl = (id: string) => {
    setControls(prev => prev.filter(c => c.id !== id));
  };
  
  const updateControl = (id: string, updates: Partial<ControlComponent>) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  
  const saveProfile = (name: string) => {
    if (!name.trim()) {
        toast({ variant: "destructive", title: "Invalid Name", description: "Profile name cannot be empty."});
        return;
    }
    const newProfile: ControlProfile = { name, controls };
    const updatedProfiles = [...profiles.filter(p => p.name !== name), newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
    toast({ title: "Profile Saved", description: `Profile "${name}" has been saved.`});
  };

  const loadProfile = (name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile) {
      setControls(profile.controls);
      toast({ title: "Profile Loaded", description: `Profile "${name}" has been loaded.`});
    } else {
      toast({ variant: "destructive", title: "Load Error", description: "Profile not found."});
    }
  };

  const deleteProfile = (name: string) => {
    const updatedProfiles = profiles.filter(p => p.name !== name);
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
    toast({ title: "Profile Deleted", description: `Profile "${name}" has been deleted.`});
  };

  const getProfileNames = () => profiles.map(p => p.name);

  const value = {
    connectionStatus,
    isConnected,
    deviceName,
    deviceId,
    connectionError,
    connectionQuality,
    deviceCapabilities,
    connect,
    disconnect,
    reconnect,
    scanDevices,
    testConnection,
    validateEnvironment,
    serialData,
    sendSerial,
    clearSerial,
    controls,
    addControl,
    removeControl,
    updateControl,
    setControls,
    profiles,
    saveProfile,
    loadProfile,
    deleteProfile,
    getProfileNames,
    isEditMode,
    setIsEditMode
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

    