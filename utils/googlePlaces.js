/**
 * Google Places API helper functions
 */

// Get API key from environment variables
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

/**
 * Searches for places using Google Places Autocomplete API
 * @param {string} query The search query (e.g., "Engineering Hall")
 * @returns {Promise<Array>} Array of place predictions
 */
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured.');
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&types=establishment`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.predictions) {
      return data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
      }));
    } else if (data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Gets place details including latitude and longitude
 * @param {string} placeId The Google Place ID
 * @returns {Promise<Object|null>} Place details with lat/lng or null
 */
export async function getPlaceDetails(placeId) {
  if (!placeId) {
    return null;
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured. Please set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in your .env file');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const location = data.result.geometry?.location;
      if (location) {
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: data.result.formatted_address || data.result.name,
          name: data.result.name,
        };
      }
    } else {
      console.error('Google Places Details API error:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Alternative: Geocode an address string directly (if you don't have place ID)
 * @param {string} address The address string
 * @returns {Promise<Object|null>} Geocoded location with lat/lng or null
 */
export async function geocodeAddress(address) {
  if (!address || address.trim().length < 2) {
    return null;
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured. Please set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in your .env file');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry?.location;
      if (location) {
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: data.results[0].formatted_address,
        };
      }
    } else {
      console.error('Geocoding API error:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

