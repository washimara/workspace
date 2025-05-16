/**
 * Utility for converting addresses to coordinates using a geocoding service
 */

// Mock implementation of a geocoding service
// In a production environment, this would use a real geocoding API like Google Maps, Mapbox, etc.

/**
 * Convert an address string to coordinates (latitude and longitude)
 * 
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - The coordinates or null if geocoding failed
 */
exports.geocodeAddress = async (address) => {
  try {
    // Mock geocoding logic - this would be replaced with a real API call
    // This is a very simplified mock that returns coordinates for some common cities
    const mockGeoData = {
      'new york': { lat: 40.7128, lng: -74.0060 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'houston': { lat: 29.7604, lng: -95.3698 },
      'phoenix': { lat: 33.4484, lng: -112.0740 },
      'philadelphia': { lat: 39.9526, lng: -75.1652 },
      'san antonio': { lat: 29.4241, lng: -98.4936 },
      'san diego': { lat: 32.7157, lng: -117.1611 },
      'dallas': { lat: 32.7767, lng: -96.7970 },
      'san jose': { lat: 37.3382, lng: -121.8863 },
      'austin': { lat: 30.2672, lng: -97.7431 },
      'jacksonville': { lat: 30.3322, lng: -81.6557 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'columbus': { lat: 39.9612, lng: -82.9988 },
      'online': { lat: 0, lng: 0 }, // Special case for online locations
    };

    if (!address) return null;

    // Try to match the address with our mock data (case insensitive)
    const normalizedAddress = address.toLowerCase().trim();
    
    // Check if the address contains any of our known cities
    for (const [city, coords] of Object.entries(mockGeoData)) {
      if (normalizedAddress.includes(city)) {
        return coords;
      }
    }

    // If no match is found, generate random coordinates near the equator
    // This is just for demonstration purposes
    const randomLat = (Math.random() * 10) - 5; // Random latitude between -5 and 5
    const randomLng = (Math.random() * 20) - 10; // Random longitude between -10 and 10
    
    return { lat: randomLat, lng: randomLng };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Calculate the distance between two points using the Haversine formula
 * 
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
exports.calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};