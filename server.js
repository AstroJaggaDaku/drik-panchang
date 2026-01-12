import express from "express";
import cors from "cors";
import { DateTime } from "luxon";
import swe from "swisseph";
import NodeCache from "node-cache";

const app = express();
const cache = new NodeCache({ stdTTL: 300 });

app.use(cors());

swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI);

const NAKS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const TITHI = ["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima","Amavasya"];

function jd(dt){
  return swe.swe_julday(
    dt.year, dt.month, dt.day,
    dt.hour + dt.minute/60 + dt.second/3600
  );
}

app.get("/panchang", async (req,res)=>{
  try{
    const tz = req.query.tz || "Asia/Kolkata";
    const lat = parseFloat(req.query.lat || 22.57);
    const lon = parseFloat(req.query.lon || 88.36);

    const now = DateTime.now().setZone(tz);
    const J = jd(now);

    const sun = swe.swe_calc_ut(J, swe.SE_SUN, swe.SEFLG_SIDEREAL)[0];
    const moon= swe.swe_calc_ut(J, swe.SE_MOON, swe.SEFLG_SIDEREAL)[0];

    const sunLon = sun[0];
    const moonLon = moon[0];

    const diff = (moonLon - sunLon + 360) % 360;

    const tithiIndex = Math.floor(diff / 12);
    const nakIndex = Math.floor(moonLon / 13.333333);
    const yogaIndex = Math.floor(((sunLon + moonLon) % 360) / 13.333333);

    const sunrise = now.startOf("day").plus({minutes:375});
    const sunset = sunrise.plus({hours:10,minutes:28});

    const rahuStart = sunrise.plus({minutes:78});
    const rahuEnd = rahuStart.plus({minutes:88});

    const abhijitStart = sunrise.plus({minutes:(sunset.diff(sunrise).as("minutes")/2 - 24)});
    const abhijitEnd = abhijitStart.plus({minutes:48});

    const data = {
      tithi: TITHI[tithiIndex],
      nakshatra: NAKS[nakIndex],
      yoga: yogaIndex + 1,
      sunrise: sunrise.toFormat("HH:mm:ss"),
      sunset: sunset.toFormat("HH:mm:ss"),
      rahu_kaal: rahuStart.toFormat("HH:mm")+" - "+rahuEnd.toFormat("HH:mm"),
      abhijit: abhijitStart.toFormat("HH:mm")+" - "+abhijitEnd.toFormat("HH:mm")
    };

    res.json({ panchang: data });

  }catch(e){
    res.status(500).json({error:e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Swiss Panchang API running"));
