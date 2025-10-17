"use client";

import { useAppContext } from "@/contexts/app-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Bluetooth, 
  BluetoothConnected, 
  BluetoothSearching, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Signal,
  Battery
} from "lucide-react";
import { useState } from "react";

const ConnectionStatus = () => {
  const {
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
    testConnection,
    validateEnvironment
  } = useAppContext();

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <BluetoothConnected className="h-4 w-4" />;
      case 'connecting':
      case 'reconnecting':
        return <BluetoothSearching className="h-4 w-4 animate-pulse" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bluetooth className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500 hover:bg-green-600';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getQualityIcon = () => {
    if (!connectionQuality) return null;
    
    switch (connectionQuality.signal) {
      case 'excellent':
        return <Signal className="h-4 w-4 text-green-500" />;
      case 'good':
        return <Signal className="h-4 w-4 text-blue-500" />;
      case 'poor':
        return <Signal className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <Signal className="h-4 w-4 text-red-500" />;
      default:
        return <Signal className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnect();
    } catch (error) {
      console.error('Manual reconnect failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await testConnection();
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async () => {
    await connect();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          Connection Status
          <Badge 
            variant="secondary" 
            className={`ml-auto text-white ${getStatusColor()}`}
          >
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Device Information */}
        {deviceName && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Device:</span>
              <span className="text-sm font-medium">{deviceName}</span>
            </div>
            {deviceId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID:</span>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {deviceId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Connection Quality */}
        {connectionQuality && isConnected && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  {getQualityIcon()}
                  Signal Quality:
                </span>
                <span className="text-sm font-medium capitalize">
                  {connectionQuality.signal}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Stability</span>
                  <span>{connectionQuality.stability}%</span>
                </div>
                <Progress value={connectionQuality.stability} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="font-medium">{connectionQuality.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Errors:</span>
                  <span className="font-medium">{connectionQuality.errors}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Device Capabilities */}
        {deviceCapabilities && isConnected && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Device Capabilities
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Notifications:</span>
                  {deviceCapabilities.supportsNotifications ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                    <XCircle className="h-3 w-3 text-red-500" />
                  }
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Write:</span>
                  {deviceCapabilities.supportsWrite ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                    <XCircle className="h-3 w-3 text-red-500" />
                  }
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fast Write:</span>
                  {deviceCapabilities.supportsWriteWithoutResponse ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> : 
                    <XCircle className="h-3 w-3 text-red-500" />
                  }
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max MTU:</span>
                  <span className="font-medium">{deviceCapabilities.maxMTU}B</span>
                </div>

                {deviceCapabilities.batteryService && (
                  <div className="flex items-center justify-between col-span-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Battery className="h-3 w-3" />
                      Battery Service:
                    </span>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Information */}
        {connectionError && (
          <div className="space-y-2">
            <Separator />
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-800">
                    Connection Error
                  </p>
                  <p className="text-xs text-red-600">
                    {connectionError.message}
                  </p>
                  {connectionError.code && (
                    <p className="text-xs text-red-500 font-mono">
                      Code: {connectionError.code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect} 
              className="flex-1"
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? (
                <>
                  <BluetoothSearching className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Connect Device
                </>
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleTestConnection} 
                variant="outline" 
                size="sm"
                disabled={isTesting}
              >
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
              
              <Button 
                onClick={handleReconnect} 
                variant="outline" 
                size="sm"
                disabled={isReconnecting}
              >
                {isReconnecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              
              <Button 
                onClick={disconnect} 
                variant="destructive" 
                size="sm"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;