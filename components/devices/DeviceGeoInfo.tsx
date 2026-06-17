"use client";

import { Globe, MapPin, Monitor } from "lucide-react";

interface Props {
  country?: string;
  city?: string;
  region?: string;
  isp?: string;
  os?: string;
  browser?: string;
  deviceType?: string;
}

export function DeviceGeoInfo({ country, city, region, isp, os, browser, deviceType }: Props) {
  const sections = [
    {
      title: "Location",
      icon: Globe,
      color: "text-blue-400 bg-blue-500/10",
      items: [
        { label: "Country", value: country },
        { label: "City", value: city },
        { label: "Region", value: region },
      ],
    },
    {
      title: "Network",
      icon: MapPin,
      color: "text-green-400 bg-green-500/10",
      items: [
        { label: "ISP", value: isp },
      ],
    },
    {
      title: "Device Info",
      icon: Monitor,
      color: "text-purple-400 bg-purple-500/10",
      items: [
        { label: "OS", value: os },
        { label: "Browser", value: browser },
        { label: "Device Type", value: deviceType },
      ],
    },
  ];

  const hasData = country || city || region || isp || os || browser || deviceType;

  if (!hasData) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">No geo/device info available</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Globe size={18} className="text-blue-400" />
        <h3 className="font-semibold">Geo &amp; Device Info</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-2 flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${section.color}`}>
                <section.icon size={14} />
              </div>
              <span className="text-xs font-medium text-zinc-400">{section.title}</span>
            </div>
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <span className="text-xs font-medium text-zinc-200">{item.value || "-"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
