import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function GISMap({ disasters = [], sosAlerts = [], requests = [], center = [19.0760, 72.8777], zoom = 12 }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map instance once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Plot Disasters with radius circles
    disasters.forEach(d => {
      if (!d.latitude || !d.longitude) return;

      const severityColor = d.severity === 'Critical' ? '#dc2626' : d.severity === 'High' ? '#ea580c' : '#eab308';

      // Circle representing affected radius
      const circle = L.circle([d.latitude, d.longitude], {
        color: severityColor,
        fillColor: severityColor,
        fillOpacity: 0.15,
        radius: (d.radius_km || 10) * 1000
      });

      // Incident Marker icon
      const icon = L.divIcon({
        className: 'custom-disaster-marker',
        html: `<div style="background-color: ${severityColor}; color: white; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-weight: bold; font-size: 11px;">⚠️</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([d.latitude, d.longitude], { icon });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
          <h4 style="margin: 0 0 4px; color: ${severityColor}; font-weight: bold;">[${d.id}] ${d.title}</h4>
          <p style="margin: 0 0 4px;"><strong>Type:</strong> ${d.type} | <strong>Severity:</strong> ${d.severity}</p>
          <p style="margin: 0 0 4px;"><strong>Area:</strong> ${d.affected_area} (Radius: ${d.radius_km}km)</p>
          <p style="margin: 0; font-size: 12px; color: #475569;">${d.description.slice(0, 100)}...</p>
        </div>
      `);

      circle.addTo(layerGroup);
      marker.addTo(layerGroup);
    });

    // 2. Plot SOS Emergency Distress Beacons
    sosAlerts.forEach(sos => {
      if (!sos.latitude || !sos.longitude) return;

      const isLive = sos.status === 'Active';
      const sosIcon = L.divIcon({
        className: 'sos-marker',
        html: `<div style="background-color: #ef4444; color: white; border: 3px solid #ffffff; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(239,68,68,0.8); font-weight: 900; font-size: 11px; animation: ${isLive ? 'pulse 1s infinite' : 'none'};">SOS</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([sos.latitude, sos.longitude], { icon: sosIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px;">
          <h4 style="margin: 0 0 4px; color: #dc2626; font-weight: bold;">🚨 [${sos.id}] EMERGENCY DISTRESS</h4>
          <p style="margin: 0 0 4px;"><strong>Caller:</strong> ${sos.citizen_name} (${sos.phone})</p>
          <p style="margin: 0 0 4px;"><strong>Location:</strong> ${sos.location_name}</p>
          <p style="margin: 0 0 4px;"><strong>Status:</strong> <span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${sos.status}</span></p>
          <p style="margin: 0; color: #334155; font-size: 12px; font-style: italic;">"${sos.message || 'Immediate rescue needed!'}"</p>
        </div>
      `);

      marker.addTo(layerGroup);
    });

    // 3. Plot Relief Requests
    requests.forEach(req => {
      if (!req.latitude || !req.longitude) return;

      const reqIcon = L.divIcon({
        className: 'request-marker',
        html: `<div style="background-color: #2563eb; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-weight: bold; font-size: 10px;">📦</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([req.latitude, req.longitude], { icon: reqIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px;">
          <h4 style="margin: 0 0 4px; color: #1e40af; font-weight: bold;">[${req.id}] ${req.request_type} Need</h4>
          <p style="margin: 0 0 4px;"><strong>Citizen:</strong> ${req.citizen_name}</p>
          <p style="margin: 0 0 4px;"><strong>Affected:</strong> ${req.people_affected} people | <strong>Urgency:</strong> ${req.urgency}</p>
          <p style="margin: 0 0 4px;"><strong>Address:</strong> ${req.address}</p>
          <p style="margin: 0; font-weight: bold; color: #0f172a;">Status: ${req.status}</p>
        </div>
      `);

      marker.addTo(layerGroup);
    });

    // Recalculate size to prevent blank map tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [disasters, sosAlerts, requests, center, zoom]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
