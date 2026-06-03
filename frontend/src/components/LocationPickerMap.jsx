import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const kangraBounds = {
  south: 31.0,
  north: 32.7,
  west: 75.0,
  east: 77.8
};

const isWithinKangra = (lat, lng) => {
  return lat >= kangraBounds.south && lat <= kangraBounds.north &&
         lng >= kangraBounds.west && lng <= kangraBounds.east;
};

const LocationMarker = ({ onLocationSelect, selectedLocation }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const location = {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6))
      };
      if (!isWithinKangra(location.latitude, location.longitude)) {
        alert('Please select a location within Kangra district, Himachal Pradesh.');
        return;
      }
      onLocationSelect(location);
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.latitude, selectedLocation.longitude]}>
      <Popup>
        <div>
          <strong>Selected Location</strong>
          <br />
          Lat: {selectedLocation.latitude}
          <br />
          Lon: {selectedLocation.longitude}
        </div>
      </Popup>
    </Marker>
  ) : null;
};

const LocationPickerMap = ({ onSelect, initialLocation, searchQuery }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [center, setCenter] = useState([32.1933, 76.2633]); // Center on Kangra district, Himachal Pradesh
  const [mapKey, setMapKey] = useState(0);

  // Update center when searchQuery changes (user types location)
  useEffect(() => {
    if (searchQuery && searchQuery.length > 3) {
      const geocodeLocation = async () => {
        try {
          const response = await axios.get('/api/geocode/search', {
            params: {
              q: searchQuery,
              format: 'json',
              limit: 5,
              countrycodes: 'in',
              viewbox: '75.0,32.7,77.8,31.0',
              bounded: 1
            }
          });
          const data = response.data || [];
          if (data.length > 0) {
            const validResult = data.find((item) => {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              return !Number.isNaN(lat) && !Number.isNaN(lon) && isWithinKangra(lat, lon);
            });
            if (validResult) {
              const lat = parseFloat(validResult.lat);
              const lon = parseFloat(validResult.lon);
              setCenter([lat, lon]);
              setMapKey(prev => prev + 1); // Force map re-render to center on new location
            }
          }
        } catch (err) {
          console.log('Geocoding error:', err);
        }
      };
      geocodeLocation();
    }
  }, [searchQuery]);

  useEffect(() => {
    // Try to get user's current location on first load
    if (navigator.geolocation && !initialLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (isWithinKangra(latitude, longitude)) {
            setCenter([latitude, longitude]);
            setSelectedLocation({
              latitude: parseFloat(latitude.toFixed(6)),
              longitude: parseFloat(longitude.toFixed(6))
            });
          } else {
            console.log('Geolocation outside Kangra district, keeping default map center.');
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    onSelect(location);
  };

  return (
    <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid #ddd' }}>
      <MapContainer
        key={mapKey}
        center={center}
        zoom={12}
        maxBounds={[[kangraBounds.south, kangraBounds.west], [kangraBounds.north, kangraBounds.east]]}
        maxBoundsViscosity={1}
        style={{ height: '350px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <LocationMarker
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
        />
      </MapContainer>
      <div style={{ padding: '10px', background: '#f9f9f9', fontSize: '0.85em', color: '#666' }}>
        💡 <strong>Tip:</strong> Click on the map to mark the exact location of the issue
      </div>
    </div>
  );
};

export default LocationPickerMap;
