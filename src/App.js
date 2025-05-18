import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const GOOGLE_MAP_API_KEY = 'AIzaSyBncsnfDhnVce9SKO5C0iCRdCaBWdu6WJc';

function App() {
  const [mosques, setMosques] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const initializeMap = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const userLoc = new window.google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        const mapOptions = {
          center: userLoc,
          zoom: 14,
          mapId: darkMode ? 'dark' : 'light'
        };

        const mapInstance = new window.google.maps.Map(document.getElementById('map'), mapOptions);

        new window.google.maps.Marker({
          position: userLoc,
          map: mapInstance,
          title: 'Your Location',
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });

        const service = new window.google.maps.places.PlacesService(mapInstance);
        service.nearbySearch({
          location: userLoc,
          radius: 5000,
          type: 'mosque'
        }, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const newMosques = results.map(place => {
              const marker = new window.google.maps.Marker({
                position: place.geometry.location,
                map: mapInstance,
                title: place.name
              });

              const distance = window.google.maps.geometry.spherical.computeDistanceBetween(userLoc, place.geometry.location);
              const kmDistance = (distance / 1000).toFixed(2);

              const infowindow = new window.google.maps.InfoWindow({
                content: `
                  <div>
                    <h6>${place.name}</h6>
                    <p>${place.vicinity}</p>
                    <p>Distance: ${kmDistance} km</p>
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat()},${userLoc.lng()}&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" target="_blank">Get Directions</a>
                  </div>`
              });

              marker.addListener('click', () => infowindow.open(mapInstance, marker));

              return {
                name: place.name,
                address: place.vicinity,
                distance: kmDistance
              };
            });

            setMosques(newMosques);
          }
        });
      });
    }
  }, [darkMode]);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAP_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else {
      initializeMap();
    }
  }, [initializeMap]);

  return (
    <div className={darkMode ? 'bg-dark text-light' : 'bg-light text-dark'} style={{ minHeight: '100vh' }}>
      <div className="container py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>ZhirMosq</h2>
          <button className="btn btn-outline-secondary" onClick={() => setDarkMode(!darkMode)}>
            <i
              className={`bi ${darkMode ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-primary'}`}
            ></i>
          </button>
        </div>
        <div id="map" style={{ height: '60vh', width: '100%' }} className="mb-4 rounded shadow"></div>
        <h5>🕌 Nearby Mosques</h5>
        <ul className="list-group">
          {mosques.map((mosque, index) => (
            <li key={index} className="list-group-item">
              <strong>{mosque.name}</strong><br />
              {mosque.address}<br />
              <span className="text-muted">{mosque.distance} km away</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;