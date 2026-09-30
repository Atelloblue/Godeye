import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Sliders, 
  Key, 
  Check, 
  RotateCcw,
  Sparkles,
  Ship,
  Car,
  Clock,
  GripHorizontal,
  ChevronLeft,
  ChevronRight,
  Plane,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'feeds' | 'telemetry'>('feeds');
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showAisKey, setShowAisKey] = useState<boolean>(false);
  const [showTomTomKey, setShowTomTomKey] = useState<boolean>(false);

  const { style: dragStyle, dragProps } = useDraggable();

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setSavedSuccess(false);
      setIsCollapsed(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 350);
  };

  const handleResetDefaults = () => {
    const defaults: AppSettings = {
      flightRangeKm: 250,
      aisStreamApiKey: '',
      tomTomApiKey: '',
      tomTomFlowStyle: 'relative',
      showTrafficIncidents: true,
      pollIntervalSec: 3,
      altitudeUnit: 'feet',
      speedUnit: 'knots',
      maxPlanesOnMap: 250,
    };
    setFormData(defaults);
  };

  return (
    <div 
      style={dragStyle}
      {...dragProps}
      className={`fixed top-14 sm:top-16 right-2 sm:right-4 z-40 transition-all duration-200 select-none max-w-[calc(100vw-1rem)] ${
        isCollapsed ? 'w-10' : 'w-80 sm:w-96'
      }`}
    >
      <div className="bg-[#1e1e1e]/95 border border-[#2e2e2e] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-zinc-200">
        
        {/* Header - Drag Handle (Matches LayerControlPanel.tsx) */}
        <div 
          data-drag-handle
          className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#2a2a2a] cursor-grab active:cursor-grabbing touch-none select-none bg-[#1a1a1a]/60"
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-medium text-sm text-zinc-100">
              <GripHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
              <SettingsIcon className="w-4 h-4 text-zinc-400" />
              <span>System Preferences</span>
            </div>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-full hover:bg-[#2c2c2c] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand settings' : 'Collapse settings'}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {!isCollapsed && (
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-[#2c2c2c] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Material 3 Segmented Tab Switcher */}
            <div className="p-3 border-b border-[#262626] bg-[#161616]/80">
              <div className="grid grid-cols-2 gap-1 bg-[#121212] p-1 rounded-xl border border-[#282828]">
                <button
                  type="button"
                  onClick={() => setActiveTab('feeds')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'feeds'
                      ? 'bg-[#2a2a2a] text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Ship className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Data Sources</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('telemetry')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'telemetry'
                      ? 'bg-[#2a2a2a] text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Telemetry & Units</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-12rem)] overflow-y-auto text-xs text-zinc-300">
              
              {/* TAB 1: DATA SOURCES & KEYS */}
              {activeTab === 'feeds' && (
                <div className="space-y-3">
                  
                  {/* Flight Viewport Query Radius */}
                  <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                        <Plane className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Flight Query Bounding Box</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-300">
                        {formData.flightRangeKm === 0 ? 'Global' : `${formData.flightRangeKm} km`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#282828]">
                      {[
                        { label: '100km', value: 100 },
                        { label: '250km', value: 250 },
                        { label: '500km', value: 500 },
                        { label: 'Global', value: 0 },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, flightRangeKm: preset.value })}
                          className={`py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                            formData.flightRangeKm === preset.value
                              ? 'bg-[#2a2a2a] text-white shadow-sm font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Traffic Configuration (TomTom) */}
                  <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                        <Car className="w-3.5 h-3.5 text-zinc-400" />
                        <span>TomTom Vehicle Traffic</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        formData.tomTomApiKey?.trim()
                          ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                          : 'bg-zinc-900/80 text-zinc-500 border-zinc-800'
                      }`}>
                        {formData.tomTomApiKey?.trim() ? 'KEY SET' : 'NO KEY'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-zinc-400">
                          API Key
                        </label>
                        <a
                          href="https://developer.tomtom.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 underline transition-colors"
                        >
                          Get Free Key
                        </a>
                      </div>
                      
                      <div className="relative">
                        <Key className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showTomTomKey ? "text" : "password"}
                          value={formData.tomTomApiKey}
                          onChange={(e) => setFormData({ ...formData, tomTomApiKey: e.target.value })}
                          placeholder="Paste TomTom API Key..."
                          className="w-full bg-[#181818] border border-[#2c2c2c] focus:border-zinc-400 rounded-xl pl-8 pr-8 py-1.5 text-zinc-100 placeholder-zinc-500 text-[11px] focus:outline-none transition-colors font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTomTomKey(!showTomTomKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          {showTomTomKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Flow Mode Selector */}
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Flow Render Mode
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#282828]">
                        {[
                          { id: 'relative', label: 'Relative' },
                          { id: 'absolute', label: 'Absolute' },
                          { id: 'relative-delay', label: 'Delay' },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, tomTomFlowStyle: mode.id as any })}
                            className={`py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${
                              formData.tomTomFlowStyle === mode.id
                                ? 'bg-[#2a2a2a] text-white font-semibold shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Incidents Switch */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#222222]">
                      <span className="text-[11px] text-zinc-300">Show Traffic Incidents</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showTrafficIncidents: !formData.showTrafficIncidents })}
                        className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                          formData.showTrafficIncidents ? 'bg-zinc-200' : 'bg-zinc-700'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                            formData.showTrafficIncidents ? 'left-4.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Maritime AIS Stream Key */}
                  <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                        <Ship className="w-3.5 h-3.5 text-zinc-400" />
                        <span>AISStream Maritime Key</span>
                      </div>
                      <a
                        href="https://aisstream.io"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 underline transition-colors"
                      >
                        aisstream.io
                      </a>
                    </div>

                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showAisKey ? "text" : "password"}
                        value={formData.aisStreamApiKey}
                        onChange={(e) => setFormData({ ...formData, aisStreamApiKey: e.target.value })}
                        placeholder="Enter AISStream API Key..."
                        className="w-full bg-[#181818] border border-[#2c2c2c] focus:border-zinc-400 rounded-xl pl-8 pr-8 py-1.5 text-zinc-100 placeholder-zinc-500 text-[11px] focus:outline-none transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAisKey(!showAisKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showAisKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: TELEMETRY & UNITS */}
              {activeTab === 'telemetry' && (
                <div className="space-y-3">
                  
                  {/* Refresh Rate */}
                  <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Telemetry Refresh Rate</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#282828]">
                      {[
                        { label: '2s', value: 2 },
                        { label: '3s', value: 3 },
                        { label: '5s', value: 5 },
                        { label: '10s', value: 10 },
                      ].map((rate) => (
                        <button
                          key={rate.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, pollIntervalSec: rate.value })}
                          className={`py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${
                            formData.pollIntervalSec === rate.value
                              ? 'bg-[#2a2a2a] text-white font-semibold shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {rate.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Units Selection */}
                  <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl space-y-2.5">
                    <div className="text-zinc-200 font-medium">
                      Telemetry Units
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Altitude
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#282828]">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, altitudeUnit: 'feet' })}
                            className={`py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer ${
                              formData.altitudeUnit === 'feet'
                                ? 'bg-[#2a2a2a] text-white font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Feet / FL
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, altitudeUnit: 'meters' })}
                            className={`py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer ${
                              formData.altitudeUnit === 'meters'
                                ? 'bg-[#2a2a2a] text-white font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Meters
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Velocity / Speed
                        </label>
                        <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#282828]">
                          {[
                            { label: 'Knots', value: 'knots' },
                            { label: 'km/h', value: 'kmh' },
                            { label: 'mph', value: 'mph' },
                          ].map((u) => (
                            <button
                              key={u.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, speedUnit: u.value as any })}
                              className={`py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer ${
                                formData.speedUnit === u.value
                                  ? 'bg-[#2a2a2a] text-white font-semibold'
                                  : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {u.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Density Cap */}
                  <div className="p-3 bg-[#141414] border border-[#282828] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-200 font-medium">Visible Target Cap</span>
                      <span className="font-mono text-zinc-300 text-[11px]">
                        {formData.maxPlanesOnMap} max
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#282828]">
                      {[100, 250, 450, 800].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => setFormData({ ...formData, maxPlanesOnMap: cap })}
                          className={`py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer ${
                            formData.maxPlanesOnMap === cap
                              ? 'bg-[#2a2a2a] text-white font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer Action Bar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-[#2a2a2a] bg-[#1a1a1a]/60">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#252525] transition-colors cursor-pointer"
                title="Reset settings to defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 border border-[#353535] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-colors cursor-pointer shadow-sm"
                >
                  {savedSuccess ? 'Applied' : 'Apply'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
