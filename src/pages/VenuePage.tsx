import React from 'react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { VisualAtmosphere } from '../components/visual/VisualAtmosphere';
import { MapPin, Navigation, Bus, Train, HelpCircle } from 'lucide-react';

export const VenuePage: React.FC = () => {
  const eventZones = [
    { name: 'Ground Floor Quadrangle', purpose: 'Registration Desks & QR Scan Entry Gate', status: '08:00 AM' },
    { name: 'Main Auditorium', purpose: 'Inaugural, Quiz Finals & Valedictory', status: '09:30 AM' },
    { name: 'ECE Block Floor 2', purpose: 'Circuitrix Debugging Lab & DSP Hackathon', status: '10:30 AM' },
    { name: 'ECE Block Floor 3', purpose: 'Paperionix Seminar Halls & VLSI EDA Lab', status: '10:00 AM' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Level 1 & 2 Architectural Map Web Grid Atmosphere */}
      <VisualAtmosphere
        environmentKey="venue"
        badgeText="CAMPUS LOCATION & MAP"
        title="VENUE & CAMPUS GUIDE"
        subtitle="SRM Valliammai Engineering College • Kattankulathur, Chengalpattu – 603203."
        height="compact"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Map Environment Card */}
            <div className="glass-panel-glow rounded-2xl p-6 border border-[#b91c1c]/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#b91c1c]" /> SRM Valliammai Campus
                </h3>
                <Badge variant="crimson">26 SEPT ACTIVE</Badge>
              </div>
              <div className="w-full h-72 rounded-xl bg-[#0a0c10] border border-[#b91c1c]/40 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <img
                  src="/images/venue/venue-map.jpg"
                  alt="SRM Valliammai Architectural Map Grid"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 brightness-90 contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-[#0a0c10]/80" />
                <MapPin className="w-10 h-10 text-[#b91c1c] mb-3 animate-bounce relative z-10" />
                <h4 className="text-base font-bold text-white font-mono relative z-10">SRM Valliammai ECE Block</h4>
                <p className="text-xs text-slate-300 mt-1 relative z-10">
                  Kattankulathur (Potheri Railway Station • GST Road NH-45)
                </p>
                <a
                  href="https://maps.google.com/?q=SRM+Valliammai+Engineering+College"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 relative z-10"
                >
                  <Button variant="glow" size="sm" icon={<Navigation className="w-4 h-4" />}>
                    Open Google Maps
                  </Button>
                </a>
              </div>
            </div>

            {/* Event Zones */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white font-mono">Designated Event Areas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventZones.map((z, idx) => (
                  <div key={idx} className="glass-panel p-4 rounded-xl border border-[#b91c1c]/30 hover:border-[#b91c1c]/60 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm font-mono">{z.name}</h4>
                      <span className="text-[10px] font-mono text-[#b91c1c] font-semibold">{z.status}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-light">{z.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="glass-panel-glow p-5 rounded-xl space-y-4 border border-[#b91c1c]/30">
              <h3 className="text-base font-bold text-white font-mono">How to Reach Us</h3>
              <div className="space-y-4 text-xs text-slate-300 font-light">
                <div className="flex items-start gap-3">
                  <Train className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-mono">By Suburban Train:</strong>
                    Tambaram–Chengalpattu local — alight at <strong className="text-[#b91c1c]">Potheri</strong> (2-min walk).
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Bus className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-mono">By MTC Bus:</strong>
                    Any bus via GST Road stops at <strong className="text-[#b91c1c]">Potheri BS</strong>.
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-[#b91c1c]/30 space-y-2">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#b91c1c]" /> Help Desk
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Visit the Registration Help Desk at the Ground Floor Quadrangle for assistance.
              </p>
              <div className="text-xs font-mono text-[#b91c1c] font-bold pt-1">+91 98401 23456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
