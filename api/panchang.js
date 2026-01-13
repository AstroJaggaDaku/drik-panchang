export default async function handler(req, res) {
  try {
    /* 🌐 CORS for Odoo, iframe, WordPress */
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    /* Inputs */
    const lat  = req.query.lat  || "22.57";
    const lon  = req.query.lon  || "88.36";
    const tz   = req.query.tz   || "Asia/Kolkata";
    const date = req.query.date || "";

    const ENGINE = "https://panchang-python.onrender.com/panchang";

    const url = date
      ? `${ENGINE}?lat=${lat}&lon=${lon}&tz=${tz}&date=${date}`
      : `${ENGINE}?lat=${lat}&lon=${lon}&tz=${tz}`;

    /* Timeout safe */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("Swiss Panchang Engine Offline");
    }

    const p = await response.json();

    /* CDN cache */
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.setHeader("Content-Type", "application/json");

    /* 🪐 PREMIUM PANCHANG OBJECT */
    res.status(200).json({
      brand: "51Kalibari.com",
      astrologer: "Astrologer Joydev Sastri",
      engine: "Swiss Ephemeris • Lahiri • Drik Panchang",
      generated_at: new Date().toISOString(),
      location: {
        lat,
        lon,
        timezone: tz
      },
      date: p.date,
      panchang: {
        day: p.day,

        lunar: {
          tithi: p.tithi,
          tithi_end: p.tithi_end,
          paksha: p.paksha,
          karana: p.karana,
          nakshatra: p.nakshatra,
          nakshatra_end: p.nakshatra_end,
          yoga: p.yoga,
          yoga_end: p.yoga_end
        },

        sun: {
          sunrise: p.sunrise,
          sunset: p.sunset
        },

        moon: {
          sign: p.moon_sign,
          moonrise: p.moonrise,
          moonset: p.moonset
        },

        calendar: {
          amanta_month: p.amanta_month,
          purnimanta_month: p.purnimanta_month,
          ritu: p.ritu,
          vikram_samvat: p.vikram_samvat,
          shaka_samvat: p.shaka_samvat,
          kali_samvat: p.kali_samvat
        },

        muhurta: {
          rahu_kalam: p.rahu_kalam,
          yamaganda: p.yamaganda,
          gulika: p.gulika,
          abhijit: p.abhijit
        }
      }
    });

  } catch (err) {
    res.status(500).json({
      brand: "51Kalibari Panchang",
      status: "error",
      message: "Panchang engine unavailable",
      details: err.message,
      retry: "Please try again in 30 seconds"
    });
  }
}
