"use client";

import { AppProvider } from "@/contexts/app-context";
import ConnectionStatus from "@/components/connection-status";
import DeviceFilter from "@/components/device-filter";

export default function BLEExample() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              KofiBlu - Robust BLE Connection
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enhanced Bluetooth Low Energy implementation with advanced connection management,
              device filtering, and real-time monitoring capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Device Filter */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Device Discovery</h2>
              <DeviceFilter />
            </div>

            {/* Connection Status */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Connection Status</h2>
              <ConnectionStatus />
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Enhanced BLE Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">🔄 Connection Management</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Automatic reconnection</li>
                  <li>• Connection timeout handling</li>
                  <li>• Health monitoring</li>
                  <li>• Quality assessment</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">🛡️ Error Handling</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Structured error types</li>
                  <li>• Recovery mechanisms</li>
                  <li>• User-friendly messages</li>
                  <li>• Debug information</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-purple-600">📡 Device Detection</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Smart filtering</li>
                  <li>• Capability detection</li>
                  <li>• Custom filters</li>
                  <li>• Device information</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-orange-600">📊 Data Management</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Message chunking</li>
                  <li>• MTU optimization</li>
                  <li>• Write mode selection</li>
                  <li>• Data validation</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">🔍 Monitoring</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Real-time status</li>
                  <li>• Signal quality</li>
                  <li>• Connection stability</li>
                  <li>• Performance metrics</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-teal-600">⚡ Performance</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Heartbeat monitoring</li>
                  <li>• Latency tracking</li>
                  <li>• Error counting</li>
                  <li>• Stability scoring</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Implementation Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Implementation Notes</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>
                <strong>Environment Requirements:</strong> This implementation requires HTTPS 
                (except on localhost) and a Web Bluetooth compatible browser (Chrome, Edge).
              </p>
              <p>
                <strong>Device Compatibility:</strong> Works with any BLE device that implements 
                the Nordic UART Service (6E400001-B5A3-F393-E0A9-E50E24DCCA9E).
              </p>
              <p>
                <strong>Error Recovery:</strong> The system automatically attempts reconnection 
                up to 3 times with exponential backoff on unexpected disconnections.
              </p>
              <p>
                <strong>Performance Monitoring:</strong> Connection quality is continuously 
                monitored using heartbeat messages and latency measurements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppProvider>
  );
}