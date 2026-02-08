
import { Shipment } from './types';

export const SHIPMENTS: Shipment[] = [
  {
    id: 'SF2043892GH',
    status: 'IN TRANSIT',
    origin: { id: '1', name: 'Shanghai, China', lat: 31.23, lng: 121.47, code: 'PVG' },
    destination: { id: '2', name: 'Los Angeles, USA', lat: 34.05, lng: -118.24, code: 'JFK' },
    departureDate: 'OCT 15, 2024',
    arrivalDate: 'DEC 20, 2024',
    duration: '21H',
    type: 'air',
    progress: 0.65
  },
  {
    id: 'SG3840291KR',
    status: 'IN TRANSIT',
    origin: { id: '3', name: 'Mumbai Port, India', lat: 18.94, lng: 72.84, code: 'INB' },
    destination: { id: '4', name: 'New York, USA', lat: 40.71, lng: -74.00, code: 'JFK' },
    departureDate: 'SEP 18, 2024',
    arrivalDate: 'NOV 20, 2024',
    duration: '9H',
    type: 'air',
    progress: 0.3
  },
  {
    id: 'DE9982736BR',
    status: 'PENDING',
    origin: { id: '5', name: 'Tokyo, Japan', lat: 35.67, lng: 139.65, code: 'NRT' },
    destination: { id: '6', name: 'Sydney, Australia', lat: -33.86, lng: 151.20, code: 'SYD' },
    departureDate: 'OCT 2, 2024',
    arrivalDate: 'DEC 2, 2024',
    duration: '14H',
    type: 'air',
    progress: 0
  },
  {
    id: 'FR5678920NL',
    status: 'ARRIVED',
    origin: { id: '7', name: 'Dubai, UAE', lat: 25.20, lng: 55.27, code: 'DXB' },
    destination: { id: '8', name: 'Rotterdam, Netherlands', lat: 51.92, lng: 4.47, code: 'RTM' },
    departureDate: 'AUG 10, 2024',
    arrivalDate: 'OCT 15, 2024',
    duration: '',
    type: 'sea',
    progress: 1
  },
  {
    id: 'JP8495732JP',
    status: 'IN TRANSIT',
    origin: { id: '9', name: 'Yokohama Port', lat: 35.44, lng: 139.63, code: 'YOK' },
    destination: { id: '10', name: 'Chicago', lat: 41.87, lng: -87.62, code: 'ORD' },
    departureDate: 'SEP 22, 2024',
    arrivalDate: 'NOV 18, 2024',
    duration: '21H',
    type: 'sea',
    progress: 0.8
  },
  {
    id: 'AU4561289SG',
    status: 'DELAYED',
    origin: { id: '11', name: 'Dallas, USA', lat: 32.77, lng: -96.79, code: 'DFW' },
    destination: { id: '12', name: 'Melbourne, Australia', lat: -37.81, lng: 144.96, code: 'MEL' },
    departureDate: 'OCT 12, 2024',
    arrivalDate: 'DEC 20, 2024',
    duration: '9H',
    type: 'air',
    progress: 0.45
  },
  {
    id: 'BR2348920ZA',
    status: 'PENDING',
    origin: { id: '13', name: 'Port of São Paulo, Brazil', lat: -23.55, lng: -46.63, code: 'GRU' },
    destination: { id: '14', name: 'New Harbour, France', lat: 43.29, lng: 5.36, code: 'LHR' },
    departureDate: 'OCT 1, 2024',
    arrivalDate: 'DEC 15, 2024',
    duration: '21H',
    type: 'sea',
    progress: 0
  }
];
