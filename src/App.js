import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import cities from './au.json';

const MAPTILER_API_KEY = process.env.REACT_APP_MAPTILER_API_KEY;

const AustraliaTravelApp = () => {
  const [showMap, setShowMap] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [destinationCity, setDestinationCity] = useState(null);
  const [australianCities, setAustralianCities] = useState([]);
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    const c = cities.map(result => ({
      name: result.city,
      coordinates: [Number.parseFloat(result.lng), Number.parseFloat(result.lat)]
    })).filter(city => city.name);

    setAustralianCities(c);
  }, []);

  const handleButtonClick = () => {
    if (navigator.geolocation) {
      setButtonClicked(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
          if (australianCities.length > 0) {
            const location = australianCities[Math.floor(Math.random() * australianCities.length)];
            setDestinationCity(location);
          }
          setShowMap(true);
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert("Unable to get your location. Please try again.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    if (showMap && userLocation && destinationCity) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`,
        center: [(userLocation[0] + destinationCity.coordinates[0]) / 2, (userLocation[1] + destinationCity.coordinates[1]) / 2],
        zoom: 3
      });

      map.current.on('load', () => {
        map.current.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [userLocation, destinationCity.coordinates]
            }
          }
        });

        map.current.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#FF0000',
            'line-width': 3
          }
        });

        new maplibregl.Marker().setLngLat(userLocation).addTo(map.current);
        new maplibregl.Marker({ color: '#FF0000' }).setLngLat(destinationCity.coordinates).addTo(map.current);

        // Fit the map to the route
        const bounds = new maplibregl.LngLatBounds()
          .extend(userLocation)
          .extend(destinationCity.coordinates);

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [showMap, userLocation, destinationCity]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 overflow-hidden">
      {!showMap && !buttonClicked && (
        <button
          onClick={handleButtonClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Take me somewhere, mate!
        </button>
      )}

      {buttonClicked && !showMap && (
        <div className="h-full w-full flex items-center justify-center">
          <div className="animate-pulse bg-gray-100 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-center">
              <div className="animate-pulse rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="ml-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Loading animation */}
            <div className="mt-4 h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="mt-4 h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      )}

      {showMap && (
        <div
          className="h-full w-full"
          ref={mapContainer}
        >
          <div className="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
            <h2 className="text-xl font-bold mb-2">Your Adventure Awaits!</h2>
            <p>From: Your Location</p>
            <p>To: {destinationCity?.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AustraliaTravelApp;