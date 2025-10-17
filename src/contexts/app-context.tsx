
"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ControlComponent, ControlProfile, ControlType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  isConnected: boolean;
  deviceName: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  serialData: string[];
  sendSerial: (data: string) => void;
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

// Nordic UART Service
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
// RX Characteristic (App -> Device)
const RX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
// TX Characteristic (Device -> App)
const TX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";


export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [txCharacteristic, setTxCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [rxCharacteristic, setRxCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const [serialData, setSerialData] = useState<string[]>([]);
  const [controls, setControls] = useState<ControlComponent[]>([]);
  const [profiles, setProfiles] = useState<ControlProfile[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

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

  const handleNotifications = useCallback((event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(value);
      setSerialData(prev => [...prev, `<- ${text}`]);
    }
  }, []);
  
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setDeviceName(null);
    setDevice(null);
    setTxCharacteristic(null);
    setRxCharacteristic(null);
    toast({ title: "Device Disconnected" });
  }, [toast]);

  const connect = async () => {
    if (typeof window === 'undefined' || !navigator.bluetooth) {
      toast({
        variant: "destructive",
        title: "Web Bluetooth Not Supported",
        description: "Please use a compatible browser like Chrome or Edge.",
      });
      return;
    }
    try {
      const bleDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [UART_SERVICE_UUID]
      });

      if (!bleDevice.gatt) {
        throw new Error("GATT server not available on this device.");
      }
      
      setDevice(bleDevice);
      bleDevice.addEventListener('gattserverdisconnected', handleDisconnect);
      
      const server = await bleDevice.gatt.connect();
      
      const service = await server.getPrimaryService(UART_SERVICE_UUID);
      const rx = await service.getCharacteristic(RX_CHARACTERISTIC_UUID);
      const tx = await service.getCharacteristic(TX_CHARACTERISTIC_UUID);
      
      setRxCharacteristic(rx);
      setTxCharacteristic(tx);

      await tx.startNotifications();
      tx.addEventListener('characteristicvaluechanged', handleNotifications);

      setIsConnected(true);
      setDeviceName(bleDevice.name || 'Unknown Device');
      toast({ title: "Device Connected", description: `Successfully connected to ${bleDevice.name || 'Unknown Device'}` });

    } catch (error) {
      console.error("Bluetooth connection failed:", error);
      toast({ variant: "destructive", title: "Connection Failed", description: String(error) });
      if (device) {
        device.removeEventListener('gattserverdisconnected', handleDisconnect);
        device.gatt?.disconnect();
      }
      handleDisconnect(); // Reset state
    }
  };

  const disconnect = async () => {
    if (device && device.gatt?.connected) {
      if (txCharacteristic) {
        try {
            await txCharacteristic.stopNotifications();
            txCharacteristic.removeEventListener('characteristicvaluechanged', handleNotifications);
        } catch (error) {
            console.error("Error stopping notifications:", error);
        }
      }
      device.removeEventListener('gattserverdisconnected', handleDisconnect);
      device.gatt.disconnect();
    }
    // State is reset by the handleDisconnect callback
  };
  
  const sendSerial = (data: string) => {
    if (!rxCharacteristic || !isConnected) {
        toast({ variant: "destructive", title: "Not Connected", description: "Cannot send data, no device connected." });
        return;
    }
    const encoder = new TextEncoder();
    // Append newline character as many BLE UART implementations expect it
    const dataToSend = data + '\n';
    rxCharacteristic.writeValue(encoder.encode(dataToSend))
      .then(() => {
        setSerialData(prev => [...prev, `-> ${data}`]);
      })
      .catch(error => {
        console.error("Failed to send data:", error);
        toast({ variant: "destructive", title: "Send Error", description: String(error) });
      });
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
    isConnected,
    deviceName,
    connect,
    disconnect,
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

    