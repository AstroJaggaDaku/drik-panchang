export default async function handler(req, res) {
  try {
    /* 🌐 CORS for Odoo, WordPress, iframe, etc */
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    /* Input */
    const lat  = req.query.lat  || "22.57";
    const lon  = req.query.lon  || "88.36";
    const tz   = req.query.tz   || "Asia/Kolkata";
    const date = req.query.date || "";     // 🔥 NEW (YYYY-MM-DD)

    const BASE = "https://panchang-python.onrender.com/panchang";

    /* Build Swiss engine URL */
    const url = date
      ? `${BASE}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&tz=${encodeURIComponent(tz)}&date=${encodeURIComponent(date)}`
      : `${BASE}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&tz=${encodeURIComponent(tz)}`;

    /* Timeout protection */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("Swiss Panchang Engine offline");
    }

    const data = await response.json();

    /* Vercel CDN cache */
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.setHeader("Content-Type", "application/json");

    res.status(200).json({
      source: "51Kalibari Swiss Panchang",
      engine: "Swiss Ephemeris + Lahiri (Drik Panchang)",
      timezone: tz,
      location: { lat, lon },
      date: date || new Date().toISOString().slice(0,10),
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
