export default async function handler(req, res) {
  try {
    /* 🔐 CORS FIX — this is what was missing */
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const lat = req.query.lat || "22.57";
    const lon = req.query.lon || "88.36";
    const tz  = req.query.tz  || "Asia/Kolkata";

    const BASE = "https://panchang-python.onrender.com/panchang";

    const url = `${BASE}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&tz=${encodeURIComponent(tz)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("Swiss Panchang Engine offline");
    }

    const data = await response.json();

    /* CDN caching for Vercel */
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
      retry: "Try again in 30 seconds"
    });
  }
}
