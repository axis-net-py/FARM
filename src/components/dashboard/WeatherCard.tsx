"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  MapPin,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";

const STRINGS = {
  pt: {
    loading: "Buscando dados climáticos (GPS)...",
    errorLoad: "Não foi possível carregar a previsão.",
    yourLocation: "Sua Localização (GPS)",
    humidity: "Umidade",
    wind: "Ventos",
    rain: "Chuva",
    rain30d: "Chuva (30d)",
    weatherClear: "Céu Limpo",
    weatherPartlyCloudy: "Parcialmente Nublado",
    weatherFog: "Nevoeiro",
    weatherDrizzle: "Chuvisco",
    weatherRain: "Chuva",
    weatherShowers: "Pancadas de Chuva",
    weatherStorm: "Tempestade",
    weatherCloudy: "Nublado",
    adviceRainTitle: "Alerta de Chuva",
    adviceRainMsg: "Suspensão de colheita e pulverização recomendada. Evite compactação do solo com maquinário pesado.",
    adviceWindTitle: "Vento Forte Detectado",
    adviceWindMsg: "Condição imprópria para aplicação de defensivos agrícolas devido ao alto risco de deriva. Adie a atividade.",
    adviceHeatTitle: "Calor Extremo",
    adviceHeatMsg: "Evite pulverizar sob sol forte e baixa umidade. O produto evapora antes de penetrar na cultura.",
    adviceIdealTitle: "Condições Ideais",
    adviceIdealMsg: "Período favorável para colheita, tratos culturais e pulverização. Aproveite as condições climáticas.",
    weekdayLocale: "pt-BR",
  },
  es: {
    loading: "Buscando datos climáticos (GPS)...",
    errorLoad: "No fue posible cargar el pronóstico.",
    yourLocation: "Su Ubicación (GPS)",
    humidity: "Humedad",
    wind: "Vientos",
    rain: "Lluvia",
    rain30d: "Lluvia (30d)",
    weatherClear: "Cielo Despejado",
    weatherPartlyCloudy: "Parcialmente Nublado",
    weatherFog: "Neblina",
    weatherDrizzle: "Llovizna",
    weatherRain: "Lluvia",
    weatherShowers: "Chubascos",
    weatherStorm: "Tormenta",
    weatherCloudy: "Nublado",
    adviceRainTitle: "Alerta de Lluvia",
    adviceRainMsg: "Se recomienda suspender la cosecha y la pulverización. Evite compactar el suelo con maquinaria pesada.",
    adviceWindTitle: "Viento Fuerte Detectado",
    adviceWindMsg: "Condición inadecuada para la aplicación de agroquímicos por el alto riesgo de deriva. Posponga la actividad.",
    adviceHeatTitle: "Calor Extremo",
    adviceHeatMsg: "Evite pulverizar bajo sol fuerte y baja humedad. El producto se evapora antes de penetrar en el cultivo.",
    adviceIdealTitle: "Condiciones Ideales",
    adviceIdealMsg: "Período favorable para la cosecha, las labores culturales y la pulverización. Aproveche las condiciones climáticas.",
    weekdayLocale: "es-PY",
  },
} as const;

interface WeatherData {
  temp: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  locationName: string;
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
}

