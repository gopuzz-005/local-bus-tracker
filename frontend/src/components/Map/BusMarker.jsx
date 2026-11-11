import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom bus-shaped div icon
const busIcon = new L.DivIcon({
  html: `<div class="bg-blue-600 rounded-full p-1.5 shadow-lg border-2 border-white flex items-center justify-center transition-transform hover:scale-110" style="width: 32px; height: 32px;">
           <span style="font-size: 16px; line-height: 1;">🚌</span>
         </div>`,
  className: 'custom-bus-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const BusMarker = ({ position, busInfo }) => {
  if (!position) return null;

  return (
    <Marker position={position} icon={busIcon}>
      <Popup>
        <div className="font-sans">
          <h3 className="font-bold text-lg text-slate-800">{busInfo?.name || 'Bus'}</h3>
          <p className="text-sm font-semibold text-blue-600">{busInfo?.busNumber || 'Unknown Number'}</p>
          <div className="mt-2 text-xs text-slate-600 space-y-1">
            <p><strong>Status:</strong> {busInfo?.status || 'LIVE'}</p>
            {busInfo?.nextStop && <p><strong>Next Stop:</strong> {busInfo.nextStop}</p>}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default BusMarker;
