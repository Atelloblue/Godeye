import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  Mic, 
  Volume2, 
  VolumeX, 
  Navigation,
  Loader2,
  GripHorizontal,
  X,
  Search,
  Check
} from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { 
  FlightState, 
  MaritimeVessel, 
  CCTVCamera, 
  GodsEyeEvent, 
  GbfsStation, 
  GtfsRtVehicle, 
  SelectedTarget, 
  LayerVisibility,
  LayerType,
  MapHighlight
} from '../types';
import { findGeoHighlight } from '../data/geoRegistry';
import { resolveHighlightWithShape, resolveLocationCoordinates, HIGHLIGHT_COLORS } from '../utils/geoBoundaries';
import { GLOBAL_LOCATIONS } from '../data/globalLocations';
import { fetchWikipediaSummary, WikiSummaryResult, extractThreeSentences } from '../utils/wikiApi';
import { fetchWalkingRoute, formatDistance, formatWalkingTime, WalkingRoute } from '../utils/walkingRouteApi';
import { getAircraftCountry, getAircraftModelDisplay } from '../utils/flightClassification';

interface VoiceCommandSparkProps {
  onTeleport: (lat: number, lon: number, zoom: number) => void;
  onSelectTarget: (target: SelectedTarget | null) => void;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onChangeBaseLayer: (layer: LayerType) => void;
  layers: LayerVisibility;
  flights: FlightState[];
  cameras: CCTVCamera[];
  vessels: MaritimeVessel[];
  events?: GodsEyeEvent[];
  gbfsStations: GbfsStation[];
  gtfsRtVehicles: GtfsRtVehicle[];
  activeHighlight?: MapHighlight | null;
  activeHighlights?: MapHighlight[];
  onHighlight?: (highlight: MapHighlight | null) => void;
  onAddHighlight?: (highlight: MapHighlight) => void;
  onClearHighlights?: (targetIdOrName?: string) => void;
  onSelectWikiIntel?: (wiki: WikiSummaryResult | null) => void;
  onSetWalkingRoute?: (route: WalkingRoute | null) => void;
}

function playTone(type: 'listening' | 'success' | 'close') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'listening') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export const VoiceCommandSpark: React.FC<VoiceCommandSparkProps> = ({
  onTeleport,
  onSelectTarget,
  onToggleLayer,
  onChangeBaseLayer,
  layers,
  flights,
  cameras,
  vessels,
  events = [],
  gbfsStations,
  gtfsRtVehicles,
  activeHighlight,
  activeHighlights = [],
  onHighlight,
  onAddHighlight,
  onClearHighlights,
  onSelectWikiIntel,
  onSetWalkingRoute,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isExecutingRef = useRef<boolean>(false);
  const feedbackTimeoutRef = useRef<any>(null);

  const showFeedback = useCallback((msg: string, durationMs: number = 4000) => {
    setFeedback(msg);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, durationMs);
  }, []);

  const speakVoiceResponse = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice error:', err);
    }
  }, [isMuted]);

  // Instant Local Command Execution (No Gemini API)
  const executeCommand = useCallback(async (rawCommand: string) => {
    const cmd = rawCommand.trim();
    if (!cmd || isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsProcessing(true);

    const clean = cmd
      .toLowerCase()
      .replace(/^hey\s+world[,\s]*/i, '')
      .replace(/^(please\s+|can\s+you\s+|could\s+you\s+)/i, '')
      .trim();

    // -------------------------------------------------------------
    // 00. PEDESTRIAN WALKING ROUTE COMMANDS (OSRM Walking Paths)
    // -------------------------------------------------------------
    if (/\b(clear|remove|close|delete|hide)\s*(the\s*)?(walking\s*)?(route|path|trail)\b/i.test(clean)) {
      if (onSetWalkingRoute) onSetWalkingRoute(null);
      playTone('success');
      speakVoiceResponse('Cleared walking path route.');
      showFeedback('Cleared Walking Path Route');
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    const isWalkingRouteIntent =
      /\b(walk|walking|foot|pedestrian|path|trail|route)\b/i.test(clean) &&
      /\b(from|between|to)\b/i.test(clean);

    if (isWalkingRouteIntent) {
      let fromPlace = '';
      let toPlace = '';

      const matchFromTo = clean.match(/(?:walk|walking|draw|route|path|walking path|walking route|footpath)\s*(?:from|between)?\s+(.+?)\s+(?:to|and)\s+(.+)/i);
      if (matchFromTo) {
        fromPlace = matchFromTo[1].replace(/^(from|the|a|an)\s+/gi, '').trim();
        toPlace = matchFromTo[2].replace(/^(to|the|a|an)\s+/gi, '').trim();
      } else {
        const matchTo = clean.match(/(?:walk|route|path)\s+(.+?)\s+to\s+(.+)/i);
        if (matchTo) {
          fromPlace = matchTo[1].replace(/^(from|the|a|an)\s+/gi, '').trim();
          toPlace = matchTo[2].replace(/^(the|a|an)\s+/gi, '').trim();
        }
      }

      if (fromPlace && toPlace) {
        showFeedback(`Calculating walking path: ${fromPlace} ➔ ${toPlace}...`);
        const { route, error } = await fetchWalkingRoute(fromPlace, toPlace);

        if (route && route.coordinates.length > 0) {
          if (onSetWalkingRoute) {
            onSetWalkingRoute(route);
          }
          playTone('success');
          const distanceStr = formatDistance(route.distanceMeters);
          const timeStr = formatWalkingTime(route.durationSeconds);
          speakVoiceResponse(`Found pedestrian walking path from ${route.fromName} to ${route.toName}. Total distance is ${distanceStr}, estimated ${timeStr}.`);
          showFeedback(`Walking Path: 🚶 ${route.fromName} ➔ ${route.toName} (${distanceStr})`);
          setIsProcessing(false);
          isExecutingRef.current = false;
          return;
        } else {
          speakVoiceResponse(`Could not find a walking path between ${fromPlace} and ${toPlace}.`);
          showFeedback(`Route Error: ${error || 'No pedestrian path found'}`, 5000);
          setIsProcessing(false);
          isExecutingRef.current = false;
          return;
        }
      }
    }

    // -------------------------------------------------------------
    // 0. WIKIPEDIA & KNOWLEDGE INFORMATION COMMANDS (Texas, Cities, Buildings, Entities)
    // -------------------------------------------------------------
    const isWikiIntent =
      /^(tell\s+me\s+about|what\s+is|who\s+is|where\s+is|describe|explain|info\s+on|information\s+on|about|wiki|wikipedia|lookup|details\s+on|summary\s+of)\b/i.test(clean) ||
      /\b(tell\s+me\s+about|what\s+is|who\s+is|describe|explain|wikipedia|wiki)\b/i.test(clean);

    if (isWikiIntent) {
      const topic = clean
        .replace(/^(tell\s+me\s+about|what\s+is|who\s+is|where\s+is|describe|explain|info\s+on|information\s+on|about|wiki|wikipedia|lookup|details\s+on|summary\s+of)\s+/gi, '')
        .replace(/^(the|a|an)\s+/gi, '')
        .trim();

      if (topic) {
        showFeedback(`Querying Wikipedia for "${topic}"...`);
        const wiki = await fetchWikipediaSummary(topic);

        if (wiki) {
          if (onSelectWikiIntel) {
            onSelectWikiIntel(wiki);
          }

          // Check if topic is a geographic location or building we can highlight and teleport to
          const resolvedShape = await resolveHighlightWithShape(wiki.title) || await resolveHighlightWithShape(topic);
          if (resolvedShape && (resolvedShape.lat !== 0 || resolvedShape.lon !== 0)) {
            if (onAddHighlight) {
              onAddHighlight(resolvedShape);
            } else if (onHighlight) {
              onHighlight(resolvedShape);
            }
            onTeleport(resolvedShape.lat, resolvedShape.lon, resolvedShape.zoom || 12);
          } else if (wiki.coordinates) {
            onTeleport(wiki.coordinates.lat, wiki.coordinates.lon, 12);
          }

          playTone('success');
          const threeSentences = extractThreeSentences(wiki.extract);
          speakVoiceResponse(threeSentences);
          showFeedback(`Wikipedia: 📚 ${wiki.title}`);
          setIsProcessing(false);
          isExecutingRef.current = false;
          return;
        }
      }
    }

    // -------------------------------------------------------------
    // 1. BASE MAP SWITCHING (Satellite, Dark Tactical, Topographic, Hybrid)
    // -------------------------------------------------------------
    if (/\b(switch|change|set|use)?\s*(to\s*)?(satellite|sat|imagery|space)\s*(map|view|basemap|mode)?\b/i.test(clean)) {
      onChangeBaseLayer('satellite');
      playTone('success');
      const voice = 'Base map changed to High-Resolution Satellite view.';
      speakVoiceResponse(voice);
      showFeedback('Base Map: Satellite Imagery (ESRI World Imagery)');
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    if (/\b(switch|change|set|use)?\s*(to\s*)?(dark|night|tactical|cyber|black)\s*(map|view|basemap|mode)?\b/i.test(clean)) {
      onChangeBaseLayer('dark_tactical');
      playTone('success');
      const voice = 'Base map changed to Dark Tactical mode.';
      speakVoiceResponse(voice);
      showFeedback('Base Map: Dark Tactical Vector (CartoDB Dark)');
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    if (/\b(switch|change|set|use)?\s*(to\s*)?(topographic|topo|terrain|relief|elevation|mountain)\s*(map|view|basemap|mode)?\b/i.test(clean)) {
      onChangeBaseLayer('topographic');
      playTone('success');
      const voice = 'Base map changed to Topographic terrain elevation.';
      speakVoiceResponse(voice);
      showFeedback('Base Map: Topographic & Shaded Relief');
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    if (/\b(switch|change|set|use)?\s*(to\s*)?(hybrid|street|streets|labels|roads)\s*(map|view|basemap|mode)?\b/i.test(clean)) {
      onChangeBaseLayer('hybrid');
      playTone('success');
      const voice = 'Base map changed to Satellite Hybrid with tactical street overlays.';
      speakVoiceResponse(voice);
      showFeedback('Base Map: Satellite Hybrid with Roads & Labels');
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // -------------------------------------------------------------
    // 2. DATA FEEDS & LAYERS TOGGLING
    // -------------------------------------------------------------
    // A. Flights Layer
    if (/\b(toggle|turn on|turn off|enable|disable|hide|show|activate|deactivate)?\s*(flights?|planes?|aircrafts?|airspace|ads-?b)\s*(layer|feed|data)?\b/i.test(clean) && !/\b(to|camera|city|route|ual|aal|swa|dlh)\b/i.test(clean)) {
      onToggleLayer('flights');
      playTone('success');
      const nextState = !layers.flights;
      const voice = `Real-time flights layer ${nextState ? 'activated' : 'deactivated'}.`;
      speakVoiceResponse(voice);
      showFeedback(`Layer: Aircraft Telemetry (ADS-B) [${nextState ? 'ON' : 'OFF'}]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // B. Traffic CCTV Cameras Layer
    if (/\b(toggle|turn on|turn off|enable|disable|hide|show|activate|deactivate)?\s*(cctv|cameras?|traffic cams?|webcams?|surveillance)\s*(layer|feed|data)?\b/i.test(clean) && !/\b(chicago|austin|london|california|ny|york|texas|houston|bc|i-)\b/i.test(clean)) {
      onToggleLayer('cctv');
      playTone('success');
      const nextState = !layers.cctv;
      const voice = `Traffic surveillance cameras ${nextState ? 'online' : 'hidden'}.`;
      speakVoiceResponse(voice);
      showFeedback(`Layer: Municipal CCTV Cameras [${nextState ? 'ON' : 'OFF'}]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // C. Maritime Vessels / AIS Layer
    if (/\b(toggle|turn on|turn off|enable|disable|hide|show|activate|deactivate)?\s*(maritime|ships?|boats?|vessels?|ais|tankers?|cargo)\s*(layer|feed|data)?\b/i.test(clean) && !/\b(to|mmsi)\b/i.test(clean)) {
      onToggleLayer('maritime');
      playTone('success');
      const nextState = !layers.maritime;
      const voice = `Maritime vessels and AIS layer ${nextState ? 'online' : 'disabled'}.`;
      speakVoiceResponse(voice);
      showFeedback(`Layer: Live Maritime AIS Vessels [${nextState ? 'ON' : 'OFF'}]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // D. Bikeshare / GBFS Layer
    if (/\b(toggle|turn on|turn off|enable|disable|hide|show|activate|deactivate)?\s*(bikes?|bikeshare|gbfs|docks?|citibike|divvy|bay wheels|capmetro)\s*(layer|feed|data)?\b/i.test(clean) && !/\b(to|chicago|austin|sf|nyc)\b/i.test(clean)) {
      onToggleLayer('gbfs');
      playTone('success');
      const nextState = !layers.gbfs;
      const voice = `Bikeshare and micromobility network ${nextState ? 'online' : 'disabled'}.`;
      speakVoiceResponse(voice);
      showFeedback(`Layer: GBFS Bikeshare Docks [${nextState ? 'ON' : 'OFF'}]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // E. Public Transit Fleets / GTFS-RT Layer
    if (/\b(toggle|turn on|turn off|enable|disable|hide|show|activate|deactivate)?\s*(transit|buses?|trains?|subway|metro|gtfs)\s*(layer|feed|data)?\b/i.test(clean)) {
      onToggleLayer('gtfsRt');
      playTone('success');
      const nextState = !layers.gtfsRt;
      const voice = `Municipal transit fleets ${nextState ? 'online' : 'hidden'}.`;
      speakVoiceResponse(voice);
      showFeedback(`Layer: Live GTFS-RT Public Transit Fleets [${nextState ? 'ON' : 'OFF'}]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // F. Wildfires / NASA FIRMS Layer
    if (/\b(toggle|turn on|turn off|enable|disable|hide|show|activate|deactivate)?\s*(wildfires?|forest fires?|thermal|burns?)\s*(layer|feed|data)?\b/i.test(clean)) {
      onToggleLayer('wildfires');
      playTone('success');
      const nextState = !layers.wildfires;
      const voice = `NASA FIRMS active wildfire hotspots ${nextState ? 'enabled' : 'hidden'}.`;
      speakVoiceResponse(voice);
      showFeedback(`Layer: NASA FIRMS Thermal Wildfires [${nextState ? 'ON' : 'OFF'}]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }



    // H. Weather / Clouds Layer
    if (/\b(toggle|turn on|turn off|enable|disable|hide|show|activate|deactivate)?\s*(weather|rain|clouds?|storms?|radar)\s*(layer|feed|data)?\b/i.test(clean)) {
      onToggleLayer('weather');
      playTone('success');
      const nextState = !layers.weather;
      const voice = `OpenWeather map layer ${nextState ? 'activated' : 'disabled'}.`;
      speakVoiceResponse(voice);
      showFeedback(`Layer: OpenWeather Precipitation [${nextState ? 'ON' : 'OFF'}]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // -------------------------------------------------------------
    // 3. TARGET RESOLUTION, HIGHLIGHTING & NAVIGATION
    // -------------------------------------------------------------

    // A. Check for Unhighlight / Clear Commands (Specific region or all)
    const isUnhighlightIntent = /^(unhighlight|un-highlight|remove\s+highlight|clear\s+highlight|delete\s+highlight|hide\s+highlight)\b/i.test(clean) ||
      /\b(unhighlight|un-highlight)\b/i.test(clean) ||
      /\b(remove|clear|delete|hide)\s+(the\s*)?(highlight|outline|shape)\s*(of|for|on)\b/i.test(clean) ||
      /\b(remove|clear|delete|hide)\s+(.+?)\s+(highlight|outline|shape)\b/i.test(clean);

    if (isUnhighlightIntent) {
      // Extract target region to unhighlight if present
      let regionTarget = clean
        .replace(/^(unhighlight|un-highlight|remove\s+highlight(\s+(for|of|on))?|clear\s+highlight(\s+(for|of|on))?|delete\s+highlight(\s+(for|of|on))?|hide\s+highlight(\s+(for|of|on))?)\s*/i, '')
        .replace(/\b(highlights?|outlines?|shapes?|overlays?|zones?|sectors?|all)\b/gi, '')
        .replace(/^(the|for|of|on|country|continent|region|city)\s+/i, '')
        .replace(/\s+(country|continent|region|city)$/i, '')
        .trim();

      // If general clear without a specific target region
      if (!regionTarget || regionTarget === 'all' || regionTarget === 'everything' || regionTarget === 'map') {
        onClearHighlights?.();
        onHighlight?.(null);
        playTone('success');
        speakVoiceResponse('Map highlights cleared.');
        showFeedback('Map Highlights Cleared');
        setIsProcessing(false);
        isExecutingRef.current = false;
        return;
      }

      // Check for match in active highlights or geo registry
      const matchingActive = activeHighlights.find((h) => {
        const q = regionTarget.toLowerCase();
        const hName = h.name.toLowerCase();
        const hId = h.id.toLowerCase();
        return hName.includes(q) || q.includes(hName) || hId.includes(q) || q.includes(hId);
      });

      const matchedGeo = findGeoHighlight(regionTarget);
      const displayTargetName = matchingActive?.name || matchedGeo?.name || (regionTarget.charAt(0).toUpperCase() + regionTarget.slice(1));

      onClearHighlights?.(displayTargetName);
      playTone('success');
      const voice = `I have unhighlighted ${displayTargetName}`;
      speakVoiceResponse(voice);
      showFeedback(`Unhighlighted: ${displayTargetName}`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // Fallback for general clear commands
    if (
      /\b(clear|remove|hide|delete|dismiss|close)\s*(the\s*)?(all\s*)?(highlights?|outlines?|overlays?|geo\s*highlight|zones?|sectors?)\b/i.test(clean) ||
      clean === 'clear' ||
      clean === 'clear all' ||
      clean === 'clear highlight' ||
      clean === 'clear highlights' ||
      clean === 'remove highlight' ||
      clean === 'remove highlights'
    ) {
      onClearHighlights?.();
      onHighlight?.(null);
      playTone('success');
      speakVoiceResponse('Map highlights cleared.');
      showFeedback('Map Highlights Cleared');
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    const targetQuery = clean
      .replace(/^(highlight|outline|trace|mark|overlay|where\s+is|locate|bring\s+me\s+to|take\s+me\s+to|go\s+to|teleport\s+to|fly\s+to|navigate\s+to|jump\s+to|show\s+me|find|track|zoom\s+to|look\s+at)\s+/i, '')
      .trim();

    if (!targetQuery) {
      showFeedback('Voice command recognized, but no destination or target was specified.');
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // B. Check Explicit Highlight Commands (Only when user explicitly asks to highlight / outline / trace / mark)
    const isHighlightIntent = /^(highlight|outline|trace|mark)\b/i.test(clean) ||
      /\b(highlight|outline|trace|mark)\s+(the\s*)?(country|continent|region|city|state|area|zone|waterway|ocean|strait|canal|building|structure|tower|landmark|footprint|shape)?/i.test(clean) ||
      /\b(highlight|outline|trace|mark)\b/i.test(clean);

    const geoQueryCandidate = targetQuery.replace(/\s+(continent|country|city|ocean|sea|strait|canal|waterway|region|zone|hotspot|layer|building|structure|footprint|tower|landmark)$/i, '').trim();

    if (isHighlightIntent) {
      const geoMatch = findGeoHighlight(geoQueryCandidate) || findGeoHighlight(targetQuery);
      // Resolve exact shape boundary (GeoJSON MultiPolygon / Polygon / Coordinates)
      const resolvedGeo = await resolveHighlightWithShape(geoQueryCandidate || targetQuery, geoMatch);

      if (resolvedGeo) {
        // Add highlight to collection (persisting previously highlighted countries)
        if (onAddHighlight) {
          onAddHighlight(resolvedGeo);
        } else if (onHighlight) {
          onHighlight(resolvedGeo);
        }

        // Navigate camera to sector
        onTeleport(resolvedGeo.lat, resolvedGeo.lon, resolvedGeo.zoom);

        // Contextually enable relevant data layers
        if (resolvedGeo.category === 'WATERWAY' || resolvedGeo.category === 'OCEAN') {
          if (!layers.maritime) onToggleLayer('maritime');
        }
        if (resolvedGeo.category === 'CITY') {
          if (/chicago|austin|texas|california|london|toronto|ontario|vancouver|helsinki|brisbane|singapore|hong kong|new york|nyc|houston|galveston/i.test(resolvedGeo.name.toLowerCase())) {
            if (!layers.cctv) onToggleLayer('cctv');
          }
          if (/austin|chicago|new york|nyc|san francisco|sf|london|paris|montreal|dc/i.test(resolvedGeo.name.toLowerCase())) {
            if (!layers.gbfs) onToggleLayer('gbfs');
          }
        }

        playTone('success');
        // Strictly only say "I have highlighted (object)"
        const voice = `I have highlighted ${resolvedGeo.name}`;
        speakVoiceResponse(voice);
        showFeedback(`Highlighted: ${resolvedGeo.flagOrIcon || '📍'} ${resolvedGeo.name}`);
        setIsProcessing(false);
        isExecutingRef.current = false;
        return;
      }
    }

    // C. Pure Navigation / Teleportation Commands (e.g. "bring me to...", "go to...", "take me to...") - NO HIGHLIGHTING
    // 1. Check Global Location & City Registry FIRST (exact match)
    if (GLOBAL_LOCATIONS[targetQuery] || GLOBAL_LOCATIONS[geoQueryCandidate]) {
      const loc = GLOBAL_LOCATIONS[targetQuery] || GLOBAL_LOCATIONS[geoQueryCandidate];
      if (/chicago|austin|texas|california|london|toronto|ontario|vancouver|helsinki|brisbane|singapore|hong kong|new york|nyc/i.test(targetQuery)) {
        if (!layers.cctv) onToggleLayer('cctv');
      }
      if (/austin|chicago|new york|nyc|san francisco|sf|london|paris|montreal|dc/i.test(targetQuery)) {
        if (!layers.gbfs) onToggleLayer('gbfs');
      }

      onTeleport(loc.lat, loc.lon, loc.zoom);
      playTone('success');
      const voice = `Navigating to ${loc.name}.`;
      speakVoiceResponse(voice);
      showFeedback(`Sector: ${loc.name} [${loc.lat.toFixed(4)}°, ${loc.lon.toFixed(4)}°]`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // 2. Check Geographic Registry for Navigation (without adding highlight shape)
    const geoNavMatch = findGeoHighlight(geoQueryCandidate) || findGeoHighlight(targetQuery);
    if (geoNavMatch) {
      if (geoNavMatch.category === 'WATERWAY' || geoNavMatch.category === 'OCEAN') {
        if (!layers.maritime) onToggleLayer('maritime');
      }
      onTeleport(geoNavMatch.lat, geoNavMatch.lon, geoNavMatch.zoom);
      playTone('success');
      const voice = `Navigating to ${geoNavMatch.name}.`;
      speakVoiceResponse(voice);
      showFeedback(`Sector: ${geoNavMatch.flagOrIcon || '📍'} ${geoNavMatch.name}`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // 3. Substring or multi-word match for locations (sorted by key length descending)
    const sortedLocKeys = Object.keys(GLOBAL_LOCATIONS).sort((a, b) => b.length - a.length);
    for (const key of sortedLocKeys) {
      const loc = GLOBAL_LOCATIONS[key];
      const matchesLocation = targetQuery === key || 
        targetQuery.startsWith(`${key} `) || 
        targetQuery.endsWith(` ${key}`) || 
        targetQuery.includes(` ${key} `) ||
        (key.length >= 4 && targetQuery.includes(key));

      if (matchesLocation) {
        if (/chicago|austin|texas|california|london|toronto|ontario|vancouver|helsinki|brisbane|singapore|hong kong|new york|nyc/i.test(key)) {
          if (!layers.cctv) onToggleLayer('cctv');
        }
        if (/austin|chicago|new york|nyc|san francisco|sf|london|paris|montreal|dc/i.test(key)) {
          if (!layers.gbfs) onToggleLayer('gbfs');
        }

        onTeleport(loc.lat, loc.lon, loc.zoom);
        playTone('success');
        const voice = `Navigating to ${loc.name}.`;
        speakVoiceResponse(voice);
        showFeedback(`Sector: ${loc.name} [${loc.lat.toFixed(4)}°, ${loc.lon.toFixed(4)}°]`);
        setIsProcessing(false);
        isExecutingRef.current = false;
        return;
      }
    }

    // 4. Check Dynamic Global Geocoder for ANY city, region, or landmark worldwide
    const isNavigationVerb = /^(bring\s+me\s+to|take\s+me\s+to|go\s+to|teleport\s+to|fly\s+to|navigate\s+to|jump\s+to|zoom\s+to|look\s+at|show\s+me|where\s+is|locate|visit)\b/i.test(clean);
    if (isNavigationVerb || targetQuery.length > 2) {
      const dynamicLoc = await resolveLocationCoordinates(targetQuery) || await resolveLocationCoordinates(geoQueryCandidate);
      if (dynamicLoc) {
        onTeleport(dynamicLoc.lat, dynamicLoc.lon, dynamicLoc.zoom);
        playTone('success');
        const voice = `Navigating to ${dynamicLoc.name}.`;
        speakVoiceResponse(voice);
        showFeedback(`Sector: 📍 ${dynamicLoc.name}`);
        setIsProcessing(false);
        isExecutingRef.current = false;
        return;
      }
    }

    // B. Check for CCTV Cameras (Explicit camera/surveillance/highway keywords)
    const camMatch = cameras.find(c => {
      const name = (c.name || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      const highway = (c.highway || '').toLowerCase();
      return name.includes(targetQuery) || city.includes(targetQuery) || highway.includes(targetQuery);
    });
    if (camMatch && (
      targetQuery.includes('cam') || 
      targetQuery.includes('cctv') || 
      targetQuery.includes('camera') || 
      targetQuery.includes('traffic') || 
      targetQuery.includes('bridge') || 
      targetQuery.includes('freeway') || 
      targetQuery.includes('i-') || 
      targetQuery.includes('highway') ||
      camMatch.name.toLowerCase() === targetQuery
    )) {
      if (!layers.cctv) onToggleLayer('cctv');
      onTeleport(camMatch.lat, camMatch.lon, 16);
      onSelectTarget({
        kind: 'CCTV',
        id: camMatch.id,
        title: camMatch.name,
        subtitle: `${camMatch.agency} • ${camMatch.highway} • ${camMatch.city}`,
        lat: camMatch.lat,
        lon: camMatch.lon,
        data: camMatch,
      });
      playTone('success');
      const voiceResp = isHighlightIntent 
        ? `I have highlighted ${camMatch.name}`
        : `Surveillance feed online for ${camMatch.name} in ${camMatch.city}.`;
      speakVoiceResponse(voiceResp);
      showFeedback(`CCTV Feed: ${camMatch.name} (${camMatch.city})`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // C. Check for Maritime Vessels
    const vesselMatch = vessels.find(v => {
      const vName = (v.name || '').toLowerCase();
      const vMmsi = String(v.mmsi || '');
      return (vName && vName === targetQuery) || (vMmsi && vMmsi === targetQuery) || (vName.length > 3 && targetQuery.includes(vName));
    });
    if (vesselMatch && (
      targetQuery.includes('ship') || 
      targetQuery.includes('boat') || 
      targetQuery.includes('vessel') || 
      targetQuery.includes('tanker') || 
      targetQuery.includes('cargo') || 
      targetQuery.includes('mmsi') ||
      vesselMatch.name?.toLowerCase() === targetQuery
    )) {
      if (!layers.maritime) onToggleLayer('maritime');
      onTeleport(vesselMatch.lat, vesselMatch.lon, 13);
      onSelectTarget({
        kind: 'VESSEL',
        id: String(vesselMatch.mmsi),
        title: vesselMatch.name || `Vessel MMSI ${vesselMatch.mmsi}`,
        subtitle: `${vesselMatch.type} • Destination: ${vesselMatch.destination || 'Unspecified'}`,
        lat: vesselMatch.lat,
        lon: vesselMatch.lon,
        data: vesselMatch,
      });
      playTone('success');
      const voiceResp = isHighlightIntent
        ? `I have highlighted ${vesselMatch.name || vesselMatch.mmsi}`
        : `Tracking vessel ${vesselMatch.name || vesselMatch.mmsi}. Speed: ${vesselMatch.sogKnots} knots.`;
      speakVoiceResponse(voiceResp);
      showFeedback(`Vessel Locked: ${vesselMatch.name || vesselMatch.mmsi}`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // D. Check for Bikeshare / GBFS
    const bikeMatch = gbfsStations.find(s => {
      const sName = (s.name || '').toLowerCase();
      const sysName = (s.systemName || '').toLowerCase();
      return (sName && sName === targetQuery) || (sName.length > 4 && targetQuery.includes(sName)) || sysName.includes(targetQuery);
    });
    if (bikeMatch && (
      targetQuery.includes('bike') || 
      targetQuery.includes('dock') || 
      targetQuery.includes('station') || 
      targetQuery.includes('citibike') || 
      targetQuery.includes('divvy') || 
      targetQuery.includes('capmetro') ||
      bikeMatch.name.toLowerCase() === targetQuery
    )) {
      if (!layers.gbfs) onToggleLayer('gbfs');
      onTeleport(bikeMatch.lat, bikeMatch.lon, 16);
      onSelectTarget({
        kind: 'GBFS',
        id: bikeMatch.id,
        title: bikeMatch.name,
        subtitle: `${bikeMatch.systemName} • ${bikeMatch.numBikesAvailable} Bikes • ${bikeMatch.numDocksAvailable} Docks Open`,
        lat: bikeMatch.lat,
        lon: bikeMatch.lon,
        data: bikeMatch,
      });
      playTone('success');
      const voiceResp = isHighlightIntent
        ? `I have highlighted ${bikeMatch.name}`
        : `Arrived at ${bikeMatch.name} station. ${bikeMatch.numBikesAvailable} bikes and ${bikeMatch.numDocksAvailable} docks available.`;
      speakVoiceResponse(voiceResp);
      showFeedback(`GBFS Dock: ${bikeMatch.name}`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // E. Check for Flights by Callsign or ICAO
    // Clean target query for flight matching (e.g., "flight UAL123" -> "ual123")
    const flightQuery = targetQuery.replace(/^(flight|plane|aircraft)\s+/i, '').trim();
    const isExplicitFlightCommand = /\b(flight|plane|aircraft|icao|callsign)\b/i.test(clean);

    const flightMatch = flights.find(f => {
      const cs = (f.callsign || '').toLowerCase().trim();
      const icao = (f.icao24 || '').toLowerCase().trim();
      if (!cs && !icao) return false;

      // Exact match with query or cleaned query
      if (cs === targetQuery || cs === flightQuery || icao === targetQuery || icao === flightQuery) {
        return true;
      }

      // If callsign is at least 3 characters and user explicitly spoke flight/callsign OR query contains complete callsign
      if (cs.length >= 3) {
        if (targetQuery.includes(cs) && (isExplicitFlightCommand || cs.length >= 4)) {
          return true;
        }
      }

      // ICAO match (6-character hex code)
      if (icao.length === 6 && (targetQuery === icao || flightQuery === icao)) {
        return true;
      }

      return false;
    });

    if (flightMatch) {
      if (!layers.flights) onToggleLayer('flights');
      onTeleport(flightMatch.latitude, flightMatch.longitude, 13);
      onSelectTarget({
        kind: 'FLIGHT',
        id: flightMatch.icao24,
        title: flightMatch.callsign || flightMatch.icao24.toUpperCase(),
        subtitle: `${getAircraftModelDisplay(flightMatch.aircraftModel)} • ${getAircraftCountry(flightMatch)}`,
        lat: flightMatch.latitude,
        lon: flightMatch.longitude,
        data: flightMatch,
      });
      playTone('success');
      const countryName = getAircraftCountry(flightMatch);
      const voiceResp = isHighlightIntent
        ? `I have highlighted ${flightMatch.callsign || flightMatch.icao24}`
        : `Acquired flight ${flightMatch.callsign || flightMatch.icao24} registered in ${countryName}. Locking radar.`;
      speakVoiceResponse(voiceResp);
      showFeedback(`Target Acquired: Flight ${flightMatch.callsign || flightMatch.icao24}`);
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // Default Fallback
    showFeedback(`Command recognized: "${clean}". No matching entity found.`);
    setIsProcessing(false);
    isExecutingRef.current = false;
  }, [
    flights,
    cameras,
    vessels,
    events,
    gbfsStations,
    gtfsRtVehicles,
    layers,
    onTeleport,
    onSelectTarget,
    onToggleLayer,
    onChangeBaseLayer,
    speakVoiceResponse,
    showFeedback,
  ]);

  // Click handler to toggle listening
  const handleToggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showFeedback('Voice recognition not supported in this browser.', 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    // Start recognition session on user click
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        playTone('listening');
        showFeedback('Listening... Say: "Tokyo", "Dark map", "Toggle flights", "Chicago cams"...', 5000);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showFeedback('Microphone permission blocked. Please allow mic access in browser.', 4000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed', err);
      setIsListening(false);
    }
  };

  // When speech transcript completes and listening ends, execute the command
  useEffect(() => {
    if (!isListening && transcript.trim().length > 1) {
      const speech = transcript.trim();
      setTranscript('');
      executeCommand(speech);
    }
  }, [isListening, transcript, executeCommand]);

  const { style: dragStyle, dragProps } = useDraggable({ requireHandle: false });

  return (
    <>
      {/* Floating Assistant Overlay Button on the Map */}
      <div 
        style={dragStyle}
        {...dragProps}
        className="absolute bottom-4 sm:bottom-6 right-3 sm:right-6 z-30 flex flex-col items-end gap-2.5 pointer-events-auto select-none touch-none cursor-grab active:cursor-grabbing"
      >
        {/* Dynamic Feedback or Transcript Balloon */}
        {(isListening || isProcessing || transcript || feedback) && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1c1c1c]/95 border border-[#383838] text-zinc-200 shadow-2xl backdrop-blur-md text-xs font-sans animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-xs sm:max-w-md">
            {isListening ? (
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 relative shrink-0" />
            ) : isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 text-zinc-300 animate-spin shrink-0" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            )}

            <div className="flex-1 truncate">
              {transcript ? (
                <span className="italic text-zinc-100">"{transcript}"</span>
              ) : isListening ? (
                <span>Listening for command...</span>
              ) : (
                <span>{feedback}</span>
              )}
            </div>

            {/* Mute Voice Confirmations Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-lg hover:bg-[#2c2c2c] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute voice confirmations' : 'Mute voice confirmations'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* The Simple Spark Icon Button Overlay */}
        <div className="relative group">
          <button
            onClick={handleToggleListening}
            className={`relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full shadow-xl transition-all duration-200 cursor-pointer border ${
              isListening 
                ? 'bg-[#2a2a2a] text-zinc-100 border-[#555555] scale-105' 
                : isProcessing
                  ? 'bg-[#222222] text-zinc-300 border-[#383838]'
                  : 'bg-[#1c1c1c]/95 hover:bg-[#282828] text-zinc-200 hover:text-white border-[#383838] hover:border-[#4d4d4d] hover:scale-105 shadow-black/80 backdrop-blur-md'
            }`}
            title={isListening ? 'Listening... Click to stop' : 'Voice Assistant: Click and say "Tokyo", "Dark map", "Toggle flights", "Chicago cams"...'}
            aria-label="Map Voice Assistant"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            ) : isListening ? (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-100" />
            ) : (
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-12 text-zinc-300" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
