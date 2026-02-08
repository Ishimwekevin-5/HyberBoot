
import { Delivery } from './types';

export const DELIVERIES: Delivery[] = [
  {
    id: 'RW-KGL-001',
    status: 'OUT_FOR_DELIVERY',
    pickup: { id: 'H1', name: 'Kigali Logistics Hub', lat: -1.9441, lng: 30.0619 },
    dropoff: { id: 'D1', name: 'Nyabugogo Market', lat: -1.9392, lng: 30.0445 },
    driverName: 'Jean-Luc Habimana',
    vehicleType: 'electric',
    startTime: '08:00 AM',
    estimatedArrival: '08:45 AM',
    progress: 0.35,
    priority: 'high'
  }
];
