
import { Delivery } from './types';

export const DELIVERIES: Delivery[] = [
  {
    id: 'DEL-9921',
    status: 'OUT_FOR_DELIVERY',
    pickup: { id: 'H1', name: 'Downtown Hub', lat: 40.7128, lng: -74.0060 },
    dropoff: { id: 'D1', name: 'West Village Office', lat: 40.7336, lng: -74.0027 },
    driverName: 'Alex Rivera',
    vehicleType: 'van',
    startTime: '09:00 AM',
    estimatedArrival: '10:15 AM',
    progress: 0.45,
    priority: 'high'
  },
  {
    id: 'DEL-8842',
    status: 'PICKED_UP',
    pickup: { id: 'H2', name: 'Brooklyn Warehouse', lat: 40.6782, lng: -73.9442 },
    dropoff: { id: 'D2', name: 'Park Slope Resid.', lat: 40.6661, lng: -73.9813 },
    driverName: 'Sarah Chen',
    vehicleType: 'bike',
    startTime: '09:30 AM',
    estimatedArrival: '10:00 AM',
    progress: 0.2,
    priority: 'medium'
  },
  {
    id: 'DEL-7731',
    status: 'OUT_FOR_DELIVERY',
    pickup: { id: 'H1', name: 'Downtown Hub', lat: 40.7128, lng: -74.0060 },
    dropoff: { id: 'D3', name: 'Upper East Side', lat: 40.7736, lng: -73.9566 },
    driverName: 'Marcus Bolt',
    vehicleType: 'electric',
    startTime: '08:45 AM',
    estimatedArrival: '09:50 AM',
    progress: 0.85,
    priority: 'low'
  },
  {
    id: 'DEL-4412',
    status: 'DELAYED',
    pickup: { id: 'H3', name: 'Jersey City Terminal', lat: 40.7178, lng: -74.0431 },
    dropoff: { id: 'D4', name: 'Hoboken Square', lat: 40.7440, lng: -74.0324 },
    driverName: 'Elena Rose',
    vehicleType: 'van',
    startTime: '08:00 AM',
    estimatedArrival: '08:30 AM',
    progress: 0.1,
    priority: 'high'
  }
];