export function WeatherCard() {
  const { language } = useLanguage();
  const s = STRINGS[language];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [rain30d, setRain30d] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  // Default coordinate: Alto Paraná (Paraguay agricultural region)
  const defaultLat = -25.5061;
  const defaultLon = -54.6112;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Fallback to default agricultural region if user denies
          setCoords({ lat: defaultLat, lon: defaultLon });
        }
      );
    } else {
      setCoords({ lat: defaultLat, lon: defaultLon });
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    const { lat, lon } = coords;

    async function fetchWeather() {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&forecast_days=5&timezone=auto`
        );
        if (!res.ok) throw new Error("Falha ao carregar clima");
        const data = await res.json();

        if (data.daily) {
          const days: ForecastDay[] = data.daily.time.map((date: string, i: number) => ({
            date,
            tempMax: data.daily.temperature_2m_max[i],
            tempMin: data.daily.temperature_2m_min[i],
            precipitation: data.daily.precipitation_sum[i],
            weatherCode: data.daily.weather_code[i],
          }));
          setForecast(days);
        }

        // Histórico de chuva dos últimos 30 dias (API de arquivo, gratuita)
        try {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 30);
          const fmt = (d: Date) => d.toISOString().split("T")[0];
          const archiveRes = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${fmt(start)}&end_date=${fmt(end)}&daily=precipitation_sum&timezone=auto`
          );
          if (archiveRes.ok) {
            const archiveData = await archiveRes.json();
            const sum = (archiveData.daily?.precipitation_sum ?? []).reduce(
              (acc: number, v: number | null) => acc + (v ?? 0),
              0
            );
            setRain30d(sum);
          }
        } catch (archiveErr) {
          console.error("Falha ao buscar histórico de chuva:", archiveErr);
        }

        // Reverse geocoding using Nominatim (OpenStreetMap)
        let locationName = lat === defaultLat ? "Alto Paraná" : s.yourLocation;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt,es,en`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address;
            const cityName = addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.county || addr?.state;
            if (cityName) {
              locationName = cityName;
            }
          }
        } catch (geoErr) {
          console.error("Geocoding failed, falling back to coords:", geoErr);
        }

        const current = data.current;
        setWeather({
          temp: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          precipitation: current.precipitation,
          windSpeed: current.wind_speed_10m,
          weatherCode: current.weather_code,
          locationName: locationName,
        });
      } catch (err: any) {
        setError(err.message || "Erro de conexão");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [coords]);

  const getWeatherIcon = (code: number) => {
    if (code >= 51 && code <= 99) return <CloudRain className="w-10 h-10 text-sky-400 animate-bounce" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-10 h-10 text-slate-400" />;
    if (code === 0) return <Sun className="w-10 h-10 text-amber-400 animate-spin-slow" />;
    return <HelpCircle className="w-10 h-10 text-slate-400" />;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return s.weatherClear;
    if (code >= 1 && code <= 3) return s.weatherPartlyCloudy;
    if (code >= 45 && code <= 48) return s.weatherFog;
    if (code >= 51 && code <= 55) return s.weatherDrizzle;
    if (code >= 61 && code <= 65) return s.weatherRain;
    if (code >= 80 && code <= 82) return s.weatherShowers;
    if (code >= 95 && code <= 99) return s.weatherStorm;
    return s.weatherCloudy;
  };

  const getAgriculturalAdvice = (temp: number, wind: number, humidity: number, rain: number) => {
    if (rain > 0) {
      return {
        status: "critical",
        title: s.adviceRainTitle,
        message: s.adviceRainMsg,
        icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />,
        bgColor: "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 border-l-4 border-l-rose-500",
        textColor: "text-rose-900 dark:text-rose-300",
      };
    }
    if (wind > 20) {
      return {
        status: "warning",
        title: s.adviceWindTitle,
        message: s.adviceWindMsg,
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
        bgColor: "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 border-l-4 border-l-amber-500",
        textColor: "text-amber-900 dark:text-amber-300",
      };
    }
    if (temp > 35) {
      return {
        status: "warning",
        title: s.adviceHeatTitle,
        message: s.adviceHeatMsg,
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
        bgColor: "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 border-l-4 border-l-amber-500",
        textColor: "text-amber-900 dark:text-amber-300",
      };
    }
    return {
      status: "ideal",
      title: s.adviceIdealTitle,
      message: s.adviceIdealMsg,
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 border-l-4 border-l-emerald-500",
      textColor: "text-emerald-900 dark:text-emerald-300",
    };
  };

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-6 bg-card flex items-center justify-center h-[180px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground font-medium">{s.loading}</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="border border-border rounded-xl p-6 bg-card flex items-center justify-center h-[180px]">
        <AlertTriangle className="w-6 h-6 text-rose-500 mr-2" />
        <span className="text-sm text-rose-500 font-medium">{s.errorLoad}</span>
      </div>
    );
  }

  const advice = getAgriculturalAdvice(
    weather.temp,
    weather.windSpeed,
    weather.humidity,
    weather.precipitation
  );

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left Side: Current Temperature and Location */}
        <div className="flex items-center gap-4 md:border-r border-border/50 md:pr-4">
          {getWeatherIcon(weather.weatherCode)}
          <div>
            <div className="flex items-center text-xs text-slate-800 dark:text-slate-200 font-bold gap-1 uppercase tracking-wider mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{weather.locationName}</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-50">
              {weather.temp.toFixed(1)}°C
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              {getWeatherDescription(weather.weatherCode)}
            </div>
          </div>
        </div>

        {/* Center: Meteorological Details */}
        <div className="grid grid-cols-3 gap-4 md:border-r border-border/50 md:pr-4">
          <div className="flex flex-col items-center justify-center text-center">
            <Droplets className="w-5 h-5 text-sky-600 dark:text-sky-400 mb-1" />
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-widest">{s.humidity}</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">{weather.humidity}%</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <Wind className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-1" />
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-widest">{s.wind}</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">{weather.windSpeed.toFixed(0)} km/h</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <CloudRain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1" />
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-widest">{s.rain}</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">{weather.precipitation.toFixed(1)} mm</span>
          </div>
        </div>

        {/* Right Side: Agricultural Advice Card */}
        <div className={`p-4 rounded-lg ${advice.bgColor} flex gap-3 h-full items-start transition-all`}>
          {advice.icon}
          <div>
            <div className={`text-xs font-extrabold uppercase tracking-widest mb-1 ${advice.textColor}`}>{advice.title}</div>
            <p className="text-[11.5px] font-semibold leading-relaxed text-slate-800 dark:text-slate-100">{advice.message}</p>
          </div>
        </div>
      </div>

      {(forecast.length > 0 || rain30d !== null) && (
        <div className="border-t border-border/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {forecast.length > 0 && (
            <div className="flex-1 grid grid-cols-5 gap-2">
              {forecast.map((day) => {
                const weekday = new Date(day.date + "T00:00:00").toLocaleDateString(s.weekdayLocale, { weekday: "short" });
                return (
                  <div key={day.date} className="flex flex-col items-center text-center gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{weekday}</span>
                    <span className="scale-75">{getWeatherIcon(day.weatherCode)}</span>
                    <span className="text-xs font-bold text-foreground">
                      {Math.round(day.tempMax)}° <span className="text-muted-foreground font-medium">{Math.round(day.tempMin)}°</span>
                    </span>
                    {day.precipitation > 0 && (
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">{day.precipitation.toFixed(0)}mm</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {rain30d !== null && (
            <div className="flex items-center gap-2 sm:border-l border-border/50 sm:pl-4 shrink-0">
              <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <div>
                <div className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">{s.rain30d}</div>
                <div className="text-sm font-extrabold text-foreground">{rain30d.toFixed(0)} mm</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
