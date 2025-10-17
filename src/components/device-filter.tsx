"use client";

import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Bluetooth, 
  Search, 
  Filter, 
  Cpu, 
  Zap,
  Wifi,
  Settings,
  Plus,
  X
} from "lucide-react";
import { useState } from "react";
import { DEVICE_FILTERS } from "@/lib/ble-utils";

type FilterType = keyof typeof DEVICE_FILTERS;

const DeviceFilter = () => {
  const { connect, connectionStatus } = useAppContext();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ARDUINO');
  const [customFilters, setCustomFilters] = useState<BluetoothLEScanFilter[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customService, setCustomService] = useState('');
  
  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting';

  const filterDescriptions = {
    ARDUINO: "Arduino boards and compatible devices",
    ESP32: "ESP32 development boards and modules", 
    ESP8266: "ESP8266 WiFi modules and boards",
    NORDIC: "Nordic semiconductor devices (nRF series)",
    CUSTOM: "Custom device filters you've defined"
  };

  const filterIcons = {
    ARDUINO: <Cpu className="h-4 w-4" />,
    ESP32: <Wifi className="h-4 w-4" />,
    ESP8266: <Wifi className="h-4 w-4" />,
    NORDIC: <Zap className="h-4 w-4" />,
    CUSTOM: <Settings className="h-4 w-4" />
  };

  const handleConnect = async () => {
    if (selectedFilter === 'CUSTOM' && customFilters.length > 0) {
      await connect(customFilters);
    } else {
      await connect(selectedFilter);
    }
  };

  const addCustomFilter = () => {
    if (!customName && !customService) return;
    
    const newFilter: BluetoothLEScanFilter = {};
    
    if (customName.trim()) {
      newFilter.namePrefix = customName.trim();
    }
    
    if (customService.trim()) {
      // Validate service UUID format
      const serviceUUID = customService.trim().toLowerCase();
      if (serviceUUID.match(/^[0-9a-f-]{8,36}$/)) {
        newFilter.services = [serviceUUID];
      }
    }
    
    if (Object.keys(newFilter).length > 0) {
      setCustomFilters(prev => [...prev, newFilter]);
      setCustomName('');
      setCustomService('');
    }
  };

  const removeCustomFilter = (index: number) => {
    setCustomFilters(prev => prev.filter((_, i) => i !== index));
  };

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'CUSTOM') {
      return customFilters.length;
    }
    return DEVICE_FILTERS[filterType].length;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          Device Filters
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filter Selection */}
        <div className="space-y-3">
          <Label htmlFor="filter-select" className="text-sm font-medium">
            Device Type
          </Label>
          <Select
            value={selectedFilter}
            onValueChange={(value) => setSelectedFilter(value as FilterType)}
          >
            <SelectTrigger id="filter-select">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {filterIcons[selectedFilter]}
                  {selectedFilter}
                  <Badge variant="secondary" className="ml-2">
                    {getFilterCount(selectedFilter)}
                  </Badge>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(DEVICE_FILTERS).map((filterType) => (
                <SelectItem key={filterType} value={filterType}>
                  <div className="flex items-center gap-2 w-full">
                    {filterIcons[filterType as FilterType]}
                    <div className="flex-1">
                      <div className="font-medium">{filterType}</div>
                      <div className="text-xs text-muted-foreground">
                        {filterDescriptions[filterType as FilterType]}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getFilterCount(filterType as FilterType)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Filters</Label>
          <div className="p-3 bg-muted/50 rounded-md">
            {selectedFilter !== 'CUSTOM' ? (
              <div className="space-y-1">
                {DEVICE_FILTERS[selectedFilter].map((filter, index) => (
                  <Badge key={index} variant="outline" className="mr-1 mb-1">
                    {filter.namePrefix && `Name: ${filter.namePrefix}`}
                    {filter.services && `Service: ${filter.services[0]?.slice(0, 8)}...`}
                  </Badge>
                ))}
                {getFilterCount(selectedFilter) === 0 && (
                  <span className="text-xs text-muted-foreground">No filters defined</span>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {customFilters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex-1">
                      {filter.namePrefix && `Name: ${filter.namePrefix}`}
                      {filter.services && `Service: ${filter.services[0]?.slice(0, 8)}...`}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCustomFilter(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {customFilters.length === 0 && (
                  <span className="text-xs text-muted-foreground">No custom filters defined</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch 
              id="advanced-mode" 
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
            <Label htmlFor="advanced-mode" className="text-sm">
              Advanced Options
            </Label>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/20">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Custom Filters</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="custom-name" className="text-xs">Device Name Prefix</Label>
                    <Input
                      id="custom-name"
                      placeholder="e.g., MyDevice"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="custom-service" className="text-xs">Service UUID</Label>
                    <Input
                      id="custom-service"
                      placeholder="e.g., 12345678-1234-..."
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={addCustomFilter}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={!customName && !customService}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Custom Filter
                </Button>
              </div>

              {selectedFilter === 'CUSTOM' && customFilters.length > 0 && (
                <>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    Custom filters will be used for device discovery. Make sure your device 
                    matches at least one of the defined filters.
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Connect Button */}
        <Button 
          onClick={handleConnect}
          className="w-full"
          disabled={isConnecting || (selectedFilter === 'CUSTOM' && customFilters.length === 0)}
        >
          {isConnecting ? (
            <>
              <Search className="h-4 w-4 mr-2 animate-spin" />
              Searching for {selectedFilter.toLowerCase()} devices...
            </>
          ) : (
            <>
              <Bluetooth className="h-4 w-4 mr-2" />
              Connect {selectedFilter} Device
              {selectedFilter === 'CUSTOM' && customFilters.length === 0 && (
                <span className="ml-2 text-xs opacity-75">
                  (Add filters first)
                </span>
              )}
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 bg-blue-50/50 border border-blue-200/50 rounded-md">
          <div className="font-medium mb-1">💡 Tip</div>
          Filters help you find the right device faster by narrowing down the search. 
          Your browser will only show devices that match the selected criteria.
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceFilter;