const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // Replace with your actual API key

exports.getGeolocationFromAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = response.data;

    let within = false;
    if (!data.results || data.results.length === 0) {
      throw new Error("Address not found");
    } else {
      const country = data.results[0].address_components.find((component) =>
        component.types.includes("country")
      );

      if (
        country &&
        (country.short_name === "GB" || country.short_name === "IE")
      ) {
        within = true;
      } else {
        within = false;
      }
    }

    if (data.status === "OK") {
      const location = data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng, within };
    } else {
      throw new Error("Geocoding API request failed");
    }
  } catch (error) {
    console.error("Error fetching geolocation:", error.message);
    return null;
  }
};

exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c; // Distance in kilometers
  const conversionFactor = 0.621371;
  distance = distance * conversionFactor;
  return distance;
};
