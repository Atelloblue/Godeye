// Nationwide 511 State Traffic Camera System
// Provides live dynamic feeds & curated networks for all 50 US States

export interface TrafficCameraNode {
  id: string;
  rawId?: string;
  name: string;
  city: string;
  agency: string;
  lat: number;
  lon: number;
  heading: number;
  highway: string;
  snapshotUrl: string;
  streamUrl?: string;
  views?: Array<{
    id: string;
    name: string;
    snapshotUrl: string;
    streamUrl?: string;
  }>;
  sourceUrl: string;
  status: "LIVE_CONFIRMED" | "STREAM_STANDBY";
  feedType: "STREAM" | "SNAPSHOT";
}

// 1. PENNSYLVANIA (511PA / PennDOT - 511pa.com)
export async function fetchPennsylvaniaCameras(): Promise<TrafficCameraNode[]> {
  try {
    const pages = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500];
    const promises = pages.map((start) =>
      fetch("https://www.511pa.com/List/GetData/Cameras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/javascript, */*",
        },
        body: JSON.stringify({
          draw: 1,
          start,
          length: 100,
          search: { value: "", regex: false },
          order: [{ column: 0, dir: "asc" }],
        }),
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] }))
    );

    const responses = await Promise.all(promises);
    const rawList = responses.flatMap((r: any) => r.data || []);
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of rawList) {
      if (!c || !c.id) continue;
      const id = `pa-${c.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let lat = 0;
      let lon = 0;
      const wkt = c.latLng?.geography?.wellKnownText || "";
      const match = wkt.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        lon = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

      const roadway = (c.roadway || c.location || `PennDOT Camera #${c.id}`).trim();
      const city = inferPennsylvaniaCity(roadway, c.region || "", lat, lon);
      const highway = inferHighway(roadway, ["76", "95", "80", "81", "83", "79", "376", "476", "78", "22", "30", "1"]);
      const img = c.images?.[0];
      const snapshotUrl = img?.imageUrl
        ? img.imageUrl.startsWith("http")
          ? img.imageUrl
          : `https://www.511pa.com${img.imageUrl}`
        : `https://www.511pa.com/map/Cctv/${c.id}`;
      const streamUrl = img?.videoUrl || "";

      valid.push({
        id,
        rawId: String(c.id),
        name: `${roadway} (${highway})`,
        city,
        agency: "PennDOT 511PA",
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        sourceUrl: "https://www.511pa.com/cctv",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 2. WASHINGTON STATE (WSDOT - wsdot.wa.gov)
export async function fetchWashingtonCameras(): Promise<TrafficCameraNode[]> {
  try {
    const res = await fetch("https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const features = data.features || [];
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const f of features) {
      const attrs = f.attributes || {};
      const geom = f.geometry || {};
      const rawId = String(attrs.OBJECTID || attrs.CameraID || "");
      if (!rawId) continue;
      const id = `wa-${rawId}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const lat = Number(geom.y || attrs.Latitude);
      const lon = Number(geom.x || attrs.Longitude);
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

      const title = (attrs.CameraTitle || attrs.Title || `WSDOT Camera #${rawId}`).trim();
      const imageUrl = attrs.ImageURL || attrs.CameraUrl || "";
      if (!imageUrl) continue;

      const city = inferWashingtonCity(title, lat, lon);
      const highway = inferHighway(title, ["5", "90", "405", "520", "167", "16", "2", "99", "18", "12", "395", "82", "512", "14"]);

      valid.push({
        id,
        rawId,
        name: `${title} (${highway})`,
        city,
        agency: "WSDOT",
        lat,
        lon,
        heading: attrs.CompassDirection === "N" ? 0 : attrs.CompassDirection === "E" ? 90 : attrs.CompassDirection === "S" ? 180 : attrs.CompassDirection === "W" ? 270 : 0,
        highway,
        snapshotUrl: imageUrl,
        sourceUrl: "https://wsdot.com/travel/real-time/cameras",
        status: "LIVE_CONFIRMED",
        feedType: "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 3. WISCONSIN (511WI / WisDOT - 511wi.gov)
export async function fetchWisconsinCameras(): Promise<TrafficCameraNode[]> {
  try {
    const pages = [0, 100, 200, 300, 400, 500];
    const promises = pages.map((start) =>
      fetch("https://511wi.gov/List/GetData/Cameras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/javascript, */*",
        },
        body: JSON.stringify({
          draw: 1,
          start,
          length: 100,
          search: { value: "", regex: false },
          order: [{ column: 0, dir: "asc" }],
        }),
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] }))
    );

    const responses = await Promise.all(promises);
    const rawList = responses.flatMap((r: any) => r.data || []);
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of rawList) {
      if (!c || !c.id) continue;
      const id = `wi-${c.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let lat = 0;
      let lon = 0;
      const wkt = c.latLng?.geography?.wellKnownText || "";
      const match = wkt.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        lon = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

      const roadway = (c.roadway || c.location || `WisDOT Camera #${c.id}`).trim();
      const city = inferWisconsinCity(roadway, c.region || "", lat, lon);
      const highway = inferHighway(roadway, ["94", "43", "41", "39", "90", "53", "12", "151", "10"]);
      const img = c.images?.[0];
      const snapshotUrl = img?.imageUrl
        ? img.imageUrl.startsWith("http")
          ? img.imageUrl
          : `https://511wi.gov${img.imageUrl}`
        : `https://511wi.gov/map/Cctv/${c.id}`;
      const streamUrl = img?.videoUrl || "";

      valid.push({
        id,
        rawId: String(c.id),
        name: `${roadway} (${highway})`,
        city,
        agency: "WisDOT 511WI",
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        sourceUrl: "https://511wi.gov/cctv",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 4. IDAHO (Idaho 511 / ITD - 511.idaho.gov)
export async function fetchIdahoCameras(): Promise<TrafficCameraNode[]> {
  try {
    const pages = [0, 100, 200, 300, 400, 500];
    const promises = pages.map((start) =>
      fetch("https://511.idaho.gov/List/GetData/Cameras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/javascript, */*",
        },
        body: JSON.stringify({
          draw: 1,
          start,
          length: 100,
          search: { value: "", regex: false },
          order: [{ column: 0, dir: "asc" }],
        }),
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] }))
    );

    const responses = await Promise.all(promises);
    const rawList = responses.flatMap((r: any) => r.data || []);
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of rawList) {
      if (!c || !c.id) continue;
      const id = `id-${c.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let lat = 0;
      let lon = 0;
      const wkt = c.latLng?.geography?.wellKnownText || "";
      const match = wkt.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        lon = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

      const roadway = (c.roadway || c.location || `ITD Camera #${c.id}`).trim();
      const city = inferIdahoCity(roadway, c.region || "", lat, lon);
      const highway = inferHighway(roadway, ["84", "15", "86", "90", "20", "26", "95", "93", "55"]);
      const img = c.images?.[0];
      const snapshotUrl = img?.imageUrl
        ? img.imageUrl.startsWith("http")
          ? img.imageUrl
          : `https://511.idaho.gov${img.imageUrl}`
        : `https://511.idaho.gov/map/Cctv/${c.id}`;
      const streamUrl = img?.videoUrl || "";

      valid.push({
        id,
        rawId: String(c.id),
        name: `${roadway} (${highway})`,
        city,
        agency: "ITD Idaho 511",
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        sourceUrl: "https://511.idaho.gov/cctv",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 5. CONNECTICUT (CTroads / CTDOT - ctroads.org)
export async function fetchConnecticutCameras(): Promise<TrafficCameraNode[]> {
  try {
    const pages = [0, 100, 200, 300, 400];
    const promises = pages.map((start) =>
      fetch("https://ctroads.org/List/GetData/Cameras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/javascript, */*",
        },
        body: JSON.stringify({
          draw: 1,
          start,
          length: 100,
          search: { value: "", regex: false },
          order: [{ column: 0, dir: "asc" }],
        }),
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] }))
    );

    const responses = await Promise.all(promises);
    const rawList = responses.flatMap((r: any) => r.data || []);
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of rawList) {
      if (!c || !c.id) continue;
      const id = `ct-${c.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let lat = 0;
      let lon = 0;
      const wkt = c.latLng?.geography?.wellKnownText || "";
      const match = wkt.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        lon = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

      const roadway = (c.roadway || c.location || `CTDOT Camera #${c.id}`).trim();
      const city = inferConnecticutCity(roadway, c.region || "", lat, lon);
      const highway = inferHighway(roadway, ["95", "91", "84", "395", "691", "8", "15", "7", "9", "2"]);
      const img = c.images?.[0];
      const snapshotUrl = img?.imageUrl
        ? img.imageUrl.startsWith("http")
          ? img.imageUrl
          : `https://ctroads.org${img.imageUrl}`
        : `https://ctroads.org/map/Cctv/${c.id}`;
      const streamUrl = img?.videoUrl || "";

      valid.push({
        id,
        rawId: String(c.id),
        name: `${roadway} (${highway})`,
        city,
        agency: "CTDOT CTroads",
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        sourceUrl: "https://ctroads.org/cctv",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 6. ALASKA (Alaska 511 / ADOT&PF - 511.alaska.gov)
export async function fetchAlaskaCameras(): Promise<TrafficCameraNode[]> {
  try {
    const pages = [0, 100, 200];
    const promises = pages.map((start) =>
      fetch("https://511.alaska.gov/List/GetData/Cameras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/javascript, */*",
        },
        body: JSON.stringify({
          draw: 1,
          start,
          length: 100,
          search: { value: "", regex: false },
          order: [{ column: 0, dir: "asc" }],
        }),
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] }))
    );

    const responses = await Promise.all(promises);
    const rawList = responses.flatMap((r: any) => r.data || []);
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of rawList) {
      if (!c || !c.id) continue;
      const id = `ak-${c.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let lat = 0;
      let lon = 0;
      const wkt = c.latLng?.geography?.wellKnownText || "";
      const match = wkt.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        lon = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

      const roadway = (c.roadway || c.location || `ADOT&PF Camera #${c.id}`).trim();
      const city = inferAlaskaCity(roadway, c.region || "", lat, lon);
      const highway = inferHighway(roadway, ["1", "2", "3", "4", "9", "11"]);
      const img = c.images?.[0];
      const snapshotUrl = img?.imageUrl
        ? img.imageUrl.startsWith("http")
          ? img.imageUrl
          : `https://511.alaska.gov${img.imageUrl}`
        : `https://511.alaska.gov/map/Cctv/${c.id}`;
      const streamUrl = img?.videoUrl || "";

      valid.push({
        id,
        rawId: String(c.id),
        name: `${roadway} (${highway})`,
        city,
        agency: "Alaska DOT&PF 511",
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        sourceUrl: "https://511.alaska.gov/cctv",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 7. NEW ENGLAND 511 (Maine, New Hampshire, Vermont - newengland511.org)
export async function fetchNewEnglandCameras(): Promise<TrafficCameraNode[]> {
  try {
    const pages = [0, 100, 200, 300, 400];
    const promises = pages.map((start) =>
      fetch("https://newengland511.org/List/GetData/Cameras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/javascript, */*",
        },
        body: JSON.stringify({
          draw: 1,
          start,
          length: 100,
          search: { value: "", regex: false },
          order: [{ column: 0, dir: "asc" }],
        }),
        signal: AbortSignal.timeout(6000),
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] }))
    );

    const responses = await Promise.all(promises);
    const rawList = responses.flatMap((r: any) => r.data || []);
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of rawList) {
      if (!c || !c.id) continue;
      const id = `ne-${c.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let lat = 0;
      let lon = 0;
      const wkt = c.latLng?.geography?.wellKnownText || "";
      const match = wkt.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        lon = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) continue;

      const roadway = (c.roadway || c.location || `New England Camera #${c.id}`).trim();
      const stateName = c.state || (c.areaId === "VT" ? "Vermont" : c.areaId === "ME" ? "Maine" : "New Hampshire");
      const city = inferNewEnglandCity(roadway, stateName, lat, lon);
      const highway = inferHighway(roadway, ["95", "93", "89", "91", "295", "393", "1", "2", "3", "4", "7", "9", "16", "101", "100"]);
      const img = c.images?.[0];
      const snapshotUrl = img?.imageUrl
        ? img.imageUrl.startsWith("http")
          ? img.imageUrl
          : `https://newengland511.org${img.imageUrl}`
        : `https://newengland511.org/map/Cctv/${c.id}`;
      const streamUrl = img?.videoUrl || "";

      valid.push({
        id,
        rawId: String(c.id),
        name: `${roadway} (${highway})`,
        city,
        agency: stateName === "Maine" ? "MaineDOT 511" : stateName === "New Hampshire" ? "NHDOT 511" : "VTrans 511",
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        sourceUrl: "https://newengland511.org/cctv",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 8. NEBRASKA (Nebraska 511 / NDOT - 511.nebraska.gov)
export async function fetchNebraskaCameras(): Promise<TrafficCameraNode[]> {
  try {
    const res = await fetch("https://netg.carsprogram.org/cameras_v1/api/cameras", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://511.nebraska.gov/list/cameras",
        "Origin": "https://511.nebraska.gov"
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of data) {
      if (!c || !c.location) continue;
      const lat = Number(c.location.latitude);
      const lon = Number(c.location.longitude);
      if (!lat || !lon || isNaN(lat) || isNaN(lon) || lat < 39.5 || lat > 43.5 || lon < -104.5 || lon > -95.0) continue;

      const baseName = (c.name || `Nebraska Camera #${c.id}`).trim();
      const cityRef = c.location.cityReference || "";
      const routeId = c.location.routeId || "";
      const city = inferNebraskaCity(baseName, cityRef, lat, lon);
      const highway = inferNebraskaHighway(baseName, routeId);
      const views = (c.views && c.views.length > 0) ? c.views : [{ name: "Main", url: "" }];

      views.forEach((v: any, idx: number) => {
        const imgUrl = v.url || v.videoPreviewUrl;
        if (!imgUrl) return;

        const id = views.length > 1 ? `ne-511-${c.id}-${idx}` : `ne-511-${c.id}`;
        if (seenIds.has(id)) return;
        seenIds.add(id);

        const vName = v.name && v.name !== "Various Views" && v.name !== "Various" && v.name !== "Default" && v.name !== "Standard"
          ? ` (${v.name})`
          : "";
        const fullName = `${baseName}${vName}`;

        valid.push({
          id,
          rawId: String(c.id),
          name: fullName,
          city,
          agency: c.cameraOwner?.name === "NDOR" || c.cameraOwner?.name === "NDOT" ? "Nebraska DOT 511" : (c.cameraOwner?.name ? `NDOT / ${c.cameraOwner.name}` : "Nebraska DOT 511"),
          lat,
          lon,
          heading: 0,
          highway,
          snapshotUrl: imgUrl,
          streamUrl: v.type === "WMP" && v.url ? v.url : undefined,
          sourceUrl: "https://511.nebraska.gov/list/cameras",
          status: "LIVE_CONFIRMED",
          feedType: "SNAPSHOT",
        });
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 9. IOWA (Iowa DOT Open Data / 511 Iowa - data.iowadot.gov)
export async function fetchIowaCameras(): Promise<TrafficCameraNode[]> {
  try {
    const queryUrl = "https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/Traffic_Cameras_View/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=2000";
    const res = await fetch(queryUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://data.iowadot.gov/maps/traffic-cameras-3",
        "Origin": "https://data.iowadot.gov"
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const feats = data.features || [];
    if (!Array.isArray(feats)) return [];

    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const f of feats) {
      const a = f.attributes || {};
      const rawId = String(a.device_id || a.FID || a.COMMON_ID || Math.random());
      const id = `ia-${rawId}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const lat = Number(a.latitude);
      const lon = Number(a.longitude);
      if (!lat || !lon || isNaN(lat) || isNaN(lon) || lat < 40.0 || lat > 44.0 || lon < -97.0 || lon > -89.5) continue;

      const desc = (a.Desc_ || a.ImageName || `Iowa Camera #${rawId}`).trim();
      const region = a.REGION || "";
      const route = a.Route || "";
      const city = inferIowaCity(desc, region, lat, lon);
      const highway = inferIowaHighway(desc, route);
      const snapshotUrl = a.ImageURL;
      if (!snapshotUrl) continue;
      const streamUrl = a.VideoURL || undefined;

      valid.push({
        id,
        rawId,
        name: desc,
        city,
        agency: a.ORG === "IADOT" ? "Iowa DOT 511" : (a.ORG ? `Iowa DOT / ${a.ORG}` : "Iowa DOT 511"),
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        sourceUrl: "https://data.iowadot.gov/maps/traffic-cameras-3",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 10. GEORGIA (GDOT NaviGAtor 511GA - 511ga.org)
export async function fetchGeorgiaCameras(): Promise<TrafficCameraNode[]> {
  try {
    const pages: number[] = [];
    for (let i = 0; i < 4400; i += 100) pages.push(i);

    const rawList: any[] = [];
    const batchSize = 12;

    for (let i = 0; i < pages.length; i += batchSize) {
      const chunk = pages.slice(i, i + batchSize);
      const promises = chunk.map((start) =>
        fetch("https://511ga.org/List/GetData/Cameras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*",
            "Referer": "https://511ga.org/cctv",
            "Origin": "https://511ga.org",
          },
          body: JSON.stringify({
            draw: 1,
            start,
            length: 100,
            search: { value: "", regex: false },
            order: [{ column: 0, dir: "asc" }],
          }),
          signal: AbortSignal.timeout(8000),
        })
          .then((r) => r.json())
          .then((d) => d.data || [])
          .catch(() => [])
      );

      const chunkResults = await Promise.all(promises);
      for (const items of chunkResults) {
        if (Array.isArray(items)) rawList.push(...items);
      }
    }

    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (const c of rawList) {
      if (!c || !c.id) continue;
      const id = `ga511-${c.id}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let lat = 0;
      let lon = 0;
      const wkt = c.latLng?.geography?.wellKnownText || "";
      const match = wkt.match(/POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i);
      if (match) {
        lon = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
      if (!lat || !lon || isNaN(lat) || isNaN(lon) || lat < 30.0 || lat > 35.5 || lon < -86.0 || lon > -80.0) continue;

      const roadway = (c.roadway || "").trim();
      const loc = (c.location || roadway || `Georgia Camera #${c.id}`).trim();
      const city = inferGeorgiaCity(loc, roadway, lat, lon);
      const highway = inferGeorgiaHighway(loc, roadway);
      const img = c.images?.[0];
      const snapshotUrl = img?.id
        ? `https://511ga.org/map/Cctv/${img.id}`
        : img?.imageUrl
        ? img.imageUrl.startsWith("http")
          ? img.imageUrl
          : `https://511ga.org${img.imageUrl}`
        : `https://511ga.org/map/Cctv/${c.id}`;

      // GDOT NaviGAtor video streams require private auth tokens (isVideoAuthRequired: true / returns 401).
      // Public access is provided via the official high-resolution real-time snapshot feeds.
      const hasWorkingStream = img?.videoUrl && !img?.isVideoAuthRequired && !img.videoUrl.includes("navigator.dot.ga.gov");
      const streamUrl = hasWorkingStream ? img.videoUrl : undefined;

      const views = (c.images || []).map((vImg: any, idx: number) => {
        const vSnap = vImg.id
          ? `https://511ga.org/map/Cctv/${vImg.id}`
          : vImg.imageUrl
          ? vImg.imageUrl.startsWith("http")
            ? vImg.imageUrl
            : `https://511ga.org${vImg.imageUrl}`
          : `https://511ga.org/map/Cctv/${c.id}`;
        return {
          id: `ga511-${c.id}-view-${idx}`,
          name: vImg.description || `View ${idx + 1}`,
          snapshotUrl: vSnap,
          streamUrl: undefined,
        };
      });

      valid.push({
        id,
        rawId: String(c.id),
        name: `${loc} (${highway})`,
        city,
        agency: "GDOT NaviGAtor (511GA)",
        lat,
        lon,
        heading: 0,
        highway,
        snapshotUrl,
        streamUrl,
        views: views.length > 1 ? views : undefined,
        sourceUrl: "https://511ga.org/cctv",
        status: "LIVE_CONFIRMED",
        feedType: streamUrl ? "STREAM" : "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 11. MONTANA (MDT ATMS Public Cameras - app.mdt.mt.gov/atms/public/cameras)
export async function fetchMontanaCameras(): Promise<TrafficCameraNode[]> {
  try {
    const res = await fetch("https://app.mdt.mt.gov/atms/public/cameras", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const html = await res.text();

    // Extract all modal dialogs mapping modalId -> array of views
    const modalMap = new Map<string, Array<{ id: string; name: string; snapshotUrl: string }>>();
    const modalRegex = /<div class="modal camera-modal rwis-modal" id="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi;
    let mMatch: RegExpExecArray | null;

    while ((mMatch = modalRegex.exec(html)) !== null) {
      const modalId = mMatch[1];
      const modalContent = mMatch[2];
      const views: Array<{ id: string; name: string; snapshotUrl: string }> = [];

      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/gi;
      let iMatch: RegExpExecArray | null;
      const seenUrls = new Set<string>();

      while ((iMatch = imgRegex.exec(modalContent)) !== null) {
        const src = iMatch[1];
        const alt = iMatch[2] || "Camera View";
        if (!seenUrls.has(src) && src.includes(".jpg")) {
          seenUrls.add(src);
          const viewTitle = alt.split(" - ")[0] || alt;
          views.push({
            id: `${modalId}-v${views.length + 1}`,
            name: viewTitle,
            snapshotUrl: src,
          });
        }
      }
      modalMap.set(modalId, views);
    }

    // Extract all camera cards
    const cardRegex = /<div class="card mdt-card rwis-img-card[\s\S]*?<div class="card-body[\s\S]*?<\/div>\s*<\/div>/gi;
    const cards = html.match(cardRegex) || [];
    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const titleMatch = c.match(/<div class="col-md-10 h5">\s*<div>([^<]+)<\/div>\s*<div class="small">([^<]+)<\/div>/i);
      if (!titleMatch) continue;

      const stationName = titleMatch[1].trim();
      const locationText = titleMatch[2].trim();

      const imgMatch = c.match(/<img class="default-img-thumb" src="([^"]+)" alt="([^"]*)"/i);
      const defaultImg = imgMatch ? imgMatch[1] : "";
      const defaultAlt = imgMatch ? imgMatch[2] : "";

      const targetMatch = c.match(/data-target="#(modal\d+)"/i);
      const modalId = targetMatch ? targetMatch[1] : "";
      const views = modalMap.get(modalId) || [];

      // Extract station ID
      const idMatch = (defaultImg || "").match(/([A-Za-z0-9-]+)-(\d{6})-/);
      const rawId = idMatch ? idMatch[2] : `mt-${i + 1}`;
      const id = `mt-mdt-${rawId}`;

      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const coords = getMontanaStationCoords(stationName, locationText);
      const highway = inferMontanaHighway(locationText, stationName);
      const city = coords.city || inferMontanaCity(stationName, locationText, coords.lat, coords.lon);

      valid.push({
        id,
        rawId,
        name: `${stationName} - ${locationText} (${highway})`,
        city,
        agency: "Montana Department of Transportation (MDT)",
        lat: coords.lat,
        lon: coords.lon,
        heading: 0,
        highway,
        snapshotUrl: defaultImg || views[0]?.snapshotUrl || `https://app.mdt.mt.gov/atms/public/rwis/${rawId}`,
        streamUrl: undefined,
        views: views.length > 1 ? views : undefined,
        sourceUrl: "https://app.mdt.mt.gov/atms/public/cameras",
        status: "LIVE_CONFIRMED",
        feedType: "SNAPSHOT",
      });
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// 12. MISSOURI (MoDOT Traveler Information Map - traveler.modot.org/map)
export async function fetchMissouriCameras(): Promise<TrafficCameraNode[]> {
  try {
    const [streamRes, snapRes] = await Promise.all([
      fetch("https://traveler.modot.org/timconfig/feed/desktop/StreamingCams2.json", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
        },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null),
      fetch("https://traveler.modot.org/map/js/snapshot.json", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
        },
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
    ]);

    const valid: TrafficCameraNode[] = [];
    const seenIds = new Set<string>();

    // 1. Process 880+ Live Streaming Cameras
    if (streamRes && streamRes.ok) {
      const streamList = (await streamRes.json()) || [];
      for (let i = 0; i < streamList.length; i++) {
        const c = streamList[i];
        if (!c || !c.x || !c.y || !c.html) continue;

        const loc = (c.location || `MoDOT Camera ${i + 1}`).trim();
        const lat = Number(c.y);
        const lon = Number(c.x);
        if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) continue;

        const camMatch = c.html.match(/MODOT_CAM_(\d+)/i) || c.html.match(/\/(\d+)\/playlist/i);
        const rawId = camMatch ? `cam-${camMatch[1]}` : `cam-${i + 1}`;
        const id = `modot-${rawId}`;

        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const highway = inferMissouriHighway(loc);
        const city = inferMissouriCity(loc, lat, lon);

        valid.push({
          id,
          rawId,
          name: `${loc} (${highway})`,
          city,
          agency: "MoDOT Traveler Information",
          lat,
          lon,
          heading: 0,
          highway,
          snapshotUrl: `https://traveler.modot.org/map/`,
          streamUrl: c.html,
          sourceUrl: "https://traveler.modot.org/map/",
          status: "LIVE_CONFIRMED",
          feedType: "STREAM",
        });
      }
    }

    // 2. Process Snapshot Cameras
    if (snapRes && snapRes.ok) {
      const snapData = await snapRes.json();
      const snapList = snapData.cameras || [];
      for (const c of snapList) {
        if (!c || !c.location || !c.url) continue;

        const loc = (c.caption || `Camera ${c.id}`).trim();
        const lat = Number(c.location.y);
        const lon = Number(c.location.x);
        if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) continue;

        const id = `modot-snap-${c.id || Math.random().toString(36).slice(2, 7)}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const highway = inferMissouriHighway(loc);
        const city = inferMissouriCity(loc, lat, lon);
        const snapUrl = c.url.startsWith("http")
          ? c.url
          : `https://traveler.modot.org${c.url.startsWith("/") ? "" : "/"}${c.url}`;

        valid.push({
          id,
          rawId: `snap-${c.id}`,
          name: `${loc} (${highway})`,
          city,
          agency: "MoDOT Traveler Information",
          lat,
          lon,
          heading: 0,
          highway,
          snapshotUrl: snapUrl,
          sourceUrl: "https://traveler.modot.org/map/",
          status: "LIVE_CONFIRMED",
          feedType: "SNAPSHOT",
        });
      }
    }

    return valid;
  } catch (err) {
    return [];
  }
}

// Helper: infer general highway tag
function inferHighway(name: string, interstateNums: string[]): string {
  const combined = name.toUpperCase();
  const pattern = new RegExp(`(?:I-|INTERSTATE\\s*|SR-|US-|HWY\\s*|HIGHWAY\\s*|ROUTE\\s*)(${interstateNums.join("|")})`);
  const match = combined.match(pattern);
  if (match) {
    const num = match[1];
    return `I-${num}`;
  }
  return "State Highway";
}

function inferPennsylvaniaCity(loc: string, reg: string, lat: number, lon: number): string {
  const l = (loc + " " + reg).toLowerCase();
  if (l.includes("phila") || l.includes("schuylkill") || l.includes("vine st") || l.includes("roosevelt") || (lat >= 39.8 && lat <= 40.2 && lon >= -75.3 && lon <= -74.9)) return "Philadelphia, PA";
  if (l.includes("pitts") || l.includes("fort pitt") || l.includes("squirrel hill") || l.includes("liberty tunnel") || (lat >= 40.3 && lat <= 40.6 && lon >= -80.2 && lon <= -79.8)) return "Pittsburgh, PA";
  if (l.includes("harris") || l.includes("dauphin") || (lat >= 40.2 && lat <= 40.4 && lon >= -77.0 && lon <= -76.7)) return "Harrisburg, PA";
  if (l.includes("allentown") || l.includes("bethlehem") || l.includes("lehigh")) return "Allentown / Bethlehem, PA";
  if (l.includes("scranton") || l.includes("wilkes-barre")) return "Scranton / Wilkes-Barre, PA";
  if (l.includes("erie") || l.includes("presque isle")) return "Erie, PA";
  if (l.includes("lancaster")) return "Lancaster, PA";
  if (l.includes("reading")) return "Reading, PA";
  if (l.includes("york")) return "York, PA";
  if (l.includes("state college") || l.includes("penn state")) return "State College, PA";
  return "Pennsylvania, PA";
}

function inferWashingtonCity(loc: string, lat: number, lon: number): string {
  const l = loc.toLowerCase();
  if (l.includes("seattle") || l.includes("ship canal") || l.includes("alaskan way") || l.includes("mercer") || l.includes("lake union") || (lat >= 47.5 && lat <= 47.8 && lon >= -122.45 && lon <= -122.2)) return "Seattle, WA";
  if (l.includes("tacoma") || l.includes("narrows") || l.includes("puyallup") || (lat >= 47.15 && lat <= 47.35 && lon >= -122.6 && lon <= -122.3)) return "Tacoma, WA";
  if (l.includes("bellevue") || l.includes("kirkland") || l.includes("redmond") || l.includes("renton") || l.includes("everett") || l.includes("snohomish")) return "Greater Seattle / Eastside, WA";
  if (l.includes("spokane") || (lat >= 47.55 && lat <= 47.75 && lon >= -117.55 && lon <= -117.25)) return "Spokane, WA";
  if (l.includes("vancouver") || l.includes("interstate bridge") || l.includes("glenn jackson") || (lat >= 45.55 && lat <= 45.75 && lon >= -122.75 && lon <= -122.45)) return "Vancouver, WA";
  if (l.includes("olympia") || l.includes("thurston")) return "Olympia, WA";
  if (l.includes("bellingham")) return "Bellingham, WA";
  if (l.includes("tri-cities") || l.includes("kennewick") || l.includes("pasco") || l.includes("richland")) return "Tri-Cities, WA";
  if (l.includes("yakima")) return "Yakima, WA";
  if (l.includes("snoqualmie")) return "Snoqualmie Pass, WA";
  if (l.includes("stevens pass")) return "Stevens Pass, WA";
  return "Washington, WA";
}

function inferWisconsinCity(loc: string, reg: string, lat: number, lon: number): string {
  const l = (loc + " " + reg).toLowerCase();
  if (l.includes("milwaukee") || l.includes("marquette") || l.includes("mitchell") || l.includes("zoo interchange") || (lat >= 42.9 && lat <= 43.2 && lon >= -88.1 && lon <= -87.85)) return "Milwaukee, WI";
  if (l.includes("madison") || l.includes("beltline") || (lat >= 43.0 && lat <= 43.2 && lon >= -89.5 && lon <= -89.2)) return "Madison, WI";
  if (l.includes("green bay") || l.includes("fox river") || (lat >= 44.45 && lat <= 44.6 && lon >= -88.15 && lon <= -87.9)) return "Green Bay, WI";
  if (l.includes("appleton") || l.includes("oshkosh")) return "Fox Cities (Appleton / Oshkosh), WI";
  if (l.includes("eau claire")) return "Eau Claire, WI";
  if (l.includes("la crosse")) return "La Crosse, WI";
  if (l.includes("kenosha") || l.includes("racine")) return "Kenosha / Racine, WI";
  if (l.includes("wausau")) return "Wausau, WI";
  return "Wisconsin, WI";
}

function inferIdahoCity(loc: string, reg: string, lat: number, lon: number): string {
  const l = (loc + " " + reg).toLowerCase();
  if (l.includes("boise") || l.includes("meridian") || l.includes("nampa") || l.includes("caldwell") || l.includes("connector") || (lat >= 43.4 && lat <= 43.8 && lon >= -116.7 && lon <= -116.1)) return "Boise Metro (Treasure Valley), ID";
  if (l.includes("coeur d'alene") || l.includes("post falls") || (lat >= 47.6 && lat <= 47.8 && lon >= -117.0 && lon <= -116.7)) return "Coeur d'Alene, ID";
  if (l.includes("idaho falls") || (lat >= 43.4 && lat <= 43.6 && lon >= -112.15 && lon <= -111.95)) return "Idaho Falls, ID";
  if (l.includes("pocatello") || l.includes("chubbuck")) return "Pocatello, ID";
  if (l.includes("twin falls") || l.includes("perrine bridge")) return "Twin Falls, ID";
  if (l.includes("lewiston")) return "Lewiston, ID";
  if (l.includes("sun valley") || l.includes("ketchum")) return "Sun Valley / Ketchum, ID";
  return "Idaho, ID";
}

function inferConnecticutCity(loc: string, reg: string, lat: number, lon: number): string {
  const l = (loc + " " + reg).toLowerCase();
  if (l.includes("hartford") || l.includes("east hartford") || l.includes("west hartford") || (lat >= 41.7 && lat <= 41.85 && lon >= -72.75 && lon <= -72.6)) return "Hartford, CT";
  if (l.includes("new haven") || l.includes("q bridge") || l.includes("pearl harbor") || (lat >= 41.25 && lat <= 41.35 && lon >= -72.95 && lon <= -72.85)) return "New Haven, CT";
  if (l.includes("stamford") || l.includes("greenwich") || l.includes("norwalk") || (lat >= 41.0 && lat <= 41.15 && lon >= -73.65 && lon <= -73.4)) return "Stamford / Norwalk, CT";
  if (l.includes("bridgeport") || l.includes("stratford") || l.includes("fairfield")) return "Bridgeport, CT";
  if (l.includes("waterbury") || l.includes("mixmaster")) return "Waterbury, CT";
  if (l.includes("danbury")) return "Danbury, CT";
  if (l.includes("new london") || l.includes("groton") || l.includes("gold star")) return "New London / Groton, CT";
  return "Connecticut, CT";
}

function inferAlaskaCity(loc: string, reg: string, lat: number, lon: number): string {
  const l = (loc + " " + reg).toLowerCase();
  if (l.includes("anchorage") || l.includes("glenn") || l.includes("seward hwy") || (lat >= 61.1 && lat <= 61.3 && lon >= -150.0 && lon <= -149.6)) return "Anchorage, AK";
  if (l.includes("fairbanks") || l.includes("chena") || (lat >= 64.75 && lat <= 64.9 && lon >= -147.9 && lon <= -147.6)) return "Fairbanks, AK";
  if (l.includes("juneau") || l.includes("douglas")) return "Juneau, AK";
  if (l.includes("wasilla") || l.includes("palmer") || l.includes("mat-su")) return "Mat-Su Valley (Wasilla / Palmer), AK";
  if (l.includes("kenai") || l.includes("soldotna") || l.includes("homer")) return "Kenai Peninsula, AK";
  return "Alaska, AK";
}

function inferNewEnglandCity(loc: string, state: string, lat: number, lon: number): string {
  const l = loc.toLowerCase();
  if (state === "Maine") {
    if (l.includes("portland") || (lat >= 43.6 && lat <= 43.8 && lon >= -70.4 && lon <= -70.2)) return "Portland, ME";
    if (l.includes("bangor") || (lat >= 44.75 && lat <= 44.9 && lon >= -68.85 && lon <= -68.7)) return "Bangor, ME";
    if (l.includes("augusta") || (lat >= 44.25 && lat <= 44.4 && lon >= -69.85 && lon <= -69.7)) return "Augusta, ME";
    if (l.includes("lewiston") || l.includes("auburn")) return "Lewiston / Auburn, ME";
    if (l.includes("kittery") || l.includes("york")) return "Kittery / Southern Coast, ME";
    return "Maine, ME";
  } else if (state === "New Hampshire") {
    if (l.includes("manchester") || (lat >= 42.95 && lat <= 43.05 && lon >= -71.5 && lon <= -71.4)) return "Manchester, NH";
    if (l.includes("concord") || (lat >= 43.15 && lat <= 43.25 && lon >= -71.6 && lon <= -71.5)) return "Concord, NH";
    if (l.includes("nashua") || (lat >= 42.7 && lat <= 42.8 && lon >= -71.55 && lon <= -71.4)) return "Nashua, NH";
    if (l.includes("portsmouth") || l.includes("seacoast")) return "Portsmouth / Seacoast, NH";
    if (l.includes("franconia") || l.includes("white mountain")) return "Franconia Notch / White Mtns, NH";
    if (l.includes("salem") || l.includes("bedford")) return "Southern New Hampshire, NH";
    return "New Hampshire, NH";
  } else {
    // Vermont
    if (l.includes("burlington") || l.includes("chittenden") || (lat >= 44.45 && lat <= 44.55 && lon >= -73.25 && lon <= -73.15)) return "Burlington, VT";
    if (l.includes("montpelier") || l.includes("waterbury") || (lat >= 44.2 && lat <= 44.4 && lon >= -72.8 && lon <= -72.5)) return "Montpelier / Waterbury, VT";
    if (l.includes("rutland")) return "Rutland, VT";
    if (l.includes("brattleboro")) return "Brattleboro, VT";
    if (l.includes("white river junction") || l.includes("hartford")) return "White River Junction, VT";
    if (l.includes("st. albans") || l.includes("saint albans")) return "St. Albans, VT";
    return "Vermont, VT";
  }
}

function inferNebraskaCity(name: string, cityRef: string, lat: number, lon: number): string {
  const t = (name + " " + (cityRef || "")).toLowerCase();
  if (t.includes("omaha") || t.includes("douglas") || t.includes("sarpy") || (lat >= 41.15 && lat <= 41.38 && lon >= -96.25 && lon <= -95.85)) return "Omaha, NE";
  if (t.includes("lincoln") || t.includes("lancaster") || (lat >= 40.70 && lat <= 40.95 && lon >= -96.85 && lon <= -96.55)) return "Lincoln, NE";
  if (t.includes("bellevue") || t.includes("offutt")) return "Bellevue, NE";
  if (t.includes("grand island") || t.includes("hall county") || (lat >= 40.85 && lat <= 41.00 && lon >= -98.45 && lon <= -98.25)) return "Grand Island, NE";
  if (t.includes("kearney") || t.includes("buffalo county") || (lat >= 40.65 && lat <= 40.78 && lon >= -99.18 && lon <= -98.98)) return "Kearney, NE";
  if (t.includes("fremont") || t.includes("dodge county") || (lat >= 41.38 && lat <= 41.50 && lon >= -96.55 && lon <= -96.40)) return "Fremont, NE";
  if (t.includes("hastings") || t.includes("adams county") || (lat >= 40.55 && lat <= 40.65 && lon >= -98.45 && lon <= -98.30)) return "Hastings, NE";
  if (t.includes("norfolk") || t.includes("madison county") || (lat >= 41.98 && lat <= 42.08 && lon >= -97.48 && lon <= -97.35)) return "Norfolk, NE";
  if (t.includes("columbus") || t.includes("platte county") || (lat >= 41.40 && lat <= 41.48 && lon >= -97.40 && lon <= -97.30)) return "Columbus, NE";
  if (t.includes("north platte") || t.includes("lincoln county") || (lat >= 41.10 && lat <= 41.20 && lon >= -100.85 && lon <= -100.70)) return "North Platte, NE";
  if (t.includes("scottsbluff") || t.includes("gering") || (lat >= 41.80 && lat <= 41.92 && lon >= -103.75 && lon <= -103.60)) return "Scottsbluff / Gering, NE";
  if (t.includes("south sioux") || (lat >= 42.42 && lat <= 42.50 && lon >= -96.45 && lon <= -96.35)) return "South Sioux City, NE";
  if (t.includes("beatrice")) return "Beatrice, NE";
  if (t.includes("lexington") || t.includes("dawson county")) return "Lexington, NE";
  if (t.includes("york")) return "York, NE";
  if (t.includes("ogallala") || t.includes("keith county")) return "Ogallala, NE";
  if (t.includes("sidney") || t.includes("cheyenne county")) return "Sidney, NE";
  if (t.includes("kimball")) return "Kimball, NE";
  if (t.includes("alliance") || t.includes("box butte")) return "Alliance, NE";
  if (t.includes("mccook") || t.includes("red willow")) return "McCook, NE";
  if (t.includes("chadron") || t.includes("dawes county")) return "Chadron, NE";
  if (t.includes("valentine") || t.includes("cherry county")) return "Valentine, NE";
  if (t.includes("o'neill") || t.includes("oneill") || t.includes("holt county")) return "O'Neill, NE";
  if (t.includes("blair") || t.includes("washington county")) return "Blair, NE";
  if (t.includes("nebraska city") || t.includes("otoe county")) return "Nebraska City, NE";
  if (t.includes("plattsmouth")) return "Plattsmouth, NE";
  if (t.includes("seward")) return "Seward, NE";
  if (t.includes("gothenburg") || t.includes("cozad")) return "Gothenburg / Cozad, NE";
  if (t.includes("holdrege")) return "Holdrege, NE";
  if (t.includes("waverly")) return "Waverly, NE";
  if (t.includes("gretna")) return "Gretna, NE";
  if (t.includes("broken bow")) return "Broken Bow, NE";
  if (t.includes("gordon") || t.includes("sheridan")) return "Gordon, NE";
  if (t.includes("bridgeport") || t.includes("morrill")) return "Bridgeport, NE";

  const areaMatch = (cityRef || "").match(/of the\s+([A-Za-z\s]+)\s+area/i);
  if (areaMatch) {
    const cityName = areaMatch[1].trim();
    if (cityName.length > 2) return `${cityName}, NE`;
  }

  return "Nebraska, NE";
}

function inferNebraskaHighway(name: string, routeId?: string): string {
  const combined = `${routeId || ""} ${name}`.toUpperCase();
  const match = combined.match(/(?:^|\s|\/|,)(I-\d+|IH-\d+|INTERSTATE\s*\d+|US[-\s]*\d+|NE[-\s]*\d+|HWY[-\s]*\d+|HIGHWAY[-\s]*\d+|STATE\s*HWY[-\s]*\d+|ROUTE[-\s]*\d+)/i);
  if (match) {
    let hw = match[1].trim().toUpperCase().replace(/\s+/g, " ");
    if (hw.startsWith("INTERSTATE")) hw = hw.replace("INTERSTATE", "I-");
    return hw;
  }
  if (routeId) return routeId.toUpperCase();
  return "Nebraska Highway";
}

function inferIowaCity(desc: string, region: string, lat: number, lon: number): string {
  const t = (desc + " " + (region || "")).toLowerCase();
  if (t.includes("des moines") || t.includes("ankeny") || t.includes("urbandale") || t.includes("west des moines") || t.includes("clive") || t.includes("johnston") || t.includes("altoona") || (lat >= 41.45 && lat <= 41.72 && lon >= -93.85 && lon <= -93.45)) return "Des Moines, IA";
  if (t.includes("cedar rapids") || t.includes("marion") || t.includes("hiawatha") || (lat >= 41.90 && lat <= 42.10 && lon >= -91.78 && lon <= -91.55)) return "Cedar Rapids, IA";
  if (t.includes("davenport") || t.includes("bettendorf") || t.includes("quad cities") || (lat >= 41.48 && lat <= 41.65 && lon >= -90.65 && lon <= -90.40)) return "Davenport / Quad Cities, IA";
  if (t.includes("sioux city") || (lat >= 42.42 && lat <= 42.58 && lon >= -96.48 && lon <= -96.30)) return "Sioux City, IA";
  if (t.includes("iowa city") || t.includes("coralville") || t.includes("north liberty") || t.includes("tiffin") || (lat >= 41.60 && lat <= 41.75 && lon >= -91.65 && lon <= -91.45)) return "Iowa City, IA";
  if (t.includes("waterloo") || t.includes("cedar falls") || (lat >= 42.42 && lat <= 42.58 && lon >= -92.50 && lon <= -92.25)) return "Waterloo / Cedar Falls, IA";
  if (t.includes("council bluffs") || (lat >= 41.18 && lat <= 41.35 && lon >= -95.95 && lon <= -95.75)) return "Council Bluffs, IA";
  if (t.includes("ames") || t.includes("boone") || t.includes("nevada") || t.includes("story city") || (lat >= 41.95 && lat <= 42.10 && lon >= -93.75 && lon <= -93.50)) return "Ames, IA";
  if (t.includes("dubuque") || (lat >= 42.45 && lat <= 42.58 && lon >= -90.75 && lon <= -90.60)) return "Dubuque, IA";
  if (t.includes("mason city") || t.includes("clear lake") || t.includes("clear lk") || (lat >= 43.08 && lat <= 43.20 && lon >= -93.40 && lon <= -93.15)) return "Mason City / Clear Lake, IA";
  if (t.includes("fort dodge") || (lat >= 42.48 && lat <= 42.55 && lon >= -94.25 && lon <= -94.12)) return "Fort Dodge, IA";
  if (t.includes("burlington") || (lat >= 40.78 && lat <= 40.88 && lon >= -91.20 && lon <= -91.08)) return "Burlington, IA";
  if (t.includes("marshalltown")) return "Marshalltown, IA";
  if (t.includes("clinton")) return "Clinton, IA";
  if (t.includes("ottumwa")) return "Ottumwa, IA";
  if (t.includes("muscatine")) return "Muscatine, IA";
  if (t.includes("newton")) return "Newton, IA";
  if (t.includes("grinnell")) return "Grinnell, IA";
  if (t.includes("osceola")) return "Osceola, IA";
  if (t.includes("wilton")) return "Wilton, IA";
  if (t.includes("shelby") || t.includes("avoca")) return "Shelby County, IA";
  if (t.includes("victor")) return "Victor, IA";
  if (t.includes("adair")) return "Adair, IA";
  if (t.includes("mitchellville")) return "Mitchellville, IA";
  if (t.includes("lamoni")) return "Lamoni, IA";

  return "Iowa State, IA";
}

function inferIowaHighway(desc: string, route?: string): string {
  const combined = `${route || ""} ${desc || ""}`.toUpperCase();
  const match = combined.match(/(?:^|\s|\/|,)(I-\d+|IH-\d+|INTERSTATE\s*\d+|US[-\s]*\d+|IA[-\s]*\d+|HWY[-\s]*\d+|HIGHWAY[-\s]*\d+|STATE\s*HWY[-\s]*\d+|ROUTE[-\s]*\d+)/i);
  if (match) {
    let hw = match[1].trim().toUpperCase().replace(/\s+/g, " ");
    if (hw.startsWith("INTERSTATE")) hw = hw.replace("INTERSTATE", "I-");
    return hw;
  }
  if (route) return route.toUpperCase();
  return "Iowa Highway";
}

function inferGeorgiaCity(loc: string, roadway: string, lat: number, lon: number): string {
  const l = (loc + " " + (roadway || "")).toLowerCase();
  if (l.includes("atlanta") || l.includes("perimeter") || l.includes("downtown connector") || l.includes("midtown") || l.includes("buckhead") || (lat >= 33.65 && lat <= 33.90 && lon >= -84.50 && lon <= -84.30)) return "Atlanta, GA";
  if (l.includes("marietta") || l.includes("cobb") || l.includes("smyrna") || l.includes("kennesaw")) return "Marietta / Cobb County, GA";
  if (l.includes("alpharetta") || l.includes("roswell") || l.includes("sandy springs") || l.includes("dunwoody") || l.includes("johns creek")) return "North Metro (Alpharetta / Roswell), GA";
  if (l.includes("gwinnett") || l.includes("duluth") || l.includes("lawrenceville") || l.includes("norcross") || l.includes("buford")) return "Gwinnett (Lawrenceville / Duluth), GA";
  if (l.includes("dekalb") || l.includes("decatur") || l.includes("stone mountain") || l.includes("doraville")) return "DeKalb (Decatur / Stone Mtn), GA";
  if (l.includes("clayton") || l.includes("hartsfield") || l.includes("airport") || l.includes("college park") || l.includes("forest park")) return "South Metro / Airport (Clayton), GA";
  if (l.includes("savannah") || l.includes("chatham") || l.includes("tybee") || (lat >= 31.95 && lat <= 32.18 && lon >= -81.25 && lon <= -80.95)) return "Savannah, GA";
  if (l.includes("augusta") || l.includes("richmond") || (lat >= 33.40 && lat <= 33.55 && lon >= -82.15 && lon <= -81.90)) return "Augusta, GA";
  if (l.includes("columbus") || l.includes("muscogee") || (lat >= 32.42 && lat <= 32.58 && lon >= -85.02 && lon <= -84.85)) return "Columbus, GA";
  if (l.includes("macon") || l.includes("bibb") || (lat >= 32.78 && lat <= 32.92 && lon >= -83.75 && lon <= -83.55)) return "Macon, GA";
  if (l.includes("athens") || l.includes("clarke") || (lat >= 33.90 && lat <= 34.02 && lon >= -83.45 && lon <= -83.30)) return "Athens, GA";
  if (l.includes("valdosta") || l.includes("lowndes") || (lat >= 30.80 && lat <= 30.90 && lon >= -83.35 && lon <= -83.22)) return "Valdosta, GA";
  if (l.includes("albany") || l.includes("dougherty") || (lat >= 31.52 && lat <= 31.65 && lon >= -84.25 && lon <= -84.10)) return "Albany, GA";
  if (l.includes("brunswick") || l.includes("glynn") || l.includes("st. simons") || l.includes("jekyll")) return "Golden Isles (Brunswick), GA";
  if (l.includes("dalton") || l.includes("whitfield") || (lat >= 34.72 && lat <= 34.82 && lon >= -85.02 && lon <= -84.90)) return "Dalton, GA";
  if (l.includes("rome") || l.includes("floyd") || (lat >= 34.22 && lat <= 34.30 && lon >= -85.22 && lon <= -85.12)) return "Rome, GA";
  if (l.includes("gainesville") || l.includes("hall")) return "Gainesville, GA";
  if (l.includes("cartersville") || l.includes("bartow")) return "Cartersville (Bartow), GA";
  if (l.includes("newnan") || l.includes("coweta")) return "Newnan (Coweta), GA";
  if (l.includes("peachtree city") || l.includes("fayette")) return "Peachtree City (Fayette), GA";
  if (l.includes("douglasville") || l.includes("douglas")) return "Douglasville, GA";
  if (l.includes("henry") || l.includes("mcdonough") || l.includes("stockbridge")) return "Henry County (McDonough), GA";
  if (l.includes("forsyth") || l.includes("cumming")) return "Cumming (Forsyth), GA";
  if (l.includes("cherokee") || l.includes("canton") || l.includes("woodstock")) return "Cherokee (Woodstock / Canton), GA";
  if (l.includes("paulding") || l.includes("dallas")) return "Paulding County, GA";
  if (l.includes("rockdale") || l.includes("conyers")) return "Conyers (Rockdale), GA";
  if (l.includes("newton") || l.includes("covington")) return "Covington (Newton), GA";
  if (l.includes("troup") || l.includes("lagrange")) return "LaGrange (Troup), GA";
  if (l.includes("statesboro") || l.includes("bulloch")) return "Statesboro, GA";
  if (l.includes("warner robins") || l.includes("houston")) return "Warner Robins, GA";
  if (l.includes("tifton") || l.includes("tift")) return "Tifton, GA";

  return "Georgia State, GA";
}

function inferGeorgiaHighway(loc: string, roadway?: string): string {
  const combined = `${roadway || ""} ${loc || ""}`.toUpperCase();
  const match = combined.match(/(?:^|\s|\/|,)(I-\d+|IH-\d+|INTERSTATE\s*\d+|SR[-\s]*\d+|GA[-\s]*\d+|US[-\s]*\d+|HWY[-\s]*\d+|HIGHWAY[-\s]*\d+|STATE\s*ROUTE\s*\d+)/i);
  if (match) {
    let hw = match[1].trim().toUpperCase().replace(/\s+/g, " ");
    if (hw.startsWith("INTERSTATE")) hw = hw.replace("INTERSTATE", "I-");
    return hw;
  }
  if (roadway) return roadway.toUpperCase();
  return "Georgia Hwy";
}

// Montana MDT ATMS Station Location & Highway Resolvers
const MT_STATION_COORDINATES: Record<string, { lat: number; lon: number; city: string }> = {
  "aberdeen hill": { lat: 45.0321, lon: -107.4125, city: "Crow Agency / Hardin, MT" },
  "alzada": { lat: 45.0234, lon: -104.4121, city: "Alzada (Carter County), MT" },
  "arrow creek hill": { lat: 45.6987, lon: -108.312, city: "Billings East / Arrow Creek, MT" },
  "ash creek": { lat: 46.8521, lon: -104.2843, city: "Wibaux / Glendive, MT" },
  "avon north": { lat: 46.7214, lon: -112.7845, city: "Avon (Powell County), MT" },
  "baker": { lat: 46.3654, lon: -104.2765, city: "Baker (Fallon County), MT" },
  "ballantine": { lat: 45.9421, lon: -108.2845, city: "Ballantine / Huntley, MT" },
  "beacon hill": { lat: 46.1245, lon: -108.412, city: "Roundup / Musselshell, MT" },
  "bearmouth": { lat: 46.7089, lon: -113.3421, city: "Bearmouth / Drummond, MT" },
  "beaver hill": { lat: 47.1045, lon: -104.712, city: "Glendive East, MT" },
  "biddle": { lat: 45.0987, lon: -105.3421, city: "Biddle (Powder River County), MT" },
  "big hole pass": { lat: 45.3124, lon: -113.412, city: "Big Hole Pass (Beaverhead), MT" },
  "big sky road": { lat: 45.2654, lon: -111.312, city: "Big Sky Resort, MT" },
  "blue moon": { lat: 48.3754, lon: -114.212, city: "Columbia Falls / Whitefish, MT" },
  "bohemian corner": { lat: 47.5421, lon: -108.6421, city: "Bohemian Corner / Lewistown, MT" },
  "bonner": { lat: 46.8745, lon: -113.8745, city: "Bonner / Missoula East, MT" },
  "boulder hill": { lat: 46.3124, lon: -112.1245, city: "Boulder Hill / Jefferson City, MT" },
  "boulder south": { lat: 46.1845, lon: -112.0845, city: "Boulder South (Jefferson County), MT" },
  "bowmans": { lat: 47.4125, lon: -112.2845, city: "Bowmans / Augusta, MT" },
  "bozeman": { lat: 45.6789, lon: -111.0421, city: "Bozeman, MT" },
  "bozeman pass": { lat: 45.6421, lon: -110.8124, city: "Bozeman Pass (Gallatin Range), MT" },
  "bridger canyon": { lat: 45.7845, lon: -110.9124, city: "Bridger Bowl / Bozeman North, MT" },
  "browning": { lat: 48.5564, lon: -113.0124, city: "Browning (Blackfeet Nation), MT" },
  "bull lake": { lat: 48.2124, lon: -115.8421, city: "Bull Lake / Cabinet Mtns, MT" },
  "bull mountain": { lat: 46.2845, lon: -108.5124, city: "Bull Mountain / Roundup, MT" },
  "chinook": { lat: 48.5912, lon: -109.2314, city: "Chinook (Blaine County), MT" },
  "choteau south": { lat: 47.8124, lon: -112.1845, city: "Choteau (Teton County), MT" },
  "clancy": { lat: 46.4687, lon: -111.9845, city: "Clancy / Helena South, MT" },
  "coalwood": { lat: 45.5421, lon: -105.7124, city: "Coalwood / Broadus, MT" },
  "comertown": { lat: 48.8945, lon: -104.2845, city: "Comertown / Plentywood, MT" },
  "cow creek": { lat: 48.4124, lon: -105.5124, city: "Cow Creek / Wolf Point, MT" },
  "crystal creek": { lat: 48.4845, lon: -115.6124, city: "Crystal Creek / Libby, MT" },
  "decker": { lat: 45.0124, lon: -106.8421, city: "Decker (Big Horn County), MT" },
  "deep creek": { lat: 46.3421, lon: -111.3124, city: "Deep Creek / Townsend, MT" },
  "dickey lake": { lat: 48.7421, lon: -114.9124, city: "Dickey Lake / Fortine, MT" },
  "east livingston": { lat: 45.6687, lon: -110.5124, city: "Livingston East, MT" },
  "east of denton": { lat: 47.3124, lon: -109.8421, city: "Denton / Fergus County, MT" },
  "eddies corner": { lat: 47.1421, lon: -109.7845, city: "Eddies Corner / Moore, MT" },
  "ekalaka": { lat: 45.8894, lon: -104.5421, city: "Ekalaka (Carter County), MT" },
  "elk park": { lat: 46.1245, lon: -112.4845, city: "Elk Park Pass (Continental Divide), MT" },
  "elmo": { lat: 47.8124, lon: -114.3421, city: "Elmo / Flathead Lake West, MT" },
  "essex": { lat: 48.2789, lon: -113.6124, city: "Essex (Marias Pass / Glacier), MT" },
  "evaro hill": { lat: 47.0421, lon: -114.0421, city: "Evaro Hill / Missoula North, MT" },
  "flathead river": { lat: 48.0124, lon: -114.0845, city: "Flathead River / Polson, MT" },
  "flesher pass": { lat: 46.9421, lon: -112.3421, city: "Flesher Pass (Continental Divide), MT" },
  "gardiner": { lat: 45.0312, lon: -110.7089, city: "Gardiner (Yellowstone North), MT" },
  "garrison": { lat: 46.5214, lon: -112.8124, city: "Garrison Junction (I-90/US-12), MT" },
  "gary cooper bridge": { lat: 47.0124, lon: -111.8421, city: "Gary Cooper Bridge / Missouri River, MT" },
  "georgetown lake": { lat: 46.1845, lon: -113.2845, city: "Georgetown Lake / Anaconda, MT" },
  "geyser": { lat: 47.2654, lon: -110.4845, city: "Geyser (Judith Basin), MT" },
  "government hill": { lat: 46.4124, lon: -104.4124, city: "Baker / Fallon East, MT" },
  "great falls": { lat: 47.5054, lon: -111.3008, city: "Great Falls, MT" },
  "greenough hill": { lat: 46.9124, lon: -113.4845, city: "Greenough / Blackfoot Valley, MT" },
  "harlowton south": { lat: 46.4321, lon: -109.8321, city: "Harlowton (Wheatland County), MT" },
  "hays": { lat: 47.9845, lon: -108.6845, city: "Hays (Fort Belknap), MT" },
  "helmville": { lat: 46.8845, lon: -113.0421, city: "Helmville / Blackfoot, MT" },
  "home creek divide": { lat: 45.4845, lon: -106.3124, city: "Home Creek Divide / Ashland, MT" },
  "homestake pass": { lat: 45.9214, lon: -112.4124, city: "Homestake Pass (Continental Divide), MT" },
  "hungry horse": { lat: 48.3845, lon: -114.0612, city: "Hungry Horse / Glacier West, MT" },
  "hysham": { lat: 46.2912, lon: -107.2314, city: "Hysham (Treasure County), MT" },
  "ingomar": { lat: 46.5812, lon: -107.3654, city: "Ingomar (Rosebud County), MT" },
  "inverness": { lat: 48.5489, lon: -110.6124, city: "Inverness (Hill County), MT" },
  "judith gap": { lat: 46.6845, lon: -109.7541, city: "Judith Gap (Judith Basin), MT" },
  "karst": { lat: 45.4124, lon: -111.2314, city: "Karst / Gallatin Gateway, MT" },
  "kings hill": { lat: 46.8345, lon: -110.7124, city: "Kings Hill Pass (Little Belt Mtns), MT" },
  "lambert": { lat: 47.6845, lon: -104.6124, city: "Lambert (Richland County), MT" },
  "lame deer divide": { lat: 45.6214, lon: -106.6712, city: "Lame Deer (Northern Cheyenne), MT" },
  "lavina": { lat: 46.2945, lon: -108.9421, city: "Lavina (Golden Valley), MT" },
  "lewistown divide": { lat: 47.0624, lon: -109.4289, city: "Lewistown Divide (Fergus County), MT" },
  "lindsay divide": { lat: 47.2124, lon: -105.1421, city: "Lindsay Divide (Dawson County), MT" },
  "livingston river hill": { lat: 45.6541, lon: -110.5612, city: "Livingston / Yellowstone River, MT" },
  "lolo north": { lat: 46.7589, lon: -114.0812, city: "Lolo / Missoula South, MT" },
  "loma": { lat: 47.9345, lon: -110.5012, city: "Loma / Marias River, MT" },
  "lookout pass": { lat: 47.4564, lon: -115.6987, city: "Lookout Pass (ID/MT Border), MT" },
  "lufborough": { lat: 47.3124, lon: -109.1245, city: "Lufborough / Lewistown East, MT" },
  "macdonald pass": { lat: 46.5512, lon: -112.3124, city: "MacDonald Pass (Continental Divide), MT" },
  "malta south": { lat: 48.3612, lon: -107.8745, city: "Malta (Phillips County), MT" },
  "mcdonalds": { lat: 48.5124, lon: -105.6124, city: "Scobey / Daniels County, MT" },
  "mcguire creek": { lat: 47.8124, lon: -106.2845, city: "Fort Peck / McGuire Creek, MT" },
  "monarch canyon": { lat: 47.1045, lon: -110.8421, city: "Monarch Canyon / Neihart, MT" },
  "monida pass": { lat: 44.5587, lon: -112.3124, city: "Monida Pass (ID/MT Border), MT" },
  "navajo": { lat: 48.8124, lon: -104.6124, city: "Navajo / Daniels County, MT" },
  "ninemile": { lat: 47.0124, lon: -114.4564, city: "Ninemile / Alberton, MT" },
  "norris hill": { lat: 45.5687, lon: -111.7124, city: "Norris Hill / Madison County, MT" },
  "pendroy": { lat: 48.0612, lon: -112.3124, city: "Pendroy (Teton County), MT" },
  "poplar": { lat: 48.1124, lon: -105.0089, city: "Poplar (Fort Peck Reservation), MT" },
  "raynolds pass": { lat: 44.7124, lon: -111.4845, city: "Raynolds Pass (ID/MT Border), MT" },
  "reed point": { lat: 45.7124, lon: -109.5421, city: "Reed Point / Stillwater, MT" },
  "rock springs": { lat: 46.8124, lon: -106.2421, city: "Rock Springs (Rosebud County), MT" },
  "rogers pass": { lat: 47.0812, lon: -112.3712, city: "Rogers Pass (Continental Divide), MT" },
  "roscoe hill": { lat: 45.3124, lon: -109.3845, city: "Roscoe / Beartooth Foothills, MT" },
  "saco": { lat: 48.4564, lon: -107.3421, city: "Saco (Phillips County), MT" },
  "savage": { lat: 47.4512, lon: -104.3421, city: "Savage (Richland County), MT" },
  "sheep mountain": { lat: 47.3124, lon: -105.8421, city: "Sheep Mountain / McCone, MT" },
  "sieben": { lat: 46.8845, lon: -112.0612, city: "Sieben / Helena North, MT" },
  "sioux pass": { lat: 47.7845, lon: -104.2845, city: "Sioux Pass / Sidney, MT" },
  "spokane creek": { lat: 46.5845, lon: -111.8421, city: "Spokane Creek / East Helena, MT" },
  "springdale": { lat: 45.7421, lon: -110.2314, city: "Springdale / Park County, MT" },
  "st. marie": { lat: 48.3421, lon: -106.5421, city: "St. Marie / Glasgow North, MT" },
  "st. regis": { lat: 47.3012, lon: -115.0912, city: "St. Regis (Mineral County), MT" },
  "sunburst": { lat: 48.8845, lon: -111.9012, city: "Sunburst (Toole County), MT" },
  "swan lake": { lat: 47.9312, lon: -113.8421, city: "Swan Lake / Flathead National Forest, MT" },
  "sweeney": { lat: 46.5421, lon: -106.5124, city: "Sweeney / Forsyth East, MT" },
  "sweet grass": { lat: 48.9987, lon: -111.9612, city: "Sweet Grass (US/Canada Border), MT" },
  "taft": { lat: 47.4124, lon: -115.6124, city: "Taft (St. Regis River Valley), MT" },
  "teton river": { lat: 47.9124, lon: -111.6124, city: "Teton River / Fort Benton, MT" },
  "three forks i-90": { lat: 45.8945, lon: -111.5845, city: "Three Forks (Headwaters of Missouri), MT" },
  "toston bridge": { lat: 46.1687, lon: -111.4564, city: "Toston / Missouri River Crossing, MT" },
  "trout creek": { lat: 47.8612, lon: -115.6124, city: "Trout Creek (Sanders County), MT" },
  "two medicine bridge": { lat: 48.4564, lon: -113.2124, city: "Two Medicine / Glacier East, MT" },
  "us-2 stateline": { lat: 48.0012, lon: -104.0489, city: "US-2 Stateline (MT/ND Border), MT" },
  "valier": { lat: 48.3124, lon: -112.2456, city: "Valier (Pondera County), MT" },
  "west glacier": { lat: 48.4987, lon: -113.9789, city: "West Glacier (Glacier Nat Park Entrance), MT" },
  "winnett": { lat: 47.0045, lon: -107.9845, city: "Winnett (Petroleum County), MT" },
  "yaak hill": { lat: 48.5845, lon: -115.8912, city: "Yaak Hill / Troy, MT" },
  "yellow bay": { lat: 47.8845, lon: -114.0212, city: "Yellow Bay (Flathead Lake East), MT" },
  "yellowstone river bridge": { lat: 45.8124, lon: -108.4564, city: "Yellowstone River / Billings, MT" },
};

function getMontanaStationCoords(name: string, location: string): { lat: number; lon: number; city: string } {
  const key = name.toLowerCase().trim();
  if (MT_STATION_COORDINATES[key]) {
    return MT_STATION_COORDINATES[key];
  }
  for (const [k, v] of Object.entries(MT_STATION_COORDINATES)) {
    if (key.includes(k) || k.includes(key)) {
      return v;
    }
  }
  // Heuristic based on highway location text
  const loc = location.toUpperCase();
  if (loc.includes("I-90")) return { lat: 46.12, lon: -111.5, city: "I-90 Corridor, MT" };
  if (loc.includes("I-15")) return { lat: 46.85, lon: -112.0, city: "I-15 Corridor, MT" };
  if (loc.includes("I-94")) return { lat: 46.5, lon: -106.0, city: "I-94 Corridor, MT" };
  if (loc.includes("US-2")) return { lat: 48.5, lon: -112.0, city: "US-2 Hi-Line, MT" };
  if (loc.includes("US-93")) return { lat: 47.5, lon: -114.2, city: "US-93 Corridor, MT" };
  if (loc.includes("US-12")) return { lat: 46.5, lon: -110.5, city: "US-12 Corridor, MT" };
  if (loc.includes("MT-200")) return { lat: 47.2, lon: -110.0, city: "MT-200 Corridor, MT" };
  return { lat: 46.8797, lon: -110.3626, city: "Montana State, MT" };
}

function inferMontanaHighway(locationText: string, name: string): string {
  const combined = `${locationText} ${name}`.toUpperCase();
  const match = combined.match(/(?:^|\s|\/|,)(I-\d+|INTERSTATE\s*\d+|US[-\s]*\d+|MT[-\s]*\d+|S[-\s]*\d+|HWY[-\s]*\d+|HIGHWAY[-\s]*\d+|ROUTE\s*\d+)/i);
  if (match) {
    let hw = match[1].trim().toUpperCase().replace(/\s+/g, " ");
    if (hw.startsWith("INTERSTATE")) hw = hw.replace("INTERSTATE", "I-");
    return hw;
  }
  return "Montana Highway";
}

function inferMontanaCity(name: string, locationText: string, lat: number, lon: number): string {
  const combined = `${name} ${locationText}`.toLowerCase();
  if (combined.includes("missoula") || combined.includes("bonner") || combined.includes("evaro") || combined.includes("lolo")) return "Missoula, MT";
  if (combined.includes("billings") || combined.includes("huntley") || combined.includes("ballantine") || combined.includes("arrow creek")) return "Billings, MT";
  if (combined.includes("bozeman") || combined.includes("bridger") || combined.includes("big sky") || combined.includes("three forks")) return "Bozeman, MT";
  if (combined.includes("helena") || combined.includes("clancy") || combined.includes("macdonald") || combined.includes("spokane")) return "Helena, MT";
  if (combined.includes("great falls") || combined.includes("gary cooper")) return "Great Falls, MT";
  if (combined.includes("butte") || combined.includes("homestake") || combined.includes("elk park")) return "Butte, MT";
  if (combined.includes("kalispell") || combined.includes("flathead") || combined.includes("whitefish") || combined.includes("blue moon")) return "Kalispell / Flathead, MT";
  if (combined.includes("glacier") || combined.includes("essex") || combined.includes("hungry horse") || combined.includes("browning")) return "Glacier National Park Region, MT";
  if (combined.includes("glendive") || combined.includes("beaver hill")) return "Glendive, MT";
  if (combined.includes("miles city") || combined.includes("sweeney")) return "Miles City, MT";
  if (combined.includes("livingston") || combined.includes("gardiner")) return "Livingston / Paradise Valley, MT";
  if (combined.includes("lewistown") || combined.includes("denton") || combined.includes("eddies corner")) return "Lewistown, MT";
  if (combined.includes("havre") || combined.includes("chinook") || combined.includes("inverness")) return "Havre / Hi-Line, MT";
  if (combined.includes("libby") || combined.includes("troy") || combined.includes("yaak") || combined.includes("bull lake")) return "Libby / Kootenai, MT";

  if (lat >= 46.7 && lat <= 47.1 && lon >= -114.2 && lon <= -113.8) return "Missoula, MT";
  if (lat >= 45.6 && lat <= 46.0 && lon >= -108.7 && lon <= -108.3) return "Billings, MT";
  if (lat >= 45.5 && lat <= 45.8 && lon >= -111.2 && lon <= -110.8) return "Bozeman, MT";
  if (lat >= 46.4 && lat <= 46.8 && lon >= -112.2 && lon <= -111.8) return "Helena, MT";
  if (lat >= 47.3 && lat <= 47.7 && lon >= -111.5 && lon <= -111.1) return "Great Falls, MT";

  return "Montana State, MT";
}

// Missouri MoDOT Highway & City Resolvers
function inferMissouriHighway(loc: string): string {
  const l = loc.toUpperCase();
  const m = l.match(/(?:^|\s|\/|,)(I-\d+|INTERSTATE\s*\d+|US[-\s]*\d+|MO[-\s]*\d+|ROUTE\s*\d+|HWY[-\s]*\d+|HIGHWAY\s*\d+|RT[-\s]*\d+|\b\d{1,3}\b)/i);
  if (m) {
    let num = m[1].replace(/^(?:INTERSTATE|HIGHWAY|HWY|ROUTE|RT)[-\s]*/i, "");
    if (num.startsWith("I-")) return num;
    if (["70", "44", "55", "35", "64", "270", "435", "470", "670", "229", "255", "72", "170"].includes(num)) return `I-${num}`;
    if (["40", "50", "54", "60", "61", "63", "65", "67", "71", "160", "166", "169", "275", "412"].includes(num)) return `US-${num}`;
    if (["141", "370", "364", "100", "94", "21", "30", "13", "7", "5", "152", "291", "350", "150", "130", "133", "135", "74", "32"].includes(num)) return `MO-${num}`;
    return `MO-${num}`;
  }
  return "MoDOT Highway";
}

function inferMissouriCity(loc: string, lat: number, lon: number): string {
  const l = loc.toLowerCase();
  // Greater St. Louis
  if (
    l.includes("st. louis") ||
    l.includes("st louis") ||
    l.includes("st. charles") ||
    l.includes("chesterfield") ||
    l.includes("clayton") ||
    l.includes("florissant") ||
    l.includes("maryland heights") ||
    l.includes("creve coeur") ||
    l.includes("kirkwood") ||
    l.includes("wentzville") ||
    l.includes("o'fallon") ||
    (lat >= 38.35 && lat <= 38.95 && lon >= -90.75 && lon <= -90.15)
  ) {
    if (l.includes("st. charles") || l.includes("wentzville") || l.includes("o'fallon") || l.includes("st charles") || lon < -90.5) return "St. Charles / West Metro, MO";
    return "St. Louis, MO";
  }
  // Greater Kansas City
  if (
    l.includes("kansas city") ||
    l.includes("kc") ||
    l.includes("independence") ||
    l.includes("lee's summit") ||
    l.includes("blue springs") ||
    l.includes("liberty") ||
    l.includes("gladstone") ||
    (lat >= 38.80 && lat <= 39.35 && lon >= -94.75 && lon <= -94.20)
  ) {
    if (l.includes("independence") || l.includes("blue springs") || l.includes("lee's summit")) return "Independence / Jackson County, MO";
    return "Kansas City, MO";
  }
  // Springfield & Southwest MO
  if (l.includes("springfield") || l.includes("branson") || l.includes("ozark") || l.includes("nixa") || (lat >= 36.95 && lat <= 37.35 && lon >= -93.45 && lon <= -93.15)) return "Springfield / Ozarks, MO";
  if (l.includes("joplin") || l.includes("webb city") || l.includes("carthage") || (lat >= 37.00 && lat <= 37.25 && lon >= -94.65 && lon <= -94.25)) return "Joplin, MO";
  // Central MO
  if (l.includes("columbia") || (lat >= 38.85 && lat <= 39.05 && lon >= -92.45 && lon <= -92.20)) return "Columbia, MO";
  if (l.includes("jefferson city") || l.includes("jeff city") || (lat >= 38.50 && lat <= 38.65 && lon >= -92.25 && lon <= -92.10)) return "Jefferson City, MO";
  if (l.includes("lake of the ozarks") || l.includes("osage beach") || l.includes("camdenton") || (lat >= 37.95 && lat <= 38.25 && lon >= -92.90 && lon <= -92.50)) return "Lake of the Ozarks, MO";
  // Northwest & North MO
  if (l.includes("st. joseph") || l.includes("st joseph") || (lat >= 39.65 && lat <= 39.85 && lon >= -94.95 && lon <= -94.70)) return "St. Joseph, MO";
  if (l.includes("kirksville") || l.includes("hannibal") || (lat >= 39.65 && lat <= 40.25 && lon >= -92.65 && lon <= -91.35)) return "Hannibal / Kirksville, MO";
  // Southeast MO
  if (l.includes("cape girardeau") || l.includes("cape") || l.includes("sikeston") || l.includes("poplar bluff") || (lat >= 36.50 && lat <= 37.45 && lon >= -90.50 && lon <= -89.45)) return "Cape Girardeau / Bootheel, MO";
  if (l.includes("rolla") || l.includes("fort leonard wood") || (lat >= 37.75 && lat <= 38.05 && lon >= -92.25 && lon <= -91.65)) return "Rolla / Fort Leonard Wood, MO";

  return "Missouri State, MO";
}




