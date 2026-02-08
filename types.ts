
export type ShipmentStatus = 'IN TRANSIT' | 'PENDING' | 'ARRIVED' | 'DELAYED';

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  code: string;
}

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  origin: Location;
  destination: Location;
  departureDate: string;
  arrivalDate: string;
  duration: string;
  type: 'air' | 'sea' | 'rail' | 'road';
  progress: number; // 0 to 1
}

export interface Marker {
  id: string;
  type: 'plane' | 'ship' | 'truck' | 'warning' | 'cluster';
  lat: number;
  lng: number;
  value?: number;
  label?: string;
}
