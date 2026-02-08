
export type DeliveryStatus = 'PENDING' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELAYED';

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface Delivery {
  id: string;
  status: DeliveryStatus;
  pickup: Location;
  dropoff: Location;
  driverName: string;
  vehicleType: 'van' | 'bike' | 'truck' | 'electric';
  startTime: string;
  estimatedArrival: string;
  progress: number; // 0 to 1
  priority: 'low' | 'medium' | 'high';
}

export interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  active: boolean;
  type: 'RESTRICTED' | 'HUB' | 'CUSTOMER_ZONE';
}

export interface Marker {
  id: string;
  type: 'vehicle' | 'hub' | 'warning' | 'cluster';
  lat: number;
  lng: number;
  value?: number;
}
