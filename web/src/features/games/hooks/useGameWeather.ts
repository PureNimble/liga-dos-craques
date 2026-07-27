import { useQuery } from '@tanstack/react-query';
import type { ComponentType, SVGProps } from 'react';
import { CloudIcon, CloudRainIcon, CloudSunIcon, SunIcon } from '@/shared/components/ui/icons';

const LOCATIONS_URL = 'https://api.ipma.pt/open-data/distrits-islands.json';

interface IpmaLocation {
  globalIdLocal: number;
  latitude: string;
  longitude: string;
}

interface IpmaForecastDay {
  forecastDate: string;
  tMin: string;
  tMax: string;
  idWeatherType: number;
}

/** A game's kickoff-day forecast at its place. */
export interface GameWeather {
  tMax: number;
  weatherType: number;
}

const lisbonDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Lisbon',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IPMA request failed: ${res.status}`);
  return res.json();
}

function nearestLocation(locations: IpmaLocation[], lat: number, lon: number): IpmaLocation {
  return locations.reduce((closest, loc) =>
    (Number(loc.latitude) - lat) ** 2 + (Number(loc.longitude) - lon) ** 2 <
    (Number(closest.latitude) - lat) ** 2 + (Number(closest.longitude) - lon) ** 2
      ? loc
      : closest,
  );
}

/**
 * Forecast for a game's kickoff day at its place, from IPMA (Portuguese weather service, open
 * data, no key needed). IPMA only forecasts ~5 days ahead, so this resolves to `null` outside
 * that window or when the game has no linked place.
 */
export function useGameWeather(
  place: { latitude: number; longitude: number } | null | undefined,
  scheduledAtISO: string,
) {
  const forecastDate = lisbonDateFmt.format(new Date(scheduledAtISO));
  return useQuery({
    queryKey: ['game_weather', place?.latitude, place?.longitude, forecastDate],
    enabled: Boolean(place),
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<GameWeather | null> => {
      const { data: locations } = await fetchJson<{ data: IpmaLocation[] }>(LOCATIONS_URL);
      const nearest = nearestLocation(locations, place!.latitude, place!.longitude);
      const { data: days } = await fetchJson<{ data: IpmaForecastDay[] }>(
        `https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/${nearest.globalIdLocal}.json`,
      );
      const day = days.find((d) => d.forecastDate === forecastDate);
      return day ? { tMax: Number(day.tMax), weatherType: day.idWeatherType } : null;
    },
  });
}

/** Icon for an IPMA `idWeatherType` code, bucketed into sun/partly-cloudy/cloudy/rain. */
export function weatherIcon(idWeatherType: number): ComponentType<SVGProps<SVGSVGElement>> {
  if (idWeatherType === 1) return SunIcon;
  if ([2, 3, 25].includes(idWeatherType)) return CloudSunIcon;
  if ([4, 5, 16, 17, 22, 24, 26, 27].includes(idWeatherType)) return CloudIcon;
  return CloudRainIcon;
}
