
export type DeliveryStatus = 'PENDING' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELAYED';

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  h3Index?: string; // Res 9 index
  address?: string;
}

export interface HexMetrics {
  h3Index: string;
  chargePerKm: number;
  timeToCrossMins: number;
  avgDistanceKm: number;
  congestionFactor: number;
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
  progress: number;
  priority: 'low' | 'medium' | 'high';
  h3Current?: string; // Current location in H3
  delayReason?: string;
  metrics?: {
    hexDistance: number;
    congestionScore: number;
    basePrice: number;
    timeToDestination: number;
  };
}

export interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  active: boolean;
  type: 'RESTRICTED' | 'HUB' | 'CUSTOMER_ZONE';
  h3Cell?: string;
}
