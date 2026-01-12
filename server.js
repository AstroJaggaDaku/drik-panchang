import express from "express";
import cors from "cors";
import { DateTime } from "luxon";
import { Ephemeris } from "ephemeris-engine";
import NodeCache from "node-cache";

const app = express();
const cache = new NodeCache({ stdTTL: 300 });

const eph = new Ephemeris({ ayanamsa: "lahiri" });

const NAKS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
const TITHI = ["Pratipada","Dvitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima","Amavasya"];

app.use(cors());

app.get("/panchang", async (req,res)=>{
  try{
    const lat = parseFloat(req.query.lat || 22.57);
    const lon = parseFloat(req.query.lon || 88.36);
    const tz  = req.query.tz || "Asia/Kolkata";

    const key = `${lat}_${lon}_${tz}`;
    if(cache.has(key)) return res.json(cache.get(key));

    const now = DateTime.now().setZone(tz).toJSDate();

    const sun = eph.sun(now).siderealLongitude;
    const moon= eph.moon(now).siderealLongitude;

    const diff = (moon - sun + 360) % 360;

    const tithiIndex = Math.floor(diff / 12);
    const nakIndex   = Math.floor(moon / 13.333333);
    const yogaIndex  = Math.floor(((sun + moon) % 360) / 13.333333);

    const sunrise = DateTime.now().setZone(tz).startOf("day").plus({minutes:375});
    const sunset = sunrise.plus({hours:10,minutes:28});

    const rahuStart = sunrise.plus({minutes:78});
    const rahuEnd = rahuStart.plus({minutes:88});

    const abhijitStart = sunrise.plus({minutes:(sunset.diff(sunrise).as("minutes")/2 - 24)});
    const abhijitEnd = abhijitStart.plus({minutes:48});

    const data = {
      panchang:{
        tithi: TITHI[tithiIndex],
        nakshatra: NAKS[nakIndex],
        yoga: yogaIndex+1,
        sunrise: sunrise.toFormat("HH:mm:ss"),
        sunset: sunset.toFormat("HH:mm:ss"),
        rahu_kaal: rahuStart.toFormat("HH:mm")+" - "+rahuEnd.toFormat("HH:mm"),
        abhijit: abhijitStart.toFormat("HH:mm")+" - "+abhijitEnd.toFormat("HH:mm")
      }
    };

    cache.set(key,data);
    res.json(data);

  }catch(e){
    res.status(500).json({error:e.message});
  }
});

app.listen(process.env.PORT || 3000);
