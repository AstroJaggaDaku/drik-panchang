export default async function handler(req, res) {
  try {
    const lat = req.query.lat || "22.57";
    const lon = req.query.lon || "88.36";
    const tz  = req.query.tz  || "Asia/Kolkata";

    const BASE = "https://panchang-python.onrender.com/panchang";

    const url = `${BASE}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&tz=${encodeURIComponent(tz)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("Swiss Panchang Engine offline");
    }

    const data = await response.json();

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.setHeader("Content-Type", "application/json");

    res.status(200).json({
      source: "51Kalibari Swiss Panchang",
      engine: "Swiss Ephemeris + Lahiri (Drik Panchang)",
      timezone: tz,
      location: { lat, lon },
      generated_at: new Date().toISOString(),
      panchang: data
    });

  } catch (err) {
    res.status(500).json({
      error: "51Kalibari Panchang Gateway Error",
      message: err.message,
      backup: "Try again in 30 seconds"
    });
  }
}
