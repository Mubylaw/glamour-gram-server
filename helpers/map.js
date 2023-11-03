const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // Replace with your actual API key

async function getGeolocationFromAddress(address) {
  try {
    console.log("address", address);
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = response.data;

    console.log("data", data);

    if (data.status === "OK") {
      const location = data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    } else {
      throw new Error("Geocoding API request failed");
    }
  } catch (error) {
    console.error("Error fetching geolocation:", error.message);
    return null;
  }
}

module.exports = getGeolocationFromAddress;
