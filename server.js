import express from "express";
import cors from "cors";
import { DateTime } from "luxon";
import swisseph from "@astronexus/swisseph";
import NodeCache from "node-cache";

const swe = swisseph.default;
const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

app.use(cors());
app.use(express.json());

swe.swe_set_sid_mode(swe.SE_SIDM_LAHIRI);

const NAKS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const TITHI = ["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima","Amavasya"];

function jd(dt){
  return swe.swe_julday(dt.year,dt.month,dt.day,dt.hour + dt.minute/60 + dt.second/3600);
}

function format(t){ return t.toFormat("HH:mm:ss"); }

app.get("/panchang", async (req,res)=>{
  try{
    const lat = parseFloat(req.query.lat || 22.57);
    const lon = parseFloat(req.query.lon || 88.36);
    const tz  = req.query.tz || "Asia/Kolkata";

    const key = `${lat}_${lon}_${tz}`;
    if(cache.has(key)) return res.json(cache.get(key));

    const now = DateTime.now().setZone(tz);
    const J = jd(now);

    const sun = swe.swe_calc_ut(J, swe.SE_SUN, swe.SEFLG_SIDEREAL).data[0];
    const moon= swe.swe_calc_ut(J, swe.SE_MOON,swe.SEFLG_SIDEREAL).data[0];

    const diff = (moon - sun + 360) % 360;

    const tithiIndex = Math.floor(diff / 12);
    const nakIndex   = Math.floor(moon / 13.333333);
    const yogaIndex  = Math.floor(((sun + moon) % 360) / 13.333333);

    const sunrise = now.startOf("day").plus({minutes: 375}); 
    const sunset  = sunrise.plus({hours:10, minutes:28});

    const rahuStart = sunrise.plus({minutes:78});
    const rahuEnd   = rahuStart.plus({minutes:88});

    const mid = sunrise.plus({minutes: sunrise.diff(sunset).as("minutes")/2});
    const abhijitStart = sunrise.plus({minutes: (sunset.diff(sunrise).as("minutes")/2 - 24)});
    const abhijitEnd = abhijitStart.plus({minutes:48});

    const data = {
      brand: process.env.BRAND,
      owner: process.env.OWNER,
      timezone: tz,
      generated_at: now.toISO(),
      panchang:{
        tithi: TITHI[tithiIndex],
        nakshatra: NAKS[nakIndex],
        yoga: yogaIndex + 1,
        sunrise: format(sunrise),
        sunset: format(sunset),
        rahu_kaal: rahuStart.toFormat("HH:mm")+" - "+rahuEnd.toFormat("HH:mm"),
        abhijit: abhijitStart.toFormat("HH:mm")+" - "+abhijitEnd.toFormat("HH:mm")
      }
    };

    cache.set(key,data);
    res.json(data);

  }catch(err){
    res.status(500).json({error:"Panchang engine error", details:err.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("JD Panchang Engine Running on "+PORT));
