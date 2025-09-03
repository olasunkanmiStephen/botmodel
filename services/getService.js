export async function getGPS() {
  try {
    const res = await fetch("http://ip-api.com/json/");
    const data = await res.json();

    if (data.status === "fail") throw new Error(data.message);

    return {
      latitude: data.lat,
      longitude: data.lon,
      city: data.city,
      region: data.regionName,
      country: data.country,
    };
  } catch (error) {
    console.error("GPS Error:", error.message);
    return { error: error.message };
  }
}
