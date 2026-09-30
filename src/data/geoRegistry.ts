import { MapHighlight } from '../types';
import { GLOBAL_LOCATIONS } from './globalLocations';

export const GEO_HIGHLIGHT_REGISTRY: Record<string, MapHighlight> = {
  // --------------------------------------------------------------------------
  // 1. CONTINENTS
  // --------------------------------------------------------------------------
  africa: {
    id: 'continent-africa',
    name: 'Africa',
    category: 'CONTINENT',
    lat: 1.6508,
    lon: 17.6879,
    zoom: 3,
    radiusKm: 4200,
    bounds: [[-35.0, -18.0], [37.5, 52.0]],
    color: '#f59e0b',
    flagOrIcon: '🌍',
    description: 'Second-largest continent with 54 sovereign nations and strategic maritime waterways (Suez Canal, Cape of Good Hope, Bab-el-Mandeb).',
    stats: {
      population: '1.4 billion',
      area: '30.37 million km²',
      info: '54 countries • Indian & Atlantic littoral'
    }
  },
  europe: {
    id: 'continent-europe',
    name: 'Europe',
    category: 'CONTINENT',
    lat: 54.5260,
    lon: 15.2551,
    zoom: 4,
    radiusKm: 2800,
    bounds: [[34.5, -11.5], [71.2, 42.5]],
    color: '#3b82f6',
    flagOrIcon: '🌍',
    description: 'European continent, home to high-density airspace networks, Baltic & Mediterranean shipping lanes, and European rail infrastructure.',
    stats: {
      population: '745 million',
      area: '10.18 million km²',
      info: '44 countries • High-density transit & air corridor'
    }
  },
  asia: {
    id: 'continent-asia',
    name: 'Asia',
    category: 'CONTINENT',
    lat: 34.0479,
    lon: 100.6197,
    zoom: 3,
    radiusKm: 5500,
    bounds: [[-11.0, 26.0], [77.0, 169.0]],
    color: '#ef4444',
    flagOrIcon: '🌏',
    description: 'Earth\'s largest continent spanning from Anatolia and the Arabian Peninsula to the Pacific Rim, encompassing leading industrial hubs.',
    stats: {
      population: '4.75 billion',
      area: '44.58 million km²',
      info: '48 countries • Malacca, South China Sea & Pacific rim'
    }
  },
  "north america": {
    id: 'continent-north-america',
    name: 'North America',
    category: 'CONTINENT',
    lat: 48.0000,
    lon: -100.0000,
    zoom: 3,
    radiusKm: 4800,
    bounds: [[14.0, -168.0], [72.0, -52.0]],
    color: '#06b6d4',
    flagOrIcon: '🌎',
    description: 'North American continent spanning Canada, the United States, and Mexico with major airspace networks and Gulf of Mexico maritime lanes.',
    stats: {
      population: '592 million',
      area: '24.71 million km²',
      info: '23 sovereign states • FAA radar & Gulf energy corridor'
    }
  },
  "south america": {
    id: 'continent-south-america',
    name: 'South America',
    category: 'CONTINENT',
    lat: -8.7832,
    lon: -55.4915,
    zoom: 3,
    radiusKm: 3800,
    bounds: [[-56.0, -82.0], [13.0, -34.0]],
    color: '#10b981',
    flagOrIcon: '🌎',
    description: 'South American landmass spanning the Amazon basin, Andes mountain chain, and strategic maritime approaches to the Panama Canal and Cape Horn.',
    stats: {
      population: '430 million',
      area: '17.84 million km²',
      info: '12 countries • Atlantic & Pacific oceanic littorals'
    }
  },
  australia_continent: {
    id: 'continent-oceania',
    name: 'Australia & Oceania',
    category: 'CONTINENT',
    lat: -25.2744,
    lon: 133.7751,
    zoom: 4,
    radiusKm: 2600,
    bounds: [[-44.0, 112.0], [-10.0, 154.0]],
    color: '#8b5cf6',
    flagOrIcon: '🌏',
    description: 'Oceania and the Australian continent, encompassing the Tasman Sea, Great Barrier Reef, and Southern Ocean trade routes.',
    stats: {
      population: '45 million',
      area: '8.52 million km²',
      info: '14 nations • Southern Pacific & Indian Ocean expanse'
    }
  },
  antarctica: {
    id: 'continent-antarctica',
    name: 'Antarctica',
    category: 'CONTINENT',
    lat: -82.8628,
    lon: 135.0000,
    zoom: 2,
    radiusKm: 3200,
    bounds: [[-90.0, -180.0], [-60.0, 180.0]],
    color: '#93c5fd',
    flagOrIcon: '❄️',
    description: 'Southern polar continent covered by permanent ice sheets, regulated by the international Antarctic Treaty for scientific research.',
    stats: {
      population: '1,000 to 5,000 (seasonal)',
      area: '14.2 million km²',
      info: 'Zero permanent residents • Scientific observation zone'
    }
  },

  // --------------------------------------------------------------------------
  // 2. COUNTRIES
  // --------------------------------------------------------------------------
  "united states": {
    id: 'country-usa',
    name: 'United States of America',
    category: 'COUNTRY',
    lat: 38.8951,
    lon: -97.0364,
    zoom: 4,
    radiusKm: 2500,
    bounds: [[24.5, -125.0], [49.5, -66.9]],
    color: '#06b6d4',
    flagOrIcon: '🇺🇸',
    continent: 'North America',
    description: '50 states and federal district with the world\'s most heavily monitored commercial airspace, highway networks, and coastal shipping ports.',
    stats: { population: '333 million', area: '9.83M km²', info: 'FAA Airspace • DOT Highway Feeds' }
  },
  usa: {
    id: 'country-usa',
    name: 'United States of America',
    category: 'COUNTRY',
    lat: 38.8951,
    lon: -97.0364,
    zoom: 4,
    radiusKm: 2500,
    bounds: [[24.5, -125.0], [49.5, -66.9]],
    color: '#06b6d4',
    flagOrIcon: '🇺🇸',
    continent: 'North America',
    description: '50 states and federal district with the world\'s most heavily monitored commercial airspace, highway networks, and coastal shipping ports.'
  },
  japan: {
    id: 'country-japan',
    name: 'Japan',
    category: 'COUNTRY',
    lat: 36.2048,
    lon: 138.2529,
    zoom: 5,
    radiusKm: 900,
    bounds: [[30.0, 128.0], [45.5, 146.0]],
    color: '#f43f5e',
    flagOrIcon: '🇯🇵',
    continent: 'Asia',
    description: 'East Asian island nation situated along the Pacific Ring of Fire, with high-speed Shinkansen rail networks and Tokyo mega-metro.',
    stats: { population: '125 million', area: '377,975 km²', info: 'Tokyo-Yokohama Bay • Shinkansen Rail' }
  },
  "united kingdom": {
    id: 'country-uk',
    name: 'United Kingdom',
    category: 'COUNTRY',
    lat: 54.5000,
    lon: -2.5000,
    zoom: 6,
    radiusKm: 550,
    bounds: [[49.8, -8.6], [59.0, 1.8]],
    color: '#3b82f6',
    flagOrIcon: '🇬🇧',
    continent: 'Europe',
    description: 'Comprising England, Scotland, Wales, and Northern Ireland. Primary European air traffic hub and English Channel maritime corridor.',
    stats: { population: '67 million', area: '243,610 km²', info: 'London TfL • English Channel • Heathrow Corridor' }
  },
  uk: {
    id: 'country-uk',
    name: 'United Kingdom',
    category: 'COUNTRY',
    lat: 54.5000,
    lon: -2.5000,
    zoom: 6,
    radiusKm: 550,
    bounds: [[49.8, -8.6], [59.0, 1.8]],
    color: '#3b82f6',
    flagOrIcon: '🇬🇧',
    continent: 'Europe',
    description: 'Comprising England, Scotland, Wales, and Northern Ireland.'
  },
  france: {
    id: 'country-france',
    name: 'France',
    category: 'COUNTRY',
    lat: 46.2276,
    lon: 2.2137,
    zoom: 6,
    radiusKm: 520,
    bounds: [[42.3, -4.8], [51.1, 8.2]],
    color: '#3b82f6',
    flagOrIcon: '🇫🇷',
    continent: 'Europe',
    description: 'Western European nation with extensive TGV high-speed rail lines, Atlantic and Mediterranean coastlines, and Paris hub.',
    stats: { population: '68 million', area: '643,801 km²', info: 'SNCF TGV Rail • Paris-CDG Hub • Mediterranean Coast' }
  },
  germany: {
    id: 'country-germany',
    name: 'Germany',
    category: 'COUNTRY',
    lat: 51.1657,
    lon: 10.4515,
    zoom: 6,
    radiusKm: 420,
    bounds: [[47.3, 5.9], [55.0, 15.0]],
    color: '#eab308',
    flagOrIcon: '🇩🇪',
    continent: 'Europe',
    description: 'Central European industrial anchor featuring high-speed Autobahn networks, Frankfurt European air traffic hub, and Rhine river transport.',
    stats: { population: '84 million', area: '357,022 km²', info: 'Frankfurt Hub • Autobahn Network • North Sea Ports' }
  },
  italy: {
    id: 'country-italy',
    name: 'Italy',
    category: 'COUNTRY',
    lat: 41.8719,
    lon: 12.5674,
    zoom: 6,
    radiusKm: 550,
    bounds: [[36.6, 6.6], [47.1, 18.5]],
    color: '#10b981',
    flagOrIcon: '🇮🇹',
    continent: 'Europe',
    description: 'Mediterranean peninsula surrounded by the Tyrrhenian, Adriatic, and Ionian seas, controlling vital southern European maritime gateways.',
    stats: { population: '59 million', area: '301,340 km²', info: 'Mediterranean Gateway • Frecciarossa Rail' }
  },
  spain: {
    id: 'country-spain',
    name: 'Spain',
    category: 'COUNTRY',
    lat: 40.4637,
    lon: -3.7492,
    zoom: 6,
    radiusKm: 550,
    bounds: [[36.0, -9.3], [43.8, 3.3]],
    color: '#f59e0b',
    flagOrIcon: '🇪🇸',
    continent: 'Europe',
    description: 'Iberian Peninsula nation commanding the northern entrance to the Strait of Gibraltar and Mediterranean-Atlantic trade routes.',
    stats: { population: '47 million', area: '505,990 km²', info: 'Strait of Gibraltar • AVE High-Speed Rail' }
  },
  canada: {
    id: 'country-canada',
    name: 'Canada',
    category: 'COUNTRY',
    lat: 56.1304,
    lon: -106.3468,
    zoom: 4,
    radiusKm: 2800,
    bounds: [[41.7, -141.0], [70.0, -52.6]],
    color: '#ef4444',
    flagOrIcon: '🇨🇦',
    continent: 'North America',
    description: 'World\'s second-largest country by land area, with extensive transcontinental rail corridors, Arctic sea passages, and DriveBC road sensors.',
    stats: { population: '40 million', area: '9.98M km²', info: 'St. Lawrence Seaway • Trans-Canada Highway' }
  },
  mexico: {
    id: 'country-mexico',
    name: 'Mexico',
    category: 'COUNTRY',
    lat: 23.6345,
    lon: -102.5528,
    zoom: 5,
    radiusKm: 1200,
    bounds: [[14.5, -118.4], [32.7, -86.7]],
    color: '#10b981',
    flagOrIcon: '🇲🇽',
    continent: 'North America',
    description: 'Bridging North and Central America with extensive Pacific and Gulf of Mexico coastlines and major industrial logistics hubs.',
    stats: { population: '128 million', area: '1.96M km²', info: 'Gulf of Mexico • Pacific Coast • Mexico City Metro' }
  },
  china: {
    id: 'country-china',
    name: 'China',
    category: 'COUNTRY',
    lat: 35.8617,
    lon: 104.1954,
    zoom: 4,
    radiusKm: 2600,
    bounds: [[18.2, 73.5], [53.5, 134.8]],
    color: '#ef4444',
    flagOrIcon: '🇨🇳',
    continent: 'Asia',
    description: 'East Asian economic powerhouse with the world\'s largest high-speed rail network and busiest container ports (Shanghai, Ningbo, Shenzhen).',
    stats: { population: '1.41 billion', area: '9.59M km²', info: 'Port of Shanghai • 45,000 km HSR Network' }
  },
  india: {
    id: 'country-india',
    name: 'India',
    category: 'COUNTRY',
    lat: 20.5937,
    lon: 78.9629,
    zoom: 5,
    radiusKm: 1500,
    bounds: [[8.1, 68.1], [35.5, 97.4]],
    color: '#f97316',
    flagOrIcon: '🇮🇳',
    continent: 'Asia',
    description: 'South Asian peninsula bordering the Arabian Sea and Bay of Bengal with the world\'s most populous nation and extensive railway matrix.',
    stats: { population: '1.43 billion', area: '3.29M km²', info: 'Indian Railways • Mumbai-Delhi Industrial Corridor' }
  },
  australia: {
    id: 'country-australia',
    name: 'Australia',
    category: 'COUNTRY',
    lat: -25.2744,
    lon: 133.7751,
    zoom: 4,
    radiusKm: 2000,
    bounds: [[-43.6, 113.3], [-10.7, 153.6]],
    color: '#8b5cf6',
    flagOrIcon: '🇦🇺',
    continent: 'Australia & Oceania',
    description: 'Continent-country surrounded by the Indian and Pacific oceans, leading global bulk exporter of iron ore, LNG, and minerals.',
    stats: { population: '26 million', area: '7.69M km²', info: 'Pacific & Indian maritime perimeter • Port Hedland' }
  },
  brazil: {
    id: 'country-brazil',
    name: 'Brazil',
    category: 'COUNTRY',
    lat: -14.2350,
    lon: -51.9253,
    zoom: 4,
    radiusKm: 2200,
    bounds: [[-33.7, -73.9], [5.3, -34.8]],
    color: '#10b981',
    flagOrIcon: '🇧🇷',
    continent: 'South America',
    description: 'Largest country in South America, home to the Amazon river system, Atlantic deepwater ports, and São Paulo financial capital.',
    stats: { population: '215 million', area: '8.51M km²', info: 'Amazon Basin • Port of Santos • São Paulo Metro' }
  },
  egypt: {
    id: 'country-egypt',
    name: 'Egypt',
    category: 'COUNTRY',
    lat: 26.8206,
    lon: 30.8025,
    zoom: 6,
    radiusKm: 650,
    bounds: [[22.0, 24.7], [31.7, 36.9]],
    color: '#eab308',
    flagOrIcon: '🇪🇬',
    continent: 'Africa',
    description: 'Strategic Afro-Asian transcontinental nation controlling the Suez Canal maritime bottleneck between the Mediterranean and Red Sea.',
    stats: { population: '109 million', area: '1.01M km²', info: 'Suez Canal Authority • Nile River Basin' }
  },
  "south africa": {
    id: 'country-south-africa',
    name: 'South Africa',
    category: 'COUNTRY',
    lat: -30.5595,
    lon: 22.9375,
    zoom: 6,
    radiusKm: 750,
    bounds: [[-34.8, 16.4], [-22.1, 32.9]],
    color: '#10b981',
    flagOrIcon: '🇿🇦',
    continent: 'Africa',
    description: 'Southernmost African nation commanding the historic Cape of Good Hope trade route between the South Atlantic and Indian Ocean.',
    stats: { population: '60 million', area: '1.22M km²', info: 'Cape of Good Hope • Durban Port' }
  },
  "south korea": {
    id: 'country-south-korea',
    name: 'South Korea',
    category: 'COUNTRY',
    lat: 35.9078,
    lon: 127.7669,
    zoom: 7,
    radiusKm: 280,
    bounds: [[34.0, 125.0], [38.5, 130.0]],
    color: '#06b6d4',
    flagOrIcon: '🇰🇷',
    continent: 'Asia',
    description: 'High-technology East Asian nation on the southern Korean Peninsula, featuring the Port of Busan and Seoul metropolitan transport matrix.',
    stats: { population: '52 million', area: '100,432 km²', info: 'Port of Busan • Incheon Hub • KTX Bullet Train' }
  },
  korea: {
    id: 'country-south-korea',
    name: 'South Korea',
    category: 'COUNTRY',
    lat: 35.9078,
    lon: 127.7669,
    zoom: 7,
    radiusKm: 280,
    bounds: [[34.0, 125.0], [38.5, 130.0]],
    color: '#06b6d4',
    flagOrIcon: '🇰🇷',
    continent: 'Asia',
    description: 'High-technology East Asian nation on the southern Korean Peninsula.'
  },
  russia: {
    id: 'country-russia',
    name: 'Russia',
    category: 'COUNTRY',
    lat: 61.5240,
    lon: 105.3188,
    zoom: 3,
    radiusKm: 3500,
    bounds: [[41.2, 19.6], [81.8, 180.0]],
    color: '#ef4444',
    flagOrIcon: '🇷🇺',
    continent: 'Europe / Asia',
    description: 'World\'s largest nation by geographical area spanning eleven time zones across Eastern Europe and Northern Asia to the Pacific.',
    stats: { population: '144 million', area: '17.1M km²', info: 'Trans-Siberian Railway • Northern Sea Route' }
  },
  ukraine: {
    id: 'country-ukraine',
    name: 'Ukraine',
    category: 'COUNTRY',
    lat: 48.3794,
    lon: 31.1656,
    zoom: 6,
    radiusKm: 600,
    bounds: [[44.4, 22.1], [52.4, 40.2]],
    color: '#38bdf8',
    flagOrIcon: '🇺🇦',
    continent: 'Europe',
    description: 'Eastern European nation bordering the Black Sea, Sea of Azov, and vital grain transit corridors.',
    stats: { population: '38 million', area: '603,628 km²', info: 'Black Sea Grain Corridor • Dnipro River' }
  },
  netherlands: {
    id: 'country-netherlands',
    name: 'Netherlands',
    category: 'COUNTRY',
    lat: 52.1326,
    lon: 5.2913,
    zoom: 7,
    radiusKm: 180,
    bounds: [[50.7, 3.3], [53.6, 7.2]],
    color: '#f97316',
    flagOrIcon: '🇳🇱',
    continent: 'Europe',
    description: 'Lowland European gateway featuring the Port of Rotterdam—Europe\'s largest seaport—and Amsterdam Schiphol air hub.',
    stats: { population: '18 million', area: '41,543 km²', info: 'Port of Rotterdam • Schiphol Hub' }
  },
  switzerland: {
    id: 'country-switzerland',
    name: 'Switzerland',
    category: 'COUNTRY',
    lat: 46.8182,
    lon: 8.2275,
    zoom: 8,
    radiusKm: 180,
    bounds: [[45.8, 5.9], [47.8, 10.5]],
    color: '#ef4444',
    flagOrIcon: '🇨🇭',
    continent: 'Europe',
    description: 'Alpine nation at the crossroads of Central Europe, home to the Gotthard Base Tunnel—the world\'s longest railway tunnel.',
    stats: { population: '8.8 million', area: '41,285 km²', info: 'Gotthard Base Tunnel • SBB Alpine Network' }
  },
  finland: {
    id: 'country-finland',
    name: 'Finland',
    category: 'COUNTRY',
    lat: 61.9241,
    lon: 25.7482,
    zoom: 6,
    radiusKm: 550,
    bounds: [[59.8, 20.5], [70.1, 31.6]],
    color: '#06b6d4',
    flagOrIcon: '🇫🇮',
    continent: 'Europe',
    description: 'Nordic nation with extensive Baltic maritime links, DigiTraffic real-time rail/vessel feeds, and Arctic wilderness.',
    stats: { population: '5.6 million', area: '338,424 km²', info: 'Fintraffic Rail & Maritime Feeds • Helsinki Port' }
  },
  norway: {
    id: 'country-norway',
    name: 'Norway',
    category: 'COUNTRY',
    lat: 60.4720,
    lon: 8.4689,
    zoom: 5,
    radiusKm: 750,
    bounds: [[57.9, 4.5], [71.2, 31.1]],
    color: '#3b82f6',
    flagOrIcon: '🇳🇴',
    continent: 'Europe',
    description: 'Scandinavian coastal nation with deep fjords, extensive North Sea oil/gas platforms, and Arctic shipping lanes.',
    stats: { population: '5.5 million', area: '385,207 km²', info: 'North Sea Energy Fields • Norwegian Coastal Highway' }
  },
  sweden: {
    id: 'country-sweden',
    name: 'Sweden',
    category: 'COUNTRY',
    lat: 60.1282,
    lon: 18.6435,
    zoom: 5,
    radiusKm: 700,
    bounds: [[55.3, 11.0], [69.1, 24.2]],
    color: '#38bdf8',
    flagOrIcon: '🇸🇪',
    continent: 'Europe',
    description: 'Nordic power between the Gulf of Bothnia and the North Sea with high-density Stockholm maritime and rail transport.'
  },
  turkey: {
    id: 'country-turkey',
    name: 'Turkey',
    category: 'COUNTRY',
    lat: 38.9637,
    lon: 35.2433,
    zoom: 6,
    radiusKm: 800,
    bounds: [[35.8, 25.7], [42.1, 44.8]],
    color: '#ef4444',
    flagOrIcon: '🇹🇷',
    continent: 'Europe / Asia',
    description: 'Transcontinental bridge commanding the Turkish Straits (Bosphorus and Dardanelles) between the Black Sea and the Mediterranean.',
    stats: { population: '85 million', area: '783,562 km²', info: 'Turkish Straits • Istanbul Airport Global Hub' }
  },
  "saudi arabia": {
    id: 'country-saudi-arabia',
    name: 'Saudi Arabia',
    category: 'COUNTRY',
    lat: 23.8859,
    lon: 45.0792,
    zoom: 5,
    radiusKm: 950,
    bounds: [[16.4, 34.5], [32.2, 55.7]],
    color: '#10b981',
    flagOrIcon: '🇸🇦',
    continent: 'Asia',
    description: 'Arabian Peninsula heartland bordering both the Persian Gulf and the Red Sea, leading global energy exporter.'
  },
  uae: {
    id: 'country-uae',
    name: 'United Arab Emirates',
    category: 'COUNTRY',
    lat: 23.4241,
    lon: 53.8478,
    zoom: 7,
    radiusKm: 250,
    bounds: [[22.6, 51.5], [26.1, 56.4]],
    color: '#10b981',
    flagOrIcon: '🇦🇪',
    continent: 'Asia',
    description: 'Persian Gulf federation featuring Dubai International Airport (world\'s busiest international hub) and Jebel Ali Port.'
  },

  // --------------------------------------------------------------------------
  // 3. CITIES & METROPOLITAN REGIONS
  // --------------------------------------------------------------------------
  tokyo: {
    id: 'city-tokyo',
    name: 'Tokyo',
    category: 'CITY',
    lat: 35.6762,
    lon: 139.6503,
    zoom: 12,
    radiusKm: 32,
    color: '#f43f5e',
    flagOrIcon: '🏙️',
    country: 'Japan',
    description: 'Greater Tokyo Area, world\'s most populous metropolitan agglomeration (~37M people), Tokyo Haneda & Narita aviation hubs, and Tokyo Bay.',
    stats: { population: '37 million (Metro)', area: '2,194 km²', info: 'JR East Matrix • Haneda/Narita • Tokyo Bay' }
  },
  "new york": {
    id: 'city-nyc',
    name: 'New York City',
    category: 'CITY',
    lat: 40.7128,
    lon: -74.0060,
    zoom: 12,
    radiusKm: 28,
    color: '#06b6d4',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Global financial capital featuring the MTA 24/7 subway system, JFK/LaGuardia/Newark airspace, and Hudson/East River maritime traffic.',
    stats: { population: '8.5 million (City), 20M (Metro)', area: '783.8 km²', info: 'MTA Transit • 511NY Feeds • Citi Bike' }
  },
  nyc: {
    id: 'city-nyc',
    name: 'New York City',
    category: 'CITY',
    lat: 40.7128,
    lon: -74.0060,
    zoom: 12,
    radiusKm: 28,
    color: '#06b6d4',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Global financial capital featuring the MTA subway system and busy NY harbor.'
  },
  london: {
    id: 'city-london',
    name: 'London',
    category: 'CITY',
    lat: 51.5074,
    lon: -0.1278,
    zoom: 12,
    radiusKm: 26,
    color: '#3b82f6',
    flagOrIcon: '🏙️',
    country: 'United Kingdom',
    description: 'Capital of the UK featuring Transport for London (TfL) JamCams surveillance, London Underground, River Thames ferries, and Heathrow/Gatwick.',
    stats: { population: '9 million (City), 14M (Metro)', area: '1,572 km²', info: 'TfL JamCams • Heathrow Airport • London Tube' }
  },
  paris: {
    id: 'city-paris',
    name: 'Paris',
    category: 'CITY',
    lat: 48.8566,
    lon: 2.3522,
    zoom: 12,
    radiusKm: 22,
    color: '#8b5cf6',
    flagOrIcon: '🏙️',
    country: 'France',
    description: 'French capital featuring RATP Metro/RER transit, Charles de Gaulle (CDG) European mega-hub, and Seine river corridors.',
    stats: { population: '2.1 million (City), 12M (Metro)', area: '105.4 km²', info: 'RATP Metro • CDG Airport • Seine River' }
  },
  chicago: {
    id: 'city-chicago',
    name: 'Chicago',
    category: 'CITY',
    lat: 41.8781,
    lon: -87.6298,
    zoom: 12,
    radiusKm: 28,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Third-largest US city, premier North American railroad interchange, O\'Hare International Airport, Divvy bikeshare, and IDOT road cameras.',
    stats: { population: '2.7 million (City), 9.6M (Metro)', area: '607 km²', info: 'O\'Hare ORD Hub • Divvy Bikes • IDOT CCTV' }
  },
  denver: {
    id: 'city-denver',
    name: 'Denver, Colorado',
    category: 'CITY',
    lat: 39.7392,
    lon: -104.9903,
    zoom: 12,
    radiusKm: 32,
    color: '#38bdf8',
    flagOrIcon: '🏔️',
    country: 'United States',
    description: 'The Mile High City, capital of Colorado and Rocky Mountain aviation and transit nexus. Major hub for Denver International Airport (DEN), RTD Denver rail and bus transit, and COTrip highway camera networks.',
    stats: { population: '715,000 (City), 3.0M (Metro)', area: '401 km²', info: 'Denver International (DEN) • RTD Transit • COTrip CCTV' }
  },
  "denver international airport": {
    id: 'bldg-denver-airport',
    name: 'Denver International Airport (DEN)',
    category: 'BUILDING',
    lat: 39.8561,
    lon: -104.6737,
    zoom: 13,
    radiusKm: 14,
    color: '#38bdf8',
    flagOrIcon: '✈️',
    country: 'United States',
    description: 'Largest airport in North America by land area (135.7 km²) and third-busiest in the world. Features iconic Jeppesen Terminal white fabric tensile peaks, six non-intersecting runways, and major United and Southwest hubs.',
    stats: { population: '77.8M passengers/yr', area: '135.7 km²', info: 'ICAO: KDEN • IATA: DEN • 6 Runways • Jeppesen Terminal' }
  },
  galveston: {
    id: 'city-galveston',
    name: 'Galveston, Texas',
    category: 'CITY',
    lat: 29.3013,
    lon: -94.7977,
    zoom: 13,
    radiusKm: 15,
    color: '#06b6d4',
    flagOrIcon: '🏖️',
    country: 'United States',
    description: 'Historic barrier island city along the Texas Gulf Coast. Home to Babe\'s Beach, The Strand Historic District, Port of Galveston cruise terminal, and Houston Ship Channel entrance.',
    stats: { population: '53,000', area: '542 km²', info: 'Babe\'s Beach Webcam • The Strand Webcam • Gulf Port' }
  },
  houston: {
    id: 'city-houston',
    name: 'Houston, Texas',
    category: 'CITY',
    lat: 29.7604,
    lon: -95.3698,
    zoom: 11,
    radiusKm: 35,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Fourth-largest US city, global energy capital, home to Houston TranStar traffic camera matrix, George Bush Intercontinental (IAH), and Houston Ship Channel.',
    stats: { population: '2.3 million (City), 7.3M (Metro)', area: '1,739 km²', info: 'Houston TranStar CCTV • IAH Airport • Ship Channel' }
  },
  dallas: {
    id: 'city-dallas',
    name: 'Dallas, Texas',
    category: 'CITY',
    lat: 32.7767,
    lon: -96.7970,
    zoom: 11,
    radiusKm: 32,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Major Texas metropolitan hub, Dallas/Fort Worth (DFW) international airport, DART transit, and North Texas highway matrix.',
    stats: { population: '1.3 million (City), 7.6M (Metro)', area: '999 km²', info: 'DFW Airport • DART Transit • TxDOT Feeds' }
  },
  "fort worth": {
    id: 'city-fort-worth',
    name: 'Fort Worth, Texas',
    category: 'CITY',
    lat: 32.7555,
    lon: -97.3308,
    zoom: 11,
    radiusKm: 25,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Major Texas city, part of the Dallas-Fort Worth metroplex, known for its rich western heritage, Stockyards, and cultural district.',
    stats: { population: '950,000', area: '900 km²', info: 'Stockyards • Cultural District • Trinity River' }
  },
  austin: {
    id: 'city-austin',
    name: 'Austin, Texas',
    category: 'CITY',
    lat: 30.2672,
    lon: -97.7431,
    zoom: 12,
    radiusKm: 22,
    color: '#10b981',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Texas state capital, Silicon Hills tech corridor, CapMetro public transit vehicles, and Austin-Bergstrom (AUS) airport.',
    stats: { population: '975,000 (City), 2.4M (Metro)', area: '845 km²', info: 'CapMetro GTFS-RT • Austin B-cycle • Texas DOT' }
  },
  "los angeles": {
    id: 'city-la',
    name: 'Los Angeles',
    category: 'CITY',
    lat: 34.0522,
    lon: -118.2437,
    zoom: 11,
    radiusKm: 35,
    color: '#f59e0b',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Second-largest US metropolis, LAX international mega-hub, Caltrans District 7 highway sensor grid, and Port of Los Angeles (America\'s Port).',
    stats: { population: '3.8 million (City), 13M (Metro)', area: '1,302 km²', info: 'Port of LA • LAX Airport • Caltrans D7' }
  },
  la: {
    id: 'city-la',
    name: 'Los Angeles',
    category: 'CITY',
    lat: 34.0522,
    lon: -118.2437,
    zoom: 11,
    radiusKm: 35,
    color: '#f59e0b',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Second-largest US metropolis, LAX international mega-hub and Port of LA.'
  },
  "san francisco": {
    id: 'city-sf',
    name: 'San Francisco',
    category: 'CITY',
    lat: 37.7749,
    lon: -122.4194,
    zoom: 12,
    radiusKm: 24,
    color: '#10b981',
    flagOrIcon: '🌉',
    country: 'United States',
    description: 'San Francisco Bay Area, Golden Gate bridge strait, Bay Wheels micromobility stations, Caltrans D4 traffic surveillance, and SFO airport.',
    stats: { population: '810,000 (City), 4.7M (Metro)', area: '121 km²', info: 'Golden Gate Strait • Bay Wheels • Caltrans D4' }
  },
  sf: {
    id: 'city-sf',
    name: 'San Francisco',
    category: 'CITY',
    lat: 37.7749,
    lon: -122.4194,
    zoom: 12,
    radiusKm: 24,
    color: '#10b981',
    flagOrIcon: '🌉',
    country: 'United States',
    description: 'San Francisco Bay Area, Golden Gate strait and Bay Wheels.'
  },
  seattle: {
    id: 'city-seattle',
    name: 'Seattle, Washington',
    category: 'CITY',
    lat: 47.6062,
    lon: -122.3321,
    zoom: 12,
    radiusKm: 22,
    color: '#10b981',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Pacific Northwest hub bordering Puget Sound, Sea-Tac (SEA) international airport, and Washington State Ferries network.',
    stats: { population: '750,000 (City), 4M (Metro)', area: '369 km²', info: 'Puget Sound Maritime • Sea-Tac Hub' }
  },
  miami: {
    id: 'city-miami',
    name: 'Miami, Florida',
    category: 'CITY',
    lat: 25.7617,
    lon: -80.1918,
    zoom: 12,
    radiusKm: 22,
    color: '#06b6d4',
    flagOrIcon: '🌴',
    country: 'United States',
    description: 'Gateway to Latin America and the Caribbean, PortMiami (Cruise Capital of the World), and Biscayne Bay maritime corridor.',
    stats: { population: '450,000 (City), 6.2M (Metro)', area: '143 km²', info: 'PortMiami • Biscayne Bay • MIA Airport' }
  },
  dubai: {
    id: 'city-dubai',
    name: 'Dubai',
    category: 'CITY',
    lat: 25.2048,
    lon: 55.2708,
    zoom: 12,
    radiusKm: 25,
    color: '#eab308',
    flagOrIcon: '🏙️',
    country: 'United Arab Emirates',
    description: 'Premier Middle Eastern aviation and maritime trade nexus, DXB airport, Jebel Ali deep-water port, and Persian Gulf approach.',
    stats: { population: '3.6 million', area: '4,114 km²', info: 'DXB Aviation Hub • Jebel Ali Port • Burj Khalifa' }
  },
  singapore: {
    id: 'city-singapore',
    name: 'Singapore',
    category: 'CITY',
    lat: 1.3521,
    lon: 103.8198,
    zoom: 12,
    radiusKm: 22,
    color: '#ef4444',
    flagOrIcon: '🏙️',
    country: 'Singapore',
    description: 'Global maritime transshipment hub commanding the Singapore and Malacca Straits, Changi Airport (SIN), and Port of Singapore.',
    stats: { population: '5.9 million', area: '734 km²', info: 'Singapore Strait • Changi Airport • PSA Seaport' }
  },
  sydney: {
    id: 'city-sydney',
    name: 'Sydney',
    category: 'CITY',
    lat: -33.8688,
    lon: 151.2093,
    zoom: 12,
    radiusKm: 25,
    color: '#8b5cf6',
    flagOrIcon: '🏙️',
    country: 'Australia',
    description: 'Largest city in Australia situated around Sydney Harbour, Port Jackson, Sydney Kingsford Smith Airport (SYD), and Tasman Sea coastline.',
    stats: { population: '5.3 million', area: '12,368 km²', info: 'Sydney Harbour • Port Jackson • Kingsford Smith' }
  },
  berlin: {
    id: 'city-berlin',
    name: 'Berlin',
    category: 'CITY',
    lat: 52.5200,
    lon: 13.4050,
    zoom: 12,
    radiusKm: 22,
    color: '#eab308',
    flagOrIcon: '🏙️',
    country: 'Germany',
    description: 'Capital of Germany featuring the BVG U-Bahn and S-Bahn transport networks, Spree river, and Berlin Brandenburg (BER) airport.'
  },
  rome: {
    id: 'city-rome',
    name: 'Rome',
    category: 'CITY',
    lat: 41.9028,
    lon: 12.4964,
    zoom: 12,
    radiusKm: 22,
    color: '#10b981',
    flagOrIcon: '🏛️',
    country: 'Italy',
    description: 'Historic Italian capital on the Tiber River, Rome Fiumicino (FCO) airport, and central Italian rail junction.'
  },
  cairo: {
    id: 'city-cairo',
    name: 'Cairo',
    category: 'CITY',
    lat: 30.0444,
    lon: 31.2357,
    zoom: 12,
    radiusKm: 25,
    color: '#eab308',
    flagOrIcon: '🏙️',
    country: 'Egypt',
    description: 'Largest metropolitan area in the Arab world, Nile River delta, Cairo International Airport (CAI), and proximity to the Suez Canal.'
  },

  // --------------------------------------------------------------------------
  // 4. OCEANS, SEAS & WATERWAYS ("and other stuff")
  // --------------------------------------------------------------------------
  "pacific ocean": {
    id: 'ocean-pacific',
    name: 'Pacific Ocean',
    category: 'OCEAN',
    lat: 0.0000,
    lon: -160.0000,
    zoom: 3,
    radiusKm: 7500,
    bounds: [[-50.0, 130.0], [50.0, -80.0]],
    color: '#0284c7',
    flagOrIcon: '🌊',
    description: 'Earth\'s largest oceanic division spanning from the Americas to Asia and Australia, covering over 30% of the planetary surface.',
    stats: { area: '165.25 million km²', info: 'Trans-Pacific Trade Lanes • Ring of Fire' }
  },
  pacific: {
    id: 'ocean-pacific',
    name: 'Pacific Ocean',
    category: 'OCEAN',
    lat: 0.0000,
    lon: -160.0000,
    zoom: 3,
    radiusKm: 7500,
    bounds: [[-50.0, 130.0], [50.0, -80.0]],
    color: '#0284c7',
    flagOrIcon: '🌊',
    description: 'Earth\'s largest oceanic division.'
  },
  "atlantic ocean": {
    id: 'ocean-atlantic',
    name: 'Atlantic Ocean',
    category: 'OCEAN',
    lat: 15.0000,
    lon: -35.0000,
    zoom: 3,
    radiusKm: 5500,
    bounds: [[-50.0, -70.0], [60.0, -10.0]],
    color: '#0ea5e9',
    flagOrIcon: '🌊',
    description: 'Second-largest oceanic division separating North and South America from Europe and Africa, with the North Atlantic flight tracks.',
    stats: { area: '106.46 million km²', info: 'North Atlantic Flight Corridors • Transatlantic Shipping' }
  },
  atlantic: {
    id: 'ocean-atlantic',
    name: 'Atlantic Ocean',
    category: 'OCEAN',
    lat: 15.0000,
    lon: -35.0000,
    zoom: 3,
    radiusKm: 5500,
    bounds: [[-50.0, -70.0], [60.0, -10.0]],
    color: '#0ea5e9',
    flagOrIcon: '🌊',
    description: 'Second-largest oceanic division.'
  },
  "indian ocean": {
    id: 'ocean-indian',
    name: 'Indian Ocean',
    category: 'OCEAN',
    lat: -20.0000,
    lon: 80.0000,
    zoom: 3,
    radiusKm: 4500,
    bounds: [[-45.0, 40.0], [20.0, 115.0]],
    color: '#06b6d4',
    flagOrIcon: '🌊',
    description: 'Third-largest oceanic basin connecting the Middle East, Africa, and East Asia, vital for global crude petroleum shipments.',
    stats: { area: '70.56 million km²', info: 'Persian Gulf Oil Routes • Malacca Feeder' }
  },
  "arctic ocean": {
    id: 'ocean-arctic',
    name: 'Arctic Ocean',
    category: 'OCEAN',
    lat: 85.0000,
    lon: 0.0000,
    zoom: 3,
    radiusKm: 2200,
    color: '#93c5fd',
    flagOrIcon: '❄️',
    description: 'Smallest and shallowest of the world\'s oceans, covering the North Pole, Northern Sea Route, and polar flight routes.'
  },
  "mediterranean sea": {
    id: 'waterway-mediterranean',
    name: 'Mediterranean Sea',
    category: 'WATERWAY',
    lat: 35.0000,
    lon: 18.0000,
    zoom: 5,
    radiusKm: 1400,
    bounds: [[30.0, -5.5], [45.0, 36.0]],
    color: '#0284c7',
    flagOrIcon: '⚓',
    description: 'Historic sea connected to the Atlantic Ocean via the Strait of Gibraltar and to the Red Sea via the Suez Canal.',
    stats: { area: '2.5 million km²', info: 'Gibraltar-to-Suez Axis • 21 littoral states' }
  },
  mediterranean: {
    id: 'waterway-mediterranean',
    name: 'Mediterranean Sea',
    category: 'WATERWAY',
    lat: 35.0000,
    lon: 18.0000,
    zoom: 5,
    radiusKm: 1400,
    bounds: [[30.0, -5.5], [45.0, 36.0]],
    color: '#0284c7',
    flagOrIcon: '⚓',
    description: 'Historic sea connected to the Atlantic via Gibraltar and Red Sea via Suez.'
  },
  "gulf of mexico": {
    id: 'waterway-gulf-of-mexico',
    name: 'Gulf of Mexico',
    category: 'WATERWAY',
    lat: 25.0000,
    lon: -90.0000,
    zoom: 5,
    radiusKm: 850,
    bounds: [[18.0, -98.0], [30.5, -81.0]],
    color: '#0ea5e9',
    flagOrIcon: '⚓',
    description: 'Major ocean basin bounded by the United States, Mexico, and Cuba. Center of offshore oil platforms and maritime access to Galveston and Houston.',
    stats: { area: '1.6 million km²', info: 'Houston/Galveston Ships • Offshore Energy Platforms' }
  },
  "caribbean sea": {
    id: 'waterway-caribbean',
    name: 'Caribbean Sea',
    category: 'WATERWAY',
    lat: 15.0000,
    lon: -75.0000,
    zoom: 5,
    radiusKm: 1100,
    bounds: [[9.0, -88.0], [22.0, -60.0]],
    color: '#06b6d4',
    flagOrIcon: '⚓',
    description: 'Sub-oceanic sea of the Atlantic, critical gateway for vessels transiting the Panama Canal.'
  },
  "south china sea": {
    id: 'waterway-south-china-sea',
    name: 'South China Sea',
    category: 'WATERWAY',
    lat: 12.0000,
    lon: 113.0000,
    zoom: 5,
    radiusKm: 1200,
    bounds: [[3.0, 105.0], [22.0, 121.0]],
    color: '#38bdf8',
    flagOrIcon: '⚓',
    description: 'Vital international sea lane carrying over $3.4 trillion in global maritime commerce annually.'
  },
  "red sea": {
    id: 'waterway-red-sea',
    name: 'Red Sea',
    category: 'WATERWAY',
    lat: 20.0000,
    lon: 38.0000,
    zoom: 6,
    radiusKm: 700,
    bounds: [[12.5, 32.5], [28.0, 43.5]],
    color: '#ef4444',
    flagOrIcon: '⚓',
    description: 'Seawater inlet of the Indian Ocean, connecting through the Bab-el-Mandeb strait to the Gulf of Aden and through Suez to Europe.'
  },

  // --------------------------------------------------------------------------
  // 5. CHOKEPOINTS, CANALS & STRAITS
  // --------------------------------------------------------------------------
  "suez canal": {
    id: 'waterway-suez-canal',
    name: 'Suez Canal',
    category: 'WATERWAY',
    lat: 30.7051,
    lon: 32.3444,
    zoom: 11,
    radiusKm: 80,
    color: '#eab308',
    flagOrIcon: '🚢',
    description: 'Egypt; 193 km artificial waterway connecting the Mediterranean to the Red Sea, eliminating the need to circumnavigate Africa (~12% of global trade).',
    stats: { length: '193.3 km', transitTime: '11 to 16 hours', traffic: '~50 ships/day' }
  },
  "panama canal": {
    id: 'waterway-panama-canal',
    name: 'Panama Canal',
    category: 'WATERWAY',
    lat: 9.0800,
    lon: -79.6800,
    zoom: 11,
    radiusKm: 60,
    color: '#10b981',
    flagOrIcon: '🚢',
    description: 'Panama; 82 km artificial waterway connecting the Atlantic and Pacific oceans via the Miraflores and Gatun locks, bypassing Cape Horn.',
    stats: { length: '82 km', locks: 'Miraflores, Pedro Miguel, Gatun', traffic: '~14,000 ships/year' }
  },
  "strait of malacca": {
    id: 'waterway-strait-of-malacca',
    name: 'Strait of Malacca',
    category: 'WATERWAY',
    lat: 2.5000,
    lon: 101.5000,
    zoom: 8,
    radiusKm: 300,
    color: '#ef4444',
    flagOrIcon: '🚢',
    description: 'Narrow 890 km stretch between the Malay Peninsula and Indonesian island of Sumatra; world\'s busiest maritime chokepoint (~94,000 vessels/yr).',
    stats: { length: '890 km', width: '2.8 km at Phillips Channel', traffic: '~25% of global oil shipments' }
  },
  "strait of gibraltar": {
    id: 'waterway-strait-of-gibraltar',
    name: 'Strait of Gibraltar',
    category: 'WATERWAY',
    lat: 35.9641,
    lon: -5.6042,
    zoom: 10,
    radiusKm: 50,
    color: '#3b82f6',
    flagOrIcon: '🚢',
    description: 'Strategic strait connecting the Atlantic Ocean to the Mediterranean Sea, separating Spain from Morocco by only 13 km at its narrowest point.'
  },
  "strait of hormuz": {
    id: 'waterway-strait-of-hormuz',
    name: 'Strait of Hormuz',
    category: 'WATERWAY',
    lat: 26.5667,
    lon: 56.2500,
    zoom: 9,
    radiusKm: 90,
    color: '#f59e0b',
    flagOrIcon: '🚢',
    description: 'Critical maritime chokepoint between the Persian Gulf and Gulf of Oman, through which approximately 21% of global petroleum passes.'
  },
  "english channel": {
    id: 'waterway-english-channel',
    name: 'English Channel',
    category: 'WATERWAY',
    lat: 50.1500,
    lon: -0.5000,
    zoom: 8,
    radiusKm: 180,
    color: '#38bdf8',
    flagOrIcon: '🚢',
    description: 'Arm of the Atlantic Ocean separating Southern England from Northern France, featuring the Dover Strait and Channel Tunnel rail line.'
  },
  "taiwan strait": {
    id: 'waterway-taiwan-strait',
    name: 'Taiwan Strait',
    category: 'WATERWAY',
    lat: 24.5000,
    lon: 119.8000,
    zoom: 8,
    radiusKm: 180,
    color: '#f43f5e',
    flagOrIcon: '🚢',
    description: '180 km wide strait separating the island of Taiwan from continental Asia, connecting the South China Sea to the East China Sea.'
  },

  // --------------------------------------------------------------------------
  // 6. TACTICAL ZONES & PHENOMENA
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // 6. STATES & PROVINCES
  // --------------------------------------------------------------------------
  texas: {
    id: 'state-texas',
    name: 'Texas, USA',
    category: 'TACTICAL_ZONE',
    lat: 31.9686,
    lon: -99.9018,
    zoom: 6,
    radiusKm: 650,
    bounds: [[25.8, -106.6], [36.5, -93.5]],
    color: '#06b6d4',
    flagOrIcon: '⭐',
    country: 'United States',
    description: 'Second-largest US state, featuring the Houston TranStar CCTV network, Galveston Seawall webcams, Austin CapMetro transit, and major Gulf energy infrastructure.',
    stats: { population: '30.5 million', area: '695,662 km²', info: 'Houston TranStar • Galveston Cameras • CapMetro' }
  },
  california: {
    id: 'state-california',
    name: 'California, USA',
    category: 'TACTICAL_ZONE',
    lat: 36.7783,
    lon: -119.4179,
    zoom: 6,
    radiusKm: 700,
    bounds: [[32.5, -124.4], [42.0, -114.1]],
    color: '#f59e0b',
    flagOrIcon: '🐻',
    country: 'United States',
    description: 'Pacific coastal powerhouse home to Silicon Valley, Caltrans Districts 1-12 highway camera grid, Bay Wheels bikeshare, and NASA FIRMS fire monitoring.',
    stats: { population: '39 million', area: '423,970 km²', info: 'Caltrans D1-D12 CCTV • Bay Wheels SF • LAX Airspace' }
  },
  oregon: {
    id: 'state-oregon',
    name: 'Oregon, USA',
    category: 'TACTICAL_ZONE',
    lat: 43.8041,
    lon: -120.5542,
    zoom: 7,
    radiusKm: 450,
    bounds: [[42.0, -124.5], [46.3, -116.5]],
    color: '#10b981',
    flagOrIcon: '🌲',
    country: 'United States',
    description: 'Pacific Northwest state featuring 1,180+ live ODOT TripCheck highway cameras across Portland, Willamette Valley, Columbia River Gorge, and the Oregon Coast.',
    stats: { population: '4.2 million', area: '254,799 km²', info: '1,188 ODOT TripCheck Cams • I-5 & I-84 Corridors' }
  },
  wyoming: {
    id: 'state-wyoming',
    name: 'Wyoming, USA',
    category: 'TACTICAL_ZONE',
    lat: 43.0759,
    lon: -107.2902,
    zoom: 7,
    radiusKm: 420,
    bounds: [[41.0, -111.05], [45.0, -104.05]],
    color: '#eab308',
    flagOrIcon: '🦬',
    country: 'United States',
    description: 'Mountain West state featuring WYDOT WyoRoad multi-angle highway cameras, winter road surface cameras across I-80, I-25, and I-90 mountain passes, and Yellowstone.',
    stats: { population: '580,000', area: '253,335 km²', info: '227 WYDOT Stations • I-80 & I-25 Multi-Angle Cams' }
  },
  illinois: {
    id: 'state-illinois',
    name: 'Illinois, USA',
    category: 'TACTICAL_ZONE',
    lat: 40.6331,
    lon: -89.3985,
    zoom: 7,
    radiusKm: 320,
    bounds: [[36.9, -91.5], [42.5, -87.5]],
    color: '#38bdf8',
    flagOrIcon: '🌾',
    country: 'United States',
    description: 'Midwestern transport nexus featuring Chicago Divvy bikeshare, IDOT TravelMidwest traffic feeds, and Lake Michigan coastline.',
    stats: { population: '12.6 million', area: '149,997 km²', info: 'IDOT TravelMidwest • Divvy Bikes • Chicago Hub' }
  },
  florida: {
    id: 'state-florida',
    name: 'Florida, USA',
    category: 'TACTICAL_ZONE',
    lat: 27.6648,
    lon: -81.5158,
    zoom: 7,
    radiusKm: 450,
    bounds: [[24.5, -87.6], [31.0, -80.0]],
    color: '#06b6d4',
    flagOrIcon: '🌴',
    country: 'United States',
    description: 'Southeastern peninsula bounded by the Gulf of Mexico and Atlantic Ocean, home to PortMiami, Cape Canaveral spaceport, and Florida 511 feeds.',
    stats: { population: '22.6 million', area: '170,312 km²', info: 'PortMiami • Cape Canaveral • Florida 511' }
  },
  colorado: {
    id: 'state-colorado',
    name: 'Colorado, USA',
    category: 'TACTICAL_ZONE',
    lat: 39.5501,
    lon: -105.7821,
    zoom: 7,
    radiusKm: 280,
    bounds: [[36.99, -109.05], [41.01, -102.04]],
    color: '#06b6d4',
    flagOrIcon: '🏔️',
    country: 'United States',
    description: 'Centennial State encompassing the Rocky Mountains, Front Range urban corridor, Denver International Airport mega-hub, RTD transit grid, and COTrip statewide camera infrastructure.',
    stats: { population: '5.8 million', area: '269,837 km²', info: 'Denver Metro Hub • COTrip Cameras • Front Range Corridor' }
  },
  "new york state": {
    id: 'state-ny',
    name: 'New York State',
    category: 'TACTICAL_ZONE',
    lat: 43.2994,
    lon: -74.2179,
    zoom: 7,
    radiusKm: 350,
    bounds: [[40.5, -79.8], [45.0, -71.8]],
    color: '#3b82f6',
    flagOrIcon: '🗽',
    country: 'United States',
    description: 'Northeastern state commanding the 511NY traffic surveillance grid, MTA subway system, Hudson River corridor, and Niagara waterway.',
    stats: { population: '19.6 million', area: '141,300 km²', info: '511NY CCTV • MTA Transit • JFK/LGA Hub' }
  },
  hawaii: {
    id: 'state-hawaii',
    name: 'Hawaii, USA',
    category: 'TACTICAL_ZONE',
    lat: 19.8968,
    lon: -155.5828,
    zoom: 7,
    radiusKm: 300,
    bounds: [[18.9, -160.2], [22.2, -154.8]],
    color: '#10b981',
    flagOrIcon: '🌺',
    country: 'United States',
    description: 'Central Pacific archipelago and strategic maritime hub connecting North America and Asia-Pacific shipping corridors.',
    stats: { population: '1.4 million', area: '28,311 km²', info: 'Pearl Harbor • Honolulu Hub • Pacific Watch' }
  },
  mississippi: {
    id: 'state-mississippi',
    name: 'Mississippi, USA',
    category: 'TACTICAL_ZONE',
    lat: 32.7416,
    lon: -89.6787,
    zoom: 7,
    radiusKm: 320,
    bounds: [[30.17, -91.65], [35.0, -88.09]],
    color: '#06b6d4',
    flagOrIcon: '📍',
    country: 'United States',
    description: 'Deep South state along the Mississippi River and Gulf of Mexico, featuring MDOT Traffic statewide surveillance network across Jackson, the Gulf Coast, Hattiesburg, Southaven, and Tupelo.',
    stats: { population: '2.94 million', area: '125,443 km²', info: 'MDOT Traffic CCTV • Gulf Coast Littoral • I-55 & I-20 Corridors' }
  },
  jackson: {
    id: 'city-jackson-ms',
    name: 'Jackson, Mississippi',
    category: 'CITY',
    lat: 32.2988,
    lon: -90.1848,
    zoom: 12,
    radiusKm: 25,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'State capital and largest metropolitan hub of Mississippi, crossroads of I-55, I-20, and US-49 with extensive MDOT traffic camera coverage.',
    stats: { population: '150,000 (City), 600K (Metro)', area: '293 km²', info: 'MDOT Traffic Hub • I-55 & I-20 Interchange' }
  },
  oklahoma: {
    id: 'state-oklahoma',
    name: 'Oklahoma, USA',
    category: 'TACTICAL_ZONE',
    lat: 35.4676,
    lon: -97.5164,
    zoom: 7,
    radiusKm: 340,
    bounds: [[33.61, -103.0], [37.0, -94.43]],
    color: '#06b6d4',
    flagOrIcon: '📍',
    country: 'United States',
    description: 'South Central US state and crossroads of America, featuring OKDOT Traffic statewide video network covering Oklahoma City, Tulsa, Norman, Lawton, and the I-35, I-40, and I-44 corridors.',
    stats: { population: '4.02 million', area: '181,037 km²', info: 'OKDOT Traffic CCTV • I-35 & I-40 Crossroads • Will Rogers World Airport' }
  },
  "oklahoma city": {
    id: 'city-okc',
    name: 'Oklahoma City, Oklahoma',
    category: 'CITY',
    lat: 35.4676,
    lon: -97.5164,
    zoom: 12,
    radiusKm: 30,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Capital and largest city of Oklahoma, major junction of I-35, I-40, and I-44 with comprehensive OKDOT live camera network and Tinker AFB aerospace sector.',
    stats: { population: '700,000 (City), 1.45M (Metro)', area: '1,608 km²', info: 'OKDOT Traffic Hub • I-35/I-40/I-44 Interchange • Tinker AFB' }
  },
  okc: {
    id: 'city-okc-abbr',
    name: 'Oklahoma City, Oklahoma',
    category: 'CITY',
    lat: 35.4676,
    lon: -97.5164,
    zoom: 12,
    radiusKm: 30,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Capital and largest city of Oklahoma, major junction of I-35, I-40, and I-44 with comprehensive OKDOT live camera network and Tinker AFB aerospace sector.',
    stats: { population: '700,000 (City), 1.45M (Metro)', area: '1,608 km²', info: 'OKDOT Traffic Hub • I-35/I-40/I-44 Interchange • Tinker AFB' }
  },
  tulsa: {
    id: 'city-tulsa',
    name: 'Tulsa, Oklahoma',
    category: 'CITY',
    lat: 36.1540,
    lon: -95.9928,
    zoom: 12,
    radiusKm: 25,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Second-largest city in Oklahoma situated on the Arkansas River, key inland river port (Port of Catoosa) and hub for I-44, US-169, and US-75 OKDOT surveillance.',
    stats: { population: '413,000 (City), 1.03M (Metro)', area: '522 km²', info: 'Port of Catoosa • I-44 & US-169 Corridors • OKDOT Traffic Hub' }
  },
  waco: {
    id: 'city-waco',
    name: 'Waco, Texas',
    category: 'CITY',
    lat: 31.5493,
    lon: -97.1467,
    zoom: 12,
    radiusKm: 25,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Central Texas city along the Brazos River and I-35 corridor, home to Baylor University and TxDOT Waco District (WAC) comprehensive traffic surveillance network.',
    stats: { population: '140,000 (City), 280K (Metro)', area: '262 km²', info: 'TxDOT WAC District • I-35 & US-84 Corridor • Baylor University' }
  },
  bryan: {
    id: 'city-bryan',
    name: 'Bryan, Texas',
    category: 'CITY',
    lat: 30.6744,
    lon: -96.3700,
    zoom: 12,
    radiusKm: 20,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Twin city with College Station in the Brazos Valley, headquarters of the TxDOT Bryan District (BRY) managing highway surveillance on SH-6 and I-45.',
    stats: { population: '88,000 (City), 275K (Metro)', area: '115 km²', info: 'TxDOT BRY District • SH-6 & US-190 • Brazos Valley' }
  },
  "san angelo": {
    id: 'city-san-angelo',
    name: 'San Angelo, Texas',
    category: 'CITY',
    lat: 31.4638,
    lon: -100.4370,
    zoom: 13,
    radiusKm: 18,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Regional hub of West Central Texas and headquarters of TxDOT San Angelo District (SJT) along US-67, Loop 306, and the Concho Valley.',
    stats: { population: '101,000', area: '155 km²', info: 'TxDOT SJT District • US-67 & Loop 306 • Concho Valley' }
  },
  "abilene": {
    id: 'city-abilene',
    name: 'Abilene, Texas',
    category: 'CITY',
    lat: 32.4487,
    lon: -99.7331,
    zoom: 12,
    radiusKm: 20,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Anchor city of West Central Texas, home to Dyess Air Force Base and headquarters of the TxDOT Abilene District (ABL) with traffic cameras along I-20, US-83, US-84, and Loop 322.',
    stats: { population: '127,000', area: '290 km²', info: 'TxDOT ABL District • I-20 & US-83 • Dyess AFB' }
  },
  "brownwood": {
    id: 'city-brownwood',
    name: 'Brownwood, Texas',
    category: 'CITY',
    lat: 31.7093,
    lon: -98.9912,
    zoom: 12,
    radiusKm: 18,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'County seat of Brown County and headquarters of the TxDOT Brownwood District (BWD), monitoring critical highway corridors including I-20, US-67, US-84, and US-377 across Central Texas.',
    stats: { population: '19,000', area: '38 km²', info: 'TxDOT BWD District • I-20 Ranger Hill & US-377 • Lake Brownwood' }
  },
  "laredo": {
    id: 'city-laredo',
    name: 'Laredo, Texas',
    category: 'CITY',
    lat: 27.5036,
    lon: -99.5076,
    zoom: 12,
    radiusKm: 24,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Primary international inland port on the US-Mexico border and headquarters of the TxDOT Laredo District (LRD), managing extensive surveillance along IH-35, Loop 20 (Bob Bullock Loop), US-59, and US-83.',
    stats: { population: '256,000', area: '270 km²', info: 'TxDOT LRD District • IH-35 & World Trade Bridge • US-Mexico Border Port' }
  },
  "omaha": {
    id: 'city-omaha',
    name: 'Omaha, Nebraska',
    category: 'CITY',
    lat: 41.2565,
    lon: -95.9345,
    zoom: 12,
    radiusKm: 25,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Largest city in Nebraska, situated on the Missouri River, with full Nebraska 511 traffic surveillance coverage across I-80, I-480, I-680, US-75, and US-6.',
    stats: { population: '485,000 (City), 1.0M (Metro)', area: '380 km²', info: 'Nebraska 511 • I-80 & I-680 • Missouri River Corridor' }
  },
  "lincoln": {
    id: 'city-lincoln',
    name: 'Lincoln, Nebraska',
    category: 'CITY',
    lat: 40.8136,
    lon: -96.7026,
    zoom: 12,
    radiusKm: 22,
    color: '#38bdf8',
    flagOrIcon: '🏛️',
    country: 'United States',
    description: 'Capital city of Nebraska and home to the University of Nebraska, connected by Nebraska DOT 511 cameras along I-80, I-180, US-77, and US-34.',
    stats: { population: '295,000', area: '256 km²', info: 'Nebraska 511 • State Capitol • I-80 & US-77' }
  },
  "nebraska": {
    id: 'state-nebraska',
    name: 'Nebraska, USA',
    category: 'STATE',
    lat: 41.4925,
    lon: -99.9018,
    zoom: 7,
    radiusKm: 280,
    color: '#38bdf8',
    flagOrIcon: '🌽',
    country: 'United States',
    description: 'Midwestern Great Plains state with statewide Nebraska 511 camera coverage from Omaha and Lincoln along I-80, US-30, US-20, and US-83 across the Platte River Valley and Sandhills.',
    stats: { population: '1.98 Million', area: '200,356 km²', info: 'Nebraska DOT 511 • I-80 Transcontinental Corridor • 350+ Camera Locations' }
  },
  "des moines": {
    id: 'city-des-moines',
    name: 'Des Moines, Iowa',
    category: 'CITY',
    lat: 41.5868,
    lon: -93.6250,
    zoom: 12,
    radiusKm: 25,
    color: '#38bdf8',
    flagOrIcon: '🏛️',
    country: 'United States',
    description: 'Capital and most populous city of Iowa, with full Iowa DOT traffic camera surveillance along I-35, I-80, I-235 (MacVicar Freeway), and US-65.',
    stats: { population: '215,000 (City), 720,000 (Metro)', area: '235 km²', info: 'Iowa DOT 511 • I-35 / I-80 / I-235 Interchange • State Capitol' }
  },
  "cedar rapids": {
    id: 'city-cedar-rapids',
    name: 'Cedar Rapids, Iowa',
    category: 'CITY',
    lat: 41.9779,
    lon: -91.6656,
    zoom: 12,
    radiusKm: 20,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Second-largest city in Iowa, located on the Cedar River, monitored by Iowa DOT cameras along I-380, US-30, US-151, and IA-100.',
    stats: { population: '137,000', area: '186 km²', info: 'Iowa DOT 511 • I-380 Corridor • Cedar River' }
  },
  "iowa": {
    id: 'state-iowa',
    name: 'Iowa, USA',
    category: 'STATE',
    lat: 41.8780,
    lon: -93.0977,
    zoom: 7,
    radiusKm: 280,
    color: '#38bdf8',
    flagOrIcon: '🌽',
    country: 'United States',
    description: 'Midwestern US state bordered by the Mississippi and Missouri Rivers, covered by 1,250+ Iowa DOT traffic cameras across I-80, I-35, I-380, I-29, and major state corridors.',
    stats: { population: '3.20 Million', area: '145,746 km²', info: 'Iowa DOT Open Data • 1,250+ Live Cameras & HLS Streams • I-80 & I-35 Crossroads' }
  },
  "college station": {
    id: 'city-college-station',
    name: 'College Station, Texas',
    category: 'CITY',
    lat: 30.6280,
    lon: -96.3344,
    zoom: 12,
    radiusKm: 20,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Home of Texas A&M University and the George H.W. Bush Presidential Library, covered by TxDOT Bryan District (BRY) traffic cameras along SH-6 and FM 2818.',
    stats: { population: '124,000', area: '133 km²', info: 'Texas A&M University • TxDOT BRY Surveillance • SH-6 Corridor' }
  },
  temple: {
    id: 'city-temple-tx',
    name: 'Temple, Texas',
    category: 'CITY',
    lat: 31.0982,
    lon: -97.3428,
    zoom: 12,
    radiusKm: 20,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Major medical and transportation hub in Central Texas along I-35, monitored by TxDOT Waco District (WAC) live cameras.',
    stats: { population: '85,000', area: '190 km²', info: 'TxDOT WAC Surveillance • I-35 & SH-36 Crossroads • Baylor Scott & White Hub' }
  },
  killeen: {
    id: 'city-killeen',
    name: 'Killeen, Texas',
    category: 'CITY',
    lat: 31.1171,
    lon: -97.7278,
    zoom: 12,
    radiusKm: 25,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Central Texas city adjacent to Fort Cavazos (formerly Fort Hood), covered by TxDOT Waco District (WAC) traffic monitoring on I-14 / US-190.',
    stats: { population: '155,000 (City), 470K (Metro)', area: '141 km²', info: 'Fort Cavazos (US Army) • I-14 Corridor • TxDOT WAC Surveillance' }
  },
  victoria: {
    id: 'city-victoria-tx',
    name: 'Victoria, Texas',
    category: 'CITY',
    lat: 28.8053,
    lon: -97.0036,
    zoom: 12,
    radiusKm: 20,
    color: '#38bdf8',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Historic city in the Coastal Bend / Crossroads region of South Texas, hub for TxDOT Yoakum District (YKM) surveillance across US-59, US-77, and US-87.',
    stats: { population: '65,000', area: '96 km²', info: 'TxDOT YKM District • US-59 / Future I-69 • Texas Crossroads' }
  },
  arizona: {
    id: 'state-arizona',
    name: 'Arizona, USA',
    category: 'TACTICAL_ZONE',
    lat: 34.0489,
    lon: -111.0937,
    zoom: 7,
    radiusKm: 380,
    bounds: [[31.33, -114.81], [37.00, -109.04]],
    color: '#f59e0b',
    flagOrIcon: '📍',
    country: 'United States',
    description: 'Southwestern US state known for the Grand Canyon, Sonoran Desert, and ADOT Arizona 511 statewide surveillance network across Phoenix, Tucson, Flagstaff, and major interstate corridors.',
    stats: { population: '7.4 million', area: '295,234 km²', info: 'ADOT AZ-511 Network • I-10, I-17 & I-40 Corridors • Phoenix Metro Hub' }
  },
  phoenix: {
    id: 'city-phoenix',
    name: 'Phoenix, Arizona',
    category: 'CITY',
    lat: 33.4484,
    lon: -112.0740,
    zoom: 11,
    radiusKm: 40,
    color: '#f59e0b',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'State capital and largest city in Arizona, anchored by the Valley of the Sun freeway system (I-10, I-17, Loop 101, Loop 202, Loop 303, SR-51) with extensive ADOT live camera coverage.',
    stats: { population: '1.65M (City), 5.0M (Metro)', area: '1,341 km²', info: 'ADOT AZ-511 Hub • Loop 101/202/303 Systems • Phoenix Sky Harbor' }
  },
  tucson: {
    id: 'city-tucson',
    name: 'Tucson, Arizona',
    category: 'CITY',
    lat: 32.2226,
    lon: -110.9747,
    zoom: 12,
    radiusKm: 30,
    color: '#f59e0b',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Second-largest city in Arizona, home to the University of Arizona and Davis-Monthan AFB, covered by ADOT cameras along I-10, I-19, and SR-77.',
    stats: { population: '545,000 (City), 1.05M (Metro)', area: '614 km²', info: 'University of Arizona • Davis-Monthan AFB • I-10 & I-19 Corridor' }
  },
  scottsdale: {
    id: 'city-scottsdale',
    name: 'Scottsdale, Arizona',
    category: 'CITY',
    lat: 33.4942,
    lon: -111.9261,
    zoom: 12,
    radiusKm: 25,
    color: '#f59e0b',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Prominent city in the eastern Phoenix metropolitan area along the Loop 101 Pima Freeway corridor with high-density ADOT traffic camera coverage.',
    stats: { population: '243,000', area: '477 km²', info: 'Loop 101 Pima Corridor • Old Town Scottsdale • Scottsdale Airport' }
  },
  mesa: {
    id: 'city-mesa',
    name: 'Mesa, Arizona',
    category: 'CITY',
    lat: 33.4152,
    lon: -111.8315,
    zoom: 12,
    radiusKm: 25,
    color: '#f59e0b',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'East Valley metropolitan center connected by US-60 Superstition Freeway and Loop 202 Red Mountain / Santan freeways.',
    stats: { population: '510,000', area: '358 km²', info: 'US-60 & Loop 202 Corridors • Falcon Field • East Valley Hub' }
  },
  tempe: {
    id: 'city-tempe',
    name: 'Tempe, Arizona',
    category: 'CITY',
    lat: 33.4255,
    lon: -111.9400,
    zoom: 12,
    radiusKm: 15,
    color: '#f59e0b',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Hub of Arizona State University (ASU) and tech employers, surrounded by I-10, Loop 101, Loop 202, and US-60.',
    stats: { population: '185,000', area: '104 km²', info: 'Arizona State University (ASU) • I-10 & Loop 202 • Tempe Town Lake' }
  },
  flagstaff: {
    id: 'city-flagstaff',
    name: 'Flagstaff, Arizona',
    category: 'CITY',
    lat: 35.1983,
    lon: -111.6513,
    zoom: 12,
    radiusKm: 20,
    color: '#f59e0b',
    flagOrIcon: '🏔️',
    country: 'United States',
    description: 'Northern Arizona high-altitude city at the base of the San Francisco Peaks, major crossroads of I-40 and I-17 with ADOT mountain pass cameras.',
    stats: { population: '76,000', area: '166 km²', info: 'San Francisco Peaks • I-40 & I-17 Junction • Route 66 Gateway' }
  },
  "new mexico": {
    id: 'state-new-mexico',
    name: 'New Mexico, USA',
    category: 'TACTICAL_ZONE',
    lat: 34.5199,
    lon: -105.8701,
    zoom: 7,
    radiusKm: 380,
    bounds: [[31.33, -109.05], [37.00, -103.00]],
    color: '#f97316',
    flagOrIcon: '📍',
    country: 'United States',
    description: 'Land of Enchantment, traversed by major I-25, I-40, and I-10 corridors with statewide real-time traffic surveillance from NMDOT NMRoads (nmroads.com).',
    stats: { population: '2.1 million', area: '314,917 km²', info: 'NMDOT NMRoads Network • I-25, I-40 & I-10 Corridors • Sandia & Sangre de Cristo Hubs' }
  },
  albuquerque: {
    id: 'city-albuquerque',
    name: 'Albuquerque, New Mexico',
    category: 'CITY',
    lat: 35.0844,
    lon: -106.6504,
    zoom: 11,
    radiusKm: 35,
    color: '#f97316',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'New Mexico\'s largest city, situated along the Rio Grande and Sandia Mountains at the "Big I" interchange of I-25 and I-40 with extensive NMDOT camera coverage.',
    stats: { population: '565,000 (City), 920,000 (Metro)', area: '491 km²', info: 'Big I (I-25 / I-40 Interchange) • Paseo del Norte • Sandia Peak' }
  },
  "santa fe": {
    id: 'city-santa-fe',
    name: 'Santa Fe, New Mexico',
    category: 'CITY',
    lat: 35.6870,
    lon: -105.9378,
    zoom: 12,
    radiusKm: 25,
    color: '#f97316',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'State capital of New Mexico and historic cultural center at the foot of the Sangre de Cristo Mountains, monitored along I-25, NM-599, and US-84/285.',
    stats: { population: '88,000', area: '135 km²', info: 'State Capitol • La Bajada Pass • Sangre de Cristo Gateway' }
  },
  "las cruces": {
    id: 'city-las-cruces',
    name: 'Las Cruces, New Mexico',
    category: 'CITY',
    lat: 32.3199,
    lon: -106.7637,
    zoom: 12,
    radiusKm: 25,
    color: '#f97316',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Southern New Mexico hub in the Mesilla Valley near the Organ Mountains, junction of I-10 and I-25 with border corridor surveillance.',
    stats: { population: '112,000', area: '198 km²', info: 'I-10 & I-25 Junction • White Sands Gateway • Organ Mountains' }
  },
  gallup: {
    id: 'city-gallup',
    name: 'Gallup, New Mexico',
    category: 'CITY',
    lat: 35.5281,
    lon: -108.7426,
    zoom: 12,
    radiusKm: 20,
    color: '#f97316',
    flagOrIcon: '🏜️',
    country: 'United States',
    description: 'Western New Mexico city on historic Route 66 and I-40 near the Navajo Nation, covered by NMDOT Continental Divide traffic cameras.',
    stats: { population: '22,000', area: '51 km²', info: 'I-40 / Route 66 Corridor • Red Rock Country • Navajo Nation Gateway' }
  },
  roswell: {
    id: 'city-roswell',
    name: 'Roswell, New Mexico',
    category: 'CITY',
    lat: 33.3943,
    lon: -104.5230,
    zoom: 12,
    radiusKm: 20,
    color: '#f97316',
    flagOrIcon: '🛸',
    country: 'United States',
    description: 'City in southeastern New Mexico along the Pecos River valley at the crossroads of US-285, US-70, and US-380.',
    stats: { population: '48,000', area: '77 km²', info: 'US-285 & US-70 Corridor • International UFO Museum • Bottomless Lakes' }
  },
  taos: {
    id: 'city-taos',
    name: 'Taos, New Mexico',
    category: 'CITY',
    lat: 36.4072,
    lon: -105.5734,
    zoom: 12,
    radiusKm: 20,
    color: '#f97316',
    flagOrIcon: '🏔️',
    country: 'United States',
    description: 'High-altitude northern New Mexico town famous for historic Taos Pueblo, Rio Grande Gorge Bridge, and mountain highway surveillance along NM-68 and US-64.',
    stats: { population: '6,500', area: '15 km²', info: 'Taos Ski Valley • Rio Grande Gorge Bridge • Historic Taos Pueblo' }
  },
  utah: {
    id: 'state-utah',
    name: 'Utah, USA',
    category: 'TACTICAL_ZONE',
    lat: 39.3210,
    lon: -111.0937,
    zoom: 7,
    radiusKm: 380,
    bounds: [[37.00, -114.05], [42.00, -109.04]],
    color: '#0ea5e9',
    flagOrIcon: '🏔️',
    country: 'United States',
    description: 'Beehive State, home to the Wasatch Front urban corridor and Mighty 5 National Parks, monitored by over 2,000 live UDOT Traffic (udottraffic.utah.gov) surveillance cameras.',
    stats: { population: '3.4 million', area: '219,887 km²', info: 'UDOT Traffic Grid (2,000+ Cams) • I-15 & I-80 Wasatch Corridors • Parleys Summit & Zion' }
  },
  "salt lake city": {
    id: 'city-salt-lake-city',
    name: 'Salt Lake City, Utah',
    category: 'CITY',
    lat: 40.7608,
    lon: -111.8910,
    zoom: 11,
    radiusKm: 35,
    color: '#0ea5e9',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'State capital and central metropolitan anchor of the Wasatch Front, monitored across I-15, I-80, I-215, SR-201, and Bangerter Highway by UDOT Traffic cameras.',
    stats: { population: '205,000 (City), 1.26M (Metro)', area: '286 km²', info: 'Wasatch Front Hub • I-15 / I-80 Interchange • SLC International Airport' }
  },
  provo: {
    id: 'city-provo',
    name: 'Provo, Utah',
    category: 'CITY',
    lat: 40.2338,
    lon: -111.6585,
    zoom: 12,
    radiusKm: 25,
    color: '#0ea5e9',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Utah Valley economic and tech hub, home to Brigham Young University and Silicon Slopes corridor along I-15 and US-89 with comprehensive UDOT camera monitoring.',
    stats: { population: '115,000 (City), 670,000 (Utah Valley)', area: '114 km²', info: 'Silicon Slopes • Brigham Young University • Utah Lake & Timpanogos' }
  },
  ogden: {
    id: 'city-ogden',
    name: 'Ogden, Utah',
    category: 'CITY',
    lat: 41.2230,
    lon: -111.9738,
    zoom: 12,
    radiusKm: 25,
    color: '#0ea5e9',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Historic railway and aerospace hub in Northern Utah at the junction of I-15 and I-84, monitored by UDOT cameras from Weber Canyon to Riverdale.',
    stats: { population: '87,000', area: '70 km²', info: 'Hill AFB / Aerospace Hub • I-15 & I-84 Junction • Weber Canyon' }
  },
  "st george": {
    id: 'city-st-george',
    name: 'St. George, Utah',
    category: 'CITY',
    lat: 37.0965,
    lon: -113.5684,
    zoom: 12,
    radiusKm: 25,
    color: '#0ea5e9',
    flagOrIcon: '🏜️',
    country: 'United States',
    description: 'Fast-growing southern Utah city in the red rock desert near Zion National Park, monitored along the I-15 Virgin River corridor and Southern Parkway (SR-7).',
    stats: { population: '102,000 (City), 195,000 (Metro)', area: '194 km²', info: 'Zion NP Gateway • I-15 Virgin River Gorge • Dixie Red Rocks' }
  },
  "park city": {
    id: 'city-park-city',
    name: 'Park City, Utah',
    category: 'CITY',
    lat: 40.6461,
    lon: -111.4980,
    zoom: 12,
    radiusKm: 20,
    color: '#0ea5e9',
    flagOrIcon: '⛷️',
    country: 'United States',
    description: 'World-renowned mountain resort town and home of Sundance Film Festival in the Wasatch Range, monitored by UDOT mountain pass webcams along I-80 and SR-224.',
    stats: { population: '8,400', area: '53 km²', info: 'Parleys Summit (I-80) • Deer Valley & Park City Mountain • Sundance Hub' }
  },
  logan: {
    id: 'city-logan',
    name: 'Logan, Utah',
    category: 'CITY',
    lat: 41.7370,
    lon: -111.8338,
    zoom: 12,
    radiusKm: 20,
    color: '#0ea5e9',
    flagOrIcon: '🏔️',
    country: 'United States',
    description: 'Northern Utah city in Cache Valley, home to Utah State University and monitored along US-89 and Logan Canyon summit pass.',
    stats: { population: '54,000', area: '48 km²', info: 'Utah State University • Cache Valley • Logan Canyon (US-89)' }
  },
  moab: {
    id: 'city-moab',
    name: 'Moab, Utah',
    category: 'CITY',
    lat: 38.5733,
    lon: -109.5498,
    zoom: 12,
    radiusKm: 20,
    color: '#0ea5e9',
    flagOrIcon: '🏜️',
    country: 'United States',
    description: 'Outdoor adventure epicenter in southeastern Utah, gateway to Arches and Canyonlands National Parks along US-191 and Colorado River canyon.',
    stats: { population: '5,300', area: '12 km²', info: 'Arches & Canyonlands National Parks • US-191 Corridor • Colorado River Canyon' }
  },
  arkansas: {
    id: 'state-arkansas',
    name: 'Arkansas, USA',
    category: 'TACTICAL_ZONE',
    lat: 34.7465,
    lon: -92.2896,
    zoom: 7,
    radiusKm: 300,
    bounds: [[33.00, -94.62], [36.50, -89.64]],
    color: '#dc2626',
    flagOrIcon: '💎',
    country: 'United States',
    description: 'Natural State of the American Mid-South, traversed by major I-30, I-40, and I-49 freight corridors with 550+ live ARDOT iDrive Arkansas (idrivearkansas.com) surveillance cameras.',
    stats: { population: '3.05 million', area: '137,732 km²', info: 'ARDOT iDrive Arkansas Grid (550+ Cams) • I-30 / I-40 Crossroads • Arkansas River Valley' }
  },
  "little rock": {
    id: 'city-little-rock',
    name: 'Little Rock, Arkansas',
    category: 'CITY',
    lat: 34.7465,
    lon: -92.2896,
    zoom: 11,
    radiusKm: 30,
    color: '#dc2626',
    flagOrIcon: '🏛️',
    country: 'United States',
    description: 'Capital and most populous city in Arkansas, situated along the Arkansas River at the hub of I-30, I-40, I-430, and I-630 with extensive ARDOT live camera coverage.',
    stats: { population: '202,000 (City), 750,000 (Metro)', area: '313 km²', info: 'State Capitol • Arkansas River Bridges • I-30 / I-40 Interchange' }
  },
  "north little rock": {
    id: 'city-north-little-rock',
    name: 'North Little Rock, Arkansas',
    category: 'CITY',
    lat: 34.7695,
    lon: -92.2671,
    zoom: 12,
    radiusKm: 25,
    color: '#dc2626',
    flagOrIcon: '🏙️',
    country: 'United States',
    description: 'Major city directly across the Arkansas River from Little Rock, junction of I-30, I-40, and US-67/167 monitored by ARDOT traffic cameras.',
    stats: { population: '65,000', area: '142 km²', info: 'McCain Corridor • I-30 & I-40 Split • Simmons Bank Arena' }
  },
  fayetteville: {
    id: 'city-fayetteville',
    name: 'Fayetteville, Arkansas',
    category: 'CITY',
    lat: 36.0822,
    lon: -94.1719,
    zoom: 12,
    radiusKm: 25,
    color: '#dc2626',
    flagOrIcon: '🐗',
    country: 'United States',
    description: 'Home of the University of Arkansas and southern anchor of the booming Northwest Arkansas (NWA) metro along the I-49 corridor with ARDOT surveillance.',
    stats: { population: '99,000 (City), 560,000 (NWA Metro)', area: '143 km²', info: 'University of Arkansas (Razorbacks) • I-49 Corridor • Ozark Mountains' }
  },
  bentonville: {
    id: 'city-bentonville',
    name: 'Bentonville, Arkansas',
    category: 'CITY',
    lat: 36.3729,
    lon: -94.2088,
    zoom: 12,
    radiusKm: 20,
    color: '#dc2626',
    flagOrIcon: '🏢',
    country: 'United States',
    description: 'Global headquarters of Walmart and northern hub of Northwest Arkansas, monitored along I-49 and US-71 by ARDOT traffic webcams.',
    stats: { population: '57,000', area: '81 km²', info: 'Walmart Global HQ • Crystal Bridges • I-49 & Bella Vista Bypass' }
  },
  "fort smith": {
    id: 'city-fort-smith',
    name: 'Fort Smith, Arkansas',
    category: 'CITY',
    lat: 35.3859,
    lon: -94.3985,
    zoom: 12,
    radiusKm: 25,
    color: '#dc2626',
    flagOrIcon: '🏰',
    country: 'United States',
    description: 'Historic city on the Arkansas-Oklahoma border along the Arkansas River, key interchange of I-40 and I-540 covered by ARDOT cameras.',
    stats: { population: '89,000 (City), 250,000 (Metro)', area: '177 km²', info: 'Arkansas-Oklahoma Border • I-40 / I-540 Interchange • Ebbing Air National Guard Base' }
  },
  jonesboro: {
    id: 'city-jonesboro',
    name: 'Jonesboro, Arkansas',
    category: 'CITY',
    lat: 35.8423,
    lon: -90.7043,
    zoom: 12,
    radiusKm: 20,
    color: '#dc2626',
    flagOrIcon: '🌾',
    country: 'United States',
    description: 'Regional hub of Northeast Arkansas and home to Arkansas State University, monitored along I-555 and US-63.',
    stats: { population: '79,000', area: '208 km²', info: 'Arkansas State University • I-555 Red Wolf Corridor • Crowley\'s Ridge' }
  },
  "west memphis": {
    id: 'city-west-memphis',
    name: 'West Memphis, Arkansas',
    category: 'CITY',
    lat: 35.1465,
    lon: -90.1845,
    zoom: 12,
    radiusKm: 20,
    color: '#dc2626',
    flagOrIcon: '🌉',
    country: 'United States',
    description: 'Major freight hub situated at the junction of I-40 and I-55 on the west bank of the Mississippi River opposite Memphis, Tennessee.',
    stats: { population: '24,000', area: '74 km²', info: 'Mississippi River Freight Hub • I-40 & I-55 Confluence • Hernando de Soto Bridge' }
  },
  "hot springs": {
    id: 'city-hot-springs',
    name: 'Hot Springs, Arkansas',
    category: 'CITY',
    lat: 34.5037,
    lon: -93.0552,
    zoom: 12,
    radiusKm: 20,
    color: '#dc2626',
    flagOrIcon: '♨️',
    country: 'United States',
    description: 'Famous resort city in the Ouachita Mountains known for Hot Springs National Park and Oaklawn Racing, monitored along US-70 and US-270.',
    stats: { population: '38,000', area: '96 km²', info: 'Hot Springs National Park • Ouachita Mountains • US-70 & US-270' }
  },
  alaska: {
    id: 'state-alaska',
    name: 'Alaska, USA',
    category: 'TACTICAL_ZONE',
    lat: 64.2008,
    lon: -149.4937,
    zoom: 4,
    radiusKm: 1400,
    bounds: [[51.2, -179.1], [71.4, -129.9]],
    color: '#93c5fd',
    flagOrIcon: '🏔️',
    country: 'United States',
    description: 'Largest US state by area, commanding the Bering Strait maritime gateway between North America and Russia and Arctic airspace tracks.',
    stats: { population: '733,000', area: '1.72M km²', info: 'Bering Strait • Anchorage Cargo Hub • Arctic Corridor' }
  },

  // --------------------------------------------------------------------------
  // 7. LANDMARKS & SPECIAL PHENOMENA
  // --------------------------------------------------------------------------
  "mount everest": {
    id: 'landmark-everest',
    name: 'Mount Everest (Chomolungma)',
    category: 'LANDMARK',
    lat: 27.9881,
    lon: 86.9250,
    zoom: 12,
    radiusKm: 25,
    color: '#93c5fd',
    flagOrIcon: '🏔️',
    description: 'Earth\'s highest mountain above sea level, located in the Mahalangur Himal sub-range of the Himalayas on the Nepal-China border.',
    stats: { elevation: '8,848.86 m (29,031.7 ft)', prominence: '8,848 m', location: 'Himalayas, Nepal / China' }
  },
  "bermuda triangle": {
    id: 'landmark-bermuda-triangle',
    name: 'Bermuda Triangle',
    category: 'TACTICAL_ZONE',
    lat: 25.0000,
    lon: -71.0000,
    zoom: 6,
    radiusKm: 700,
    bounds: [[18.4, -80.2], [32.3, -64.7]],
    color: '#8b5cf6',
    flagOrIcon: '⚠️',
    description: 'Loosely defined region in the western part of the North Atlantic Ocean between Miami, Bermuda, and San Juan Puerto Rico.',
    stats: { area: '~1.3 million km²', info: 'High-density Atlantic flight corridor & Caribbean shipping' }
  },
  "amazon river": {
    id: 'landmark-amazon-river',
    name: 'Amazon River Basin',
    category: 'WATERWAY',
    lat: -3.4653,
    lon: -62.2159,
    zoom: 5,
    radiusKm: 1200,
    bounds: [[-12.0, -78.0], [4.0, -50.0]],
    color: '#10b981',
    flagOrIcon: '🌿',
    description: 'World\'s largest river by discharge volume, carrying greater volume than the next seven largest rivers combined.',
    stats: { length: '6,400 km', basinArea: '7.05 million km²', discharge: '~209,000 m³/s' }
  },
  "nile river": {
    id: 'landmark-nile-river',
    name: 'Nile River',
    category: 'WATERWAY',
    lat: 15.0000,
    lon: 32.5000,
    zoom: 5,
    radiusKm: 1500,
    bounds: [[-3.0, 29.0], [31.5, 33.5]],
    color: '#eab308',
    flagOrIcon: '🌊',
    description: 'Major north-flowing river in northeastern Africa, historically considered the longest river in the world (6,650 km).',
    stats: { length: '6,650 km', basinCountries: '11 African nations', mouth: 'Mediterranean Sea' }
  },
  "wildfires": {
    id: 'tactical-wildfires',
    name: 'NASA FIRMS Wildfire Hotspots',
    category: 'TACTICAL_ZONE',
    lat: 36.7783,
    lon: -119.4179,
    zoom: 6,
    radiusKm: 800,
    color: '#f97316',
    flagOrIcon: '🔥',
    description: 'NASA FIRMS thermal anomaly detection grid tracking active wildfires, prescribed agricultural burns, and biomass thermal signatures.',
    stats: { source: 'NASA LANCE / FIRMS MODIS & VIIRS', cadence: 'Real-time 375m & 1km thermal sensor updates' }
  },
  "cctv surveillance grid": {
    id: 'tactical-cctv-grid',
    name: 'Texas Highway CCTV Grid',
    category: 'TACTICAL_ZONE',
    lat: 29.7604,
    lon: -95.3698,
    zoom: 10,
    radiusKm: 75,
    color: '#10b981',
    flagOrIcon: '📷',
    description: 'Houston TranStar & Texas DOT real-time highway surveillance grid covering I-10, I-45, I-69, Loop 610, and Galveston Seawall cameras.',
    stats: { count: '1,200+ municipal feeds', coverage: 'Houston Metro & Galveston Seawall' }
  }
};

// Helper to look up or search the registry
export function findGeoHighlight(query: string): MapHighlight | null {
  if (!query) return null;

  // Normalize query: remove typical conversational & action words
  let q = query
    .toLowerCase()
    .trim()
    .replace(/^hey\s+world[,\s]*/i, '')
    .replace(/^(please\s+|can\s+you\s+|could\s+you\s+)/i, '')
    .replace(/^(highlight|show|show\s+me|where\s+is|find|outline|zoom\s+to|teleport\s+to|navigate\s+to|go\s+to|look\s+at|search\s+for|track)\s+/i, '')
    .replace(/^(the|city\s+of|country\s+of|continent\s+of|state\s+of|region\s+of|island\s+of)\s+/i, '')
    .replace(/\s+(area|zone|region|continent|country|city|map|view|highlight|border|boundary)$/i, '')
    .trim();

  if (!q) return null;

  // 1. Exact match in registry keys
  if (GEO_HIGHLIGHT_REGISTRY[q]) {
    return GEO_HIGHLIGHT_REGISTRY[q];
  }

  // 2. Exact match on id or name
  for (const item of Object.values(GEO_HIGHLIGHT_REGISTRY)) {
    if (item.name.toLowerCase() === q || item.id.toLowerCase() === q) {
      return item;
    }
  }

  // 3. Normalized alias checks
  if (/^(africa|african)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['africa'];
  if (/^(europe|european)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['europe'];
  if (/^(asia|asian)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['asia'];
  if (/^(north\s+america|north-america|na)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['north america'];
  if (/^(south\s+america|south-america|sa)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['south america'];
  if (/^(australia\s+continent|oceania|australasia)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['australia_continent'];
  if (/^(antarctica|south\s+pole|antarctic)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['antarctica'];

  // Countries
  if (/^(us|usa|united\s+states|united\s+states\s+of\s+america|america|u\.s\.|u\.s\.a\.)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['united states'];
  if (/^(uk|united\s+kingdom|britain|great\s+britain|england|scotland|wales)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['united kingdom'];
  if (/^(japan|nippon|nihon)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['japan'];
  if (/^(china|prc)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['china'];
  if (/^(korea|south\s+korea|rok)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['south korea'];
  if (/^(uae|emirates|united\s+arab\s+emirates)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['uae'];
  if (/^(russia|russian\s+federation)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['russia'];

  // States
  if (/^(texas|tx|lone\s+star)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['texas'];
  if (/^(california|cali|ca)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['california'];
  if (/^(illinois|il)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['illinois'];
  if (/^(florida|fl)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['florida'];
  if (/^(new\s+york\s+state|ny\s+state|nys)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['new york state'];
  if (/^(hawaii|hi)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['hawaii'];
  if (/^(alaska|ak)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['alaska'];
  if (/^(mississippi|ms|magnolia\s+state)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['mississippi'];
  if (/^(jackson|jackson\s+ms)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['jackson'];

  // Waterways & Oceans
  if (/^(pacific|pacific\s+ocean)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['pacific ocean'];
  if (/^(atlantic|atlantic\s+ocean)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['atlantic ocean'];
  if (/^(indian|indian\s+ocean)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['indian ocean'];
  if (/^(arctic|arctic\s+ocean|north\s+pole)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['arctic ocean'];
  if (/^(suez|suez\s+canal)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['suez canal'];
  if (/^(panama|panama\s+canal)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['panama canal'];
  if (/^(malacca|strait\s+of\s+malacca|malacca\s+strait)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['strait of malacca'];
  if (/^(gibraltar|strait\s+of\s+gibraltar)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['strait of gibraltar'];
  if (/^(hormuz|strait\s+of\s+hormuz)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['strait of hormuz'];
  if (/^(gulf|gulf\s+of\s+mexico|mexico\s+gulf)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['gulf of mexico'];
  if (/^(mediterranean|mediterranean\s+sea)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['mediterranean sea'];
  if (/^(caribbean|caribbean\s+sea)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['caribbean sea'];
  if (/^(south\s+china\s+sea|scs)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['south china sea'];
  if (/^(red\s+sea)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['red sea'];

  // Cities & Local
  if (/^(galveston|galveston\s+island|galveston\s+beach|babe's\s+beach|the\s+strand)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['galveston'];
  if (/^(houston|houston\s+tx)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['houston'];
  if (/^(dallas|dallas\s+tx)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['dallas'];
  if (/^(dfw|dallas\s+fort\s+worth)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['dallas'];
  if (/^(fort\s+worth|ft\s+worth)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['fort worth'];
  if (/^(nyc|new\s+york\s+city|new\s+york|manhattan)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['new york'];
  if (/^(sf|san\s+francisco|bay\s+area)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['san francisco'];
  if (/^(san\s+angelo|san\s+angelo\s+tx|sjt)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['san angelo'];
  if (/^(la|los\s+angeles)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['los angeles'];
  if (/^(chi|chicago|windy\s+city)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['chicago'];
  if (/^(denver|denver\s+co|mile\s*high(\s*city)?)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['denver'];
  if (/^(den|kden|denver\s+airport|denver\s+international\s+airport)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['denver international airport'];
  if (/^(colorado|co)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['colorado'];

  // Tactical phenomena
  if (/^(wildfire|wildfires|fire|fires|nasa\s+firms|burns)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['wildfires'];
  if (/^(cctv\s+grid|highway\s+cctv|texas\s+cameras)$/i.test(q)) return GEO_HIGHLIGHT_REGISTRY['cctv surveillance grid'];

  // 4. Substring & word boundary matching
  const entries = Object.entries(GEO_HIGHLIGHT_REGISTRY);
  entries.sort((a, b) => b[0].length - a[0].length);

  for (const [key, item] of entries) {
    const keyLower = key.toLowerCase();
    const itemNameLower = item.name.toLowerCase();

    // Exact matches
    if (q === keyLower || q === itemNameLower) {
      return item;
    }

    // Word boundary match (e.g. "highlight dallas" or "show la")
    const escapedKey = keyLower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const wordBoundRegex = new RegExp(`\\b${escapedKey}\\b`, 'i');
    if (wordBoundRegex.test(q)) {
      return item;
    }

    // For longer keys (>3 chars), allow substring matches if query or key is multi-word
    if (keyLower.length > 3) {
      if (q.includes(keyLower) || itemNameLower.includes(q) || (q.length > 3 && keyLower.includes(q))) {
        return item;
      }
    }
  }

  // 5. Fallback to GLOBAL_LOCATIONS
  if (GLOBAL_LOCATIONS[q]) {
    const loc = GLOBAL_LOCATIONS[q];
    return {
      id: `city-${q.replace(/[^a-z0-9]/g, '-')}`,
      name: loc.name,
      category: 'CITY',
      lat: loc.lat,
      lon: loc.lon,
      zoom: loc.zoom,
      radiusKm: 25,
      color: '#38bdf8',
      flagOrIcon: '🏙️'
    };
  }

  return null;
}
