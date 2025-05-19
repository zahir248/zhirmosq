import React, { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const GOOGLE_MAP_API_KEY = 'AIzaSyBncsnfDhnVce9SKO5C0iCRdCaBWdu6WJc';

export default function App() {
  const [mosques, setMosques] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const initializeMap = useCallback(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const userLoc = new window.google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        const mapOptions = {
          center: userLoc,
          zoom: 14,
          mapId: darkMode ? 'dark' : 'light',
          styles: darkMode ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          ] : [],
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          fullscreenControl: true
        };

        const mapInstance = new window.google.maps.Map(document.getElementById('map'), mapOptions);

        // User location marker
        new window.google.maps.Marker({
          position: userLoc,
          map: mapInstance,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2
          }
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
                title: place.name,
                animation: window.google.maps.Animation.DROP,
                icon: {
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }
              });

              const distance = window.google.maps.geometry.spherical.computeDistanceBetween(userLoc, place.geometry.location);
              const kmDistance = (distance / 1000).toFixed(2);

              const infowindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; max-width: 200px;">
                    <h6 style="margin: 0 0 8px 0; font-weight: 600;">${place.name}</h6>
                    <p style="margin: 0 0 4px 0; font-size: 14px;">${place.vicinity}</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Distance:</strong> ${kmDistance} km</p>
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat()},${userLoc.lng()}&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" 
                       target="_blank" 
                       style="background-color: #10B981; color: white; padding: 6px 10px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;">
                       Get Directions
                    </a>
                  </div>`
              });

              marker.addListener('click', () => {
                infowindow.open(mapInstance, marker);
                setSelectedMosque({
                  name: place.name,
                  address: place.vicinity,
                  distance: kmDistance,
                  location: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  }
                });
              });

              return {
                id: place.place_id,
                name: place.name,
                address: place.vicinity,
                distance: kmDistance,
                rating: place.rating,
                userRatingsTotal: place.user_ratings_total,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              };
            });

            setMosques(newMosques);
            setLoading(false);
          }
        });
      }, (error) => {
        console.error("Error getting location:", error);
        setLoading(false);
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

  const filteredMosques = mosques.filter(mosque => 
    mosque.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mosque.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDirectionsUrl = (mosque) => {
    if (!mosque) return "#";
    return `https://www.google.com/maps/dir/?api=1&destination=${mosque.location.lat},${mosque.location.lng}`;
  };

  return (
    <div className={`min-vh-100 ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'} transition`}>
      {/* Header */}
      <header className={`fixed-top ${darkMode ? 'bg-dark' : 'bg-white'} shadow`}>
        <div className="container-fluid px-3 py-2 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="d-md-none me-2 btn btn-sm rounded-circle"
              style={{ background: darkMode ? '#2D3748' : '#EDF2F7' }}
            >
              <i className={`bi ${menuOpen ? 'bi-x' : 'bi-list'} ${darkMode ? 'text-white' : 'text-dark'}`} ></i>            
            </button>
            <div className="d-flex align-items-center">
              {/* <i className={`bi bi-geo-alt-fill me-2 ${darkMode ? 'text-success' : 'text-success'}`}></i> */}
              <h1 className="fs-4 fw-bold mb-0">ZhirMosq</h1>
            </div>
          </div>
          
          <div className="d-flex align-items-center">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`btn btn-sm rounded-circle ${darkMode ? 'bg-secondary text-warning' : 'bg-light text-primary'}`}
              aria-label="Toggle dark mode"
            >
              <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon-stars'}`}></i>
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      {menuOpen && (
        <div className={`fixed-top mt-5 ${darkMode ? 'bg-dark' : 'bg-white'} shadow p-3 d-md-none`}>
          <div className="mb-3">
            <div className="position-relative">
              <input
                type="text"
                placeholder="Search mosques..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`form-control rounded-pill ${darkMode ? 'bg-secondary border-secondary text-white' : 'bg-light text-dark'}`}
                style={{ caretColor: darkMode ? 'white' : 'black' }}
              />
              <i className={`bi bi-search position-absolute end-0 top-50 translate-middle-y pe-3 ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}></i>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="pt-5 d-flex flex-column flex-md-row" style={{ height: '100vh' }}>
        {/* Sidebar */}
        <div className={`d-none d-md-block ${darkMode ? 'bg-dark' : 'bg-white'} shadow`} style={{ width: '320px', height: '100%', overflowY: 'auto' }}>
          <div className="p-3">
            <div className="position-relative mb-3">
              <input
                type="text"
                placeholder="Search mosques..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`form-control rounded-pill ${darkMode ? 'bg-secondary border-secondary text-white' : 'bg-light text-dark'}`}
                style={{ caretColor: darkMode ? 'white' : 'black' }}
              />
              <i className={`bi bi-search position-absolute end-0 top-50 translate-middle-y pe-3 ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}></i>
            </div>
            
            <h2 className="fs-5 fw-semibold mb-3">🕌 Nearby Mosques</h2>
            
            {loading ? (
              <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div>
                {filteredMosques.length > 0 ? (
                  filteredMosques.map((mosque) => (
                    <div 
                      key={mosque.id} 
                      className={`p-3 rounded mb-2 cursor-pointer ${
                        selectedMosque && selectedMosque.name === mosque.name
                          ? darkMode ? 'bg-success bg-opacity-25' : 'bg-success bg-opacity-10'
                          : darkMode ? 'hover-dark' : 'hover-light'
                      }`}
                      onClick={() => setSelectedMosque(mosque)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h3 className="fw-medium fs-6 mb-1">{mosque.name}</h3>
                      <p className={`small mb-1 ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}>{mosque.address}</p>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="d-flex align-items-center small">
                          <i className="bi bi-geo-alt me-1 small"></i>
                          <span className={darkMode ? 'text-light text-opacity-75' : ''}>{mosque.distance} km</span>
                        </span>
                        {mosque.rating && (
                          <span className="d-flex align-items-center small">
                            <span className="text-warning me-1">★</span>
                            {mosque.rating} 
                            {mosque.userRatingsTotal && <span className={`ms-1 smaller ${darkMode ? 'text-light text-opacity-50' : 'text-muted'}`}>({mosque.userRatingsTotal})</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-center py-4 ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}>No mosques found</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Map */}
        <div className="flex-grow-1 position-relative">
          <div id="map" className="w-100 h-100"></div>
          
          {/* Mobile bottom list */}
          <div className={`d-md-none fixed-bottom rounded-top shadow ${darkMode ? 'bg-dark' : 'bg-white'}`} style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <div className={`p-3 ${darkMode ? 'border-secondary' : ''} border-bottom`}>
              <h2 className="fs-5 fw-semibold">Nearby Mosques</h2>
            </div>
            
            {loading ? (
              <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div>
                {filteredMosques.slice(0, 5).map((mosque) => (
                  <div 
                    key={mosque.id} 
                    className={`p-3 border-bottom ${darkMode ? 'border-secondary' : ''} ${
                      selectedMosque && selectedMosque.name === mosque.name
                        ? darkMode ? 'bg-success bg-opacity-25' : 'bg-success bg-opacity-10'
                        : ''
                    }`}
                    onClick={() => setSelectedMosque(mosque)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h3 className="fw-medium fs-6 mb-1">{mosque.name}</h3>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`small ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}>{mosque.distance} km</span>
                      {mosque.rating && (
                        <span className="small"><span className="text-warning">★</span> {mosque.rating}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected mosque details card */}
          {selectedMosque && (
            <div className={`position-absolute top-0 end-0 m-3 p-3 rounded shadow ${darkMode ? 'bg-dark' : 'bg-white'}`} style={{ maxWidth: '280px' }}>
              <h3 className="fw-bold fs-5">{selectedMosque.name}</h3>
              <p className={`small mb-2 ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}>{selectedMosque.address}</p>
              <div className="d-flex align-items-center mb-1">
                <i className="bi bi-clock me-2 text-muted small"></i>
                <span className={`small ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}>Open hours: Check Google Maps</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-geo-alt me-2 text-muted small"></i>
                <span className={`small ${darkMode ? 'text-light text-opacity-75' : 'text-muted'}`}>{selectedMosque.distance} km away</span>
              </div>
              <a
                href={getDirectionsUrl(selectedMosque)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success w-100 mb-2 d-flex align-items-center justify-content-center"
              >
                Get Directions
                <i className="bi bi-arrow-right ms-1"></i>
              </a>
              <button
                onClick={() => setSelectedMosque(null)}
                className={`btn ${darkMode ? 'btn-outline-secondary' : 'btn-outline-secondary'} btn-sm w-100`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </main>

      <style jsx="true">{`
        .dark-mode-bg {
          background-color: ${darkMode ? '#212529' : 'white'};
          color: ${darkMode ? 'white' : 'inherit'};
        }
        
        .hover-light:hover {
          background-color: rgba(0,0,0,0.05);
        }
        
        .hover-dark:hover {
          background-color: rgba(255,255,255,0.1);
        }
        
        .smaller {
          font-size: 0.75rem;
        }
        
        .transition {
          transition: background-color 0.3s, color 0.3s;
        }
        
        .form-control::placeholder {
          color: ${darkMode ? 'rgba(255,255,255,0.6)' : ''};
        }
      `}</style>
    </div>
  );
}