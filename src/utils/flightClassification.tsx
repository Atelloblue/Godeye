import React from 'react';
import { FlightState } from '../types';

/**
 * Regex matching known helicopter ICAO types or model designations.
 * Includes Bell, Sikorsky, Eurocopter / Airbus Helicopters, Robinson,
 * Boeing Vertol / Chinook, Mil, Kamov, MD Helicopters, AgustaWestland / Leonardo, etc.
 */
export const HELICOPTER_TYPE_REGEX = /^(H[0-9]|UH|AH|CH|MH|SH|HH|OH|V22|CV22|MV22|EC[0-9]|AS[0-9]|SA[0-9]|R22|R44|R66|B06|B206|B212|B214|B222|B407|B412|B427|B429|B430|B505|B525|B47|A109|A119|A139|A149|A169|A189|AW[0-9]|S76|S92|S70|S61|S64|S58|S55|MI[0-9]|KA[0-9]|MD5|BK11|BO10|CABR|EN48|EN28|G2CA|KMAX|HUCO|SK61)/i;

/**
 * Regex matching known military callsigns, squadrons, or ICAO aircraft codes.
 */
export const MILITARY_TYPE_REGEX = /^(C17|C130|C135|KC10|KC46|KC135|A400|C390|C27J|C295|F15|F16|F18|F22|F35|A10|B1|B2|B52|EUFI|TOR|RAF|M2K|SU[0-9]|MIG|T38|T6|T45|E3|E7|E8|E2|P8|P3|RC135|U2|RQ4|MQ9|H60|UH60|MH60|SH60|HH60|CH47|H47|CH53|H53|AH64|AH1|UH1|V22|CV22|MV22|OH58|NH90|TIG|IL76|AN12|AN26)/i;

export const MILITARY_CALLSIGN_REGEX = /^(RCH|REACH|CNV|EVAC|PAT|JAKE|TOPCAT|DUKE|VIPER|HAWK|NAVY|ARMY|USAF|USMC|USCG|NATO|FAF|BAF|GAF|RAFR|ASY|CFC|FORTE|HOMER|LAGR|NCHO|REDEYE|SLAM|BONE|DEATH|REAPER|TALON|GHOST|WARLOCK|SKULL|SHADOW|VALKYRIE|IRON|KNIGHT|PEGASUS|GUARD|ANG)/i;

/**
 * Evaluates whether a given flight is a helicopter / rotorcraft.
 */
export function isHelicopterFlight(flight?: Partial<FlightState> | null): boolean {
  if (!flight) return false;
  if (typeof flight.isHelicopter === 'boolean') {
    return flight.isHelicopter;
  }

  const model = (flight.aircraftModel || '').trim();
  const callsign = (flight.callsign || '').trim();
  const origin = (flight.originCountry || '').trim();

  if (HELICOPTER_TYPE_REGEX.test(model)) return true;
  if (/heli|copter|lifeflt|airamb|medevac|rotor|statmd|calstar/i.test(callsign)) return true;
  if (/helicopter|rotorcraft|chopper|sikorsky|bell 2|bell 4|eurocopter|robinson r|blackhawk|black hawk|chinook|apache|huey|lakota|seahawk|super stallion|osprey/i.test(model)) return true;
  if (/Type:\s*(H[0-9]|UH|AH|CH|EC|AS|R22|R44|B06|B407|B412|S76|S92|AW)/i.test(origin)) return true;

  return false;
}

/**
 * Evaluates whether a given flight is a military aircraft.
 */
export function isMilitaryFlight(flight?: Partial<FlightState> | null): boolean {
  if (!flight) return false;
  if (typeof flight.isMilitary === 'boolean') {
    return flight.isMilitary;
  }

  const model = (flight.aircraftModel || '').trim();
  const callsign = (flight.callsign || '').trim();
  const origin = (flight.originCountry || '').trim();

  if (MILITARY_TYPE_REGEX.test(model)) return true;
  if (MILITARY_CALLSIGN_REGEX.test(callsign)) return true;
  if (/Type:\s*(C17|C130|C135|KC10|KC46|F15|F16|F18|F22|F35|A10|B1|B2|B52|EUFI|TOR|T38|P8|RC135|U2|H60|UH60|CH47|H47|AH64)/i.test(origin)) return true;
  if (/air force|usaf|navy|army|military|marines|usmc|coast guard|uscg/i.test(origin)) return true;

  return false;
}

/**
 * Clean Lucide-styled Helicopter SVG component for UI badges and drawers.
 */
export const HelicopterIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Rotor bar */}
    <path d="M4 4h16" />
    <path d="M12 4v3" />
    {/* Fuselage / Cabin */}
    <path d="M5 14a5 5 0 0 1 5-5h5a4 4 0 0 1 4 4v1a3 3 0 0 1-3 3H9a4 4 0 0 1-4-3z" />
    {/* Cockpit window */}
    <path d="M15 9l3 3h-5V9z" />
    {/* Tail Boom & Tail Rotor */}
    <path d="M5 12H2v-3" />
    <path d="M2 9v6" />
    {/* Landing Skids */}
    <path d="M7 17v2h10v-2" />
    <path d="M6 21h12" />
  </svg>
);

/**
 * Common aircraft models mapping for human-readable display.
 */
const COMMON_AIRCRAFT_MODELS: Record<string, string> = {
  B752: 'Boeing 757-200',
  B753: 'Boeing 757-300',
  B738: 'Boeing 737-800',
  B737: 'Boeing 737-700',
  B739: 'Boeing 737-900',
  B38M: 'Boeing 737 MAX 8',
  B39M: 'Boeing 737 MAX 9',
  B772: 'Boeing 777-200',
  B77W: 'Boeing 777-300ER',
  B77L: 'Boeing 777-200LR',
  B788: 'Boeing 787-8 Dreamliner',
  B789: 'Boeing 787-9 Dreamliner',
  B78X: 'Boeing 787-10 Dreamliner',
  B763: 'Boeing 767-300',
  B764: 'Boeing 767-400',
  B744: 'Boeing 747-400',
  B748: 'Boeing 747-8',
  A319: 'Airbus A319',
  A320: 'Airbus A320',
  A321: 'Airbus A321',
  A20N: 'Airbus A320neo',
  A21N: 'Airbus A321neo',
  A332: 'Airbus A330-200',
  A333: 'Airbus A330-300',
  A339: 'Airbus A330-900neo',
  A359: 'Airbus A350-900',
  A35K: 'Airbus A350-1000',
  A388: 'Airbus A380-800',
  BCS1: 'Airbus A220-100',
  BCS3: 'Airbus A220-300',
  E75L: 'Embraer E175',
  E190: 'Embraer E190',
  CRJ9: 'Bombardier CRJ-900',
  CRJ7: 'Bombardier CRJ-700',
  CRJ2: 'Bombardier CRJ-200',
  C17: 'Boeing C-17 Globemaster III',
  C130: 'Lockheed C-130 Hercules',
  KC135: 'Boeing KC-135 Stratotanker',
  H60: 'Sikorsky UH-60 Black Hawk',
  UH60: 'Sikorsky UH-60 Black Hawk',
  CH47: 'Boeing CH-47 Chinook',
  AH64: 'Boeing AH-64 Apache',
  V22: 'Bell Boeing V-22 Osprey',
  B06: 'Bell 206 JetRanger',
  B407: 'Bell 407',
  B412: 'Bell 412',
  EC35: 'Eurocopter EC135',
  EC45: 'Eurocopter EC145',
  AS50: 'Eurocopter AS350 Écureuil',
  S76: 'Sikorsky S-76',
  S92: 'Sikorsky S-92',
};

/**
 * Returns formatted human-readable aircraft model name.
 */
export function getAircraftModelDisplay(code?: string): string {
  if (!code) return 'Standard Commercial';
  const clean = code.trim().toUpperCase();
  if (COMMON_AIRCRAFT_MODELS[clean]) {
    return `${COMMON_AIRCRAFT_MODELS[clean]} (${clean})`;
  }
  return clean;
}

/**
 * Resolves the true country of origin for any aircraft flight.
 * Never outputs raw technical tags like "Type: B752" or "Live ADS-B Receiver".
 */
export function getAircraftCountry(flight?: Partial<FlightState> | null): string {
  if (!flight) return 'United States';

  // 1. If originCountry already has a valid country name (and NOT "Type: ...", "Reg: ...", or generic receiver)
  const existing = (flight.originCountry || '').trim();
  if (
    existing &&
    !existing.startsWith('Type:') &&
    !existing.startsWith('Reg:') &&
    !/live ads-b|receiver|radar|unknown|n\/a/i.test(existing)
  ) {
    return existing;
  }

  const hex = (flight.icao24 || '').toUpperCase().trim();
  const hexNum = parseInt(hex, 16);

  // 2. ICAO 24-bit address allocation blocks (ICAO Annex 10)
  if (!isNaN(hexNum)) {
    if (hexNum >= 0xA00000 && hexNum <= 0xAFFFFF) return 'United States';
    if (hexNum >= 0xC00000 && hexNum <= 0xC3FFFF) return 'Canada';
    if (hexNum >= 0x400000 && hexNum <= 0x43FFFF) return 'United Kingdom';
    if (hexNum >= 0x380000 && hexNum <= 0x3BFFFF) return 'France';
    if (hexNum >= 0x3C0000 && hexNum <= 0x3FFFFF) return 'Germany';
    if (hexNum >= 0x300000 && hexNum <= 0x33FFFF) return 'Italy';
    if (hexNum >= 0x340000 && hexNum <= 0x37FFFF) return 'Spain';
    if (hexNum >= 0x440000 && hexNum <= 0x447FFF) return 'Austria';
    if (hexNum >= 0x448000 && hexNum <= 0x44FFFF) return 'Belgium';
    if (hexNum >= 0x450000 && hexNum <= 0x457FFF) return 'Bulgaria';
    if (hexNum >= 0x458000 && hexNum <= 0x45FFFF) return 'Denmark';
    if (hexNum >= 0x460000 && hexNum <= 0x467FFF) return 'Finland';
    if (hexNum >= 0x468000 && hexNum <= 0x46FFFF) return 'Greece';
    if (hexNum >= 0x470000 && hexNum <= 0x477FFF) return 'Hungary';
    if (hexNum >= 0x478000 && hexNum <= 0x47FFFF) return 'Norway';
    if (hexNum >= 0x480000 && hexNum <= 0x487FFF) return 'Netherlands';
    if (hexNum >= 0x488000 && hexNum <= 0x48FFFF) return 'Poland';
    if (hexNum >= 0x490000 && hexNum <= 0x497FFF) return 'Portugal';
    if (hexNum >= 0x498000 && hexNum <= 0x49FFFF) return 'Romania';
    if (hexNum >= 0x4A0000 && hexNum <= 0x4A7FFF) return 'Sweden';
    if (hexNum >= 0x4A8000 && hexNum <= 0x4AFFFF) return 'Switzerland';
    if (hexNum >= 0x4B0000 && hexNum <= 0x4B7FFF) return 'Turkey';
    if (hexNum >= 0x4C0000 && hexNum <= 0x4C7FFF) return 'Cyprus';
    if (hexNum >= 0x4C8000 && hexNum <= 0x4CFFFF) return 'Ireland';
    if (hexNum >= 0x4D0000 && hexNum <= 0x4D1FFF) return 'Iceland';
    if (hexNum >= 0x4D2000 && hexNum <= 0x4D3FFF) return 'Luxembourg';
    if (hexNum >= 0x100000 && hexNum <= 0x1FFFFF) return 'Russian Federation';
    if (hexNum >= 0x700000 && hexNum <= 0x700FFF) return 'Afghanistan';
    if (hexNum >= 0x710000 && hexNum <= 0x717FFF) return 'Saudi Arabia';
    if (hexNum >= 0x718000 && hexNum <= 0x71FFFF) return 'South Korea';
    if (hexNum >= 0x720000 && hexNum <= 0x727FFF) return 'North Korea';
    if (hexNum >= 0x728000 && hexNum <= 0x72FFFF) return 'Iraq';
    if (hexNum >= 0x730000 && hexNum <= 0x737FFF) return 'Iran';
    if (hexNum >= 0x738000 && hexNum <= 0x73FFFF) return 'Israel';
    if (hexNum >= 0x740000 && hexNum <= 0x747FFF) return 'Jordan';
    if (hexNum >= 0x750000 && hexNum <= 0x757FFF) return 'Malaysia';
    if (hexNum >= 0x758000 && hexNum <= 0x75FFFF) return 'Philippines';
    if (hexNum >= 0x760000 && hexNum <= 0x767FFF) return 'Singapore';
    if (hexNum >= 0x778000 && hexNum <= 0x77FFFF) return 'Taiwan';
    if (hexNum >= 0x780000 && hexNum <= 0x78FFFF) return 'China';
    if (hexNum >= 0x790000 && hexNum <= 0x797FFF) return 'Hong Kong';
    if (hexNum >= 0x7C0000 && hexNum <= 0x7C7FFF) return 'Australia';
    if (hexNum >= 0x800000 && hexNum <= 0x83FFFF) return 'India';
    if (hexNum >= 0x840000 && hexNum <= 0x87FFFF) return 'Japan';
    if (hexNum >= 0x880000 && hexNum <= 0x887FFF) return 'Thailand';
    if (hexNum >= 0x888000 && hexNum <= 0x88FFFF) return 'Vietnam';
    if (hexNum >= 0x894000 && hexNum <= 0x897FFF) return 'United Arab Emirates';
    if (hexNum >= 0x898000 && hexNum <= 0x89BFFF) return 'Qatar';
    if (hexNum >= 0xC80000 && hexNum <= 0xC87FFF) return 'New Zealand';
    if (hexNum >= 0xE00000 && hexNum <= 0xE3FFFF) return 'Argentina';
    if (hexNum >= 0xE40000 && hexNum <= 0xE7FFFF) return 'Brazil';
    if (hexNum >= 0xE80000 && hexNum <= 0xE80FFF) return 'Chile';
    if (hexNum >= 0x0D0000 && hexNum <= 0x0D7FFF) return 'Mexico';
    if (hexNum >= 0x0C0000 && hexNum <= 0x0C7FFF) return 'Colombia';
    if (hexNum >= 0x008000 && hexNum <= 0x00FFFF) return 'South Africa';
    if (hexNum >= 0x010000 && hexNum <= 0x017FFF) return 'Egypt';
  }

  // 3. Match by airline callsign prefix
  const callsign = (flight.callsign || '').toUpperCase().trim();
  if (/^(DAL|AAL|UAL|SWA|JBU|ASA|FFT|NKS|SKW|ENY|RPA|EDV|FDX|UPS|GTI|RCH|REACH|PAT|JAKE|TOPCAT|VIPER|HAWK)/.test(callsign)) {
    return 'United States';
  }
  if (/^(BAW|VIR|EZY|RYR|EXS|TCX)/.test(callsign)) return 'United Kingdom';
  if (/^(AFR|HOP|TVF|XLF)/.test(callsign)) return 'France';
  if (/^(DLH|GWI|EWG|CFG)/.test(callsign)) return 'Germany';
  if (/^(ACA|WJA|TSC|ROU)/.test(callsign)) return 'Canada';
  if (/^(QFA|VOZ|JST)/.test(callsign)) return 'Australia';
  if (/^(ANZ)/.test(callsign)) return 'New Zealand';
  if (/^(JAL|ANA|APJ|SFJ)/.test(callsign)) return 'Japan';
  if (/^(KAL|AAR|JJA|TWB)/.test(callsign)) return 'South Korea';
  if (/^(CCA|CES|CSN|CHH|CQH)/.test(callsign)) return 'China';
  if (/^(CPA|CRK|HKE)/.test(callsign)) return 'Hong Kong';
  if (/^(SIA|TGW)/.test(callsign)) return 'Singapore';
  if (/^(UAE|ETD|FDB)/.test(callsign)) return 'United Arab Emirates';
  if (/^(QTR)/.test(callsign)) return 'Qatar';
  if (/^(KLM)/.test(callsign)) return 'Netherlands';
  if (/^(IBE|VLG|AEA)/.test(callsign)) return 'Spain';
  if (/^(AZA|ITY|NOS)/.test(callsign)) return 'Italy';
  if (/^(SWR)/.test(callsign)) return 'Switzerland';
  if (/^(AUA)/.test(callsign)) return 'Austria';
  if (/^(BEL)/.test(callsign)) return 'Belgium';
  if (/^(SAS)/.test(callsign)) return 'Sweden';
  if (/^(FIN)/.test(callsign)) return 'Finland';
  if (/^(THY|PGT)/.test(callsign)) return 'Turkey';
  if (/^(AIC|IGO|VTI|SEJ)/.test(callsign)) return 'India';
  if (/^(AMX|VOI|VIV)/.test(callsign)) return 'Mexico';
  if (/^(TAM|GLO|AZU)/.test(callsign)) return 'Brazil';

  // 4. Coordinates fallback (if inside continental US bounds)
  if (typeof flight.latitude === 'number' && typeof flight.longitude === 'number') {
    const { latitude: lat, longitude: lon } = flight;
    if (lat >= 24 && lat <= 49.5 && lon >= -125 && lon <= -66.9) {
      return 'United States';
    }
    if (lat >= 49.5 && lat <= 70 && lon >= -141 && lon <= -52) {
      return 'Canada';
    }
  }

  return 'United States';
}

