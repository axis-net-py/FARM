"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  CloudSun, 
  Droplets, 
  Gauge, 
  Navigation, 
  Thermometer, 
  Wind, 
  Zap, 
  RefreshCw 
} from "lucide-react";

interface WeatherData {
  temp: number;
  windSpeed: number;
  weatherCode: number;
  latitude: number;
  longitude: number;
  humidity?: number;
}

export function AgroWeatherTelemetry() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeatherData] = useState<WeatherData | null>(null);
  const [telemetry, setTelemetry] = useState({
    fuelRate: 42,
    engineLoad: 78,
    speed: 12.5,
  });

  const fetchWeather = (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao obter previsão do tempo");
        return res.json();
      })
      .then((data) => {
        const current = data.current_weather;
        setWeatherData({
          temp: current.temperature,
          windSpeed: current.windspeed,
          weatherCode: current.weathercode,
          latitude: lat,
          longitude: lon,
          humidity: data.hourly?.relativehumidity_2m?.[0] || 65,
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Erro ao obter previsão do tempo");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada no navegador");
      // Fallback to Mato Grosso / Asuncion coords
      fetchWeather(-25.2637, -57.5759);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        console.warn("Geolocalização rejeitada/falhou, usando fallback: ", err);
        // Fallback coordinates
        fetchWeather(-25.2637, -57.5759);
      }
    );
  };

  useEffect(() => {
    getGeolocation();

    // Simulate real-time telemetry sensor fluctuations
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        fuelRate: Math.max(10, Math.min(80, +(prev.fuelRate + (Math.random() * 4 - 2)).toFixed(1))),
        engineLoad: Math.max(20, Math.min(100, +(prev.engineLoad + (Math.random() * 6 - 3)).toFixed(0))),
        speed: Math.max(0, Math.min(30, +(prev.speed + (Math.random() * 2 - 1)).toFixed(1))),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getWeatherDescription = (code: number) => {
    if (code === 0) return "Céu Limpo";
    if (code >= 1 && code <= 3) return "Parcialmente Nublado";
    if (code >= 45 && code <= 48) return "Nevoeiro";
    if (code >= 51 && code <= 55) return "Garoa";
    if (code >= 61 && code <= 65) return "Chuva";
    if (code >= 80 && code <= 82) return "Pancadas de Chuva";
    return "Nublado";
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Geolocation Weather Card */}
      <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="border-b border-border bg-muted/30 px-5 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
            <CloudSun className="h-4.5 w-4.5" />
            Previsão Agro-Climática (GPS)
          </CardTitle>
          <button 
            onClick={getGeolocation} 
            className="p-1.5 hover:bg-muted rounded-full transition-colors"
            title="Recarregar localização"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-[180px]" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : error && !weather ? (
            <div className="text-center py-4 text-rose-500 text-xs font-medium">{error}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <CloudSun className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading text-foreground">
                      {weather?.temp}°C
                    </h3>
                    <p className="text-xs font-semibold text-primary">
                      {getWeatherDescription(weather?.weatherCode || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end text-[9px]">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[9px] scale-95 origin-right">
                    Lat: {weather?.latitude.toFixed(3)}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[9px] scale-95 origin-right">
                    Lon: {weather?.longitude.toFixed(3)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <div className="p-2 bg-muted/40 rounded-xl flex flex-col items-center justify-center text-center">
                  <Thermometer className="h-4 w-4 text-amber-500 mb-0.5" />
                  <span className="text-[9px] text-muted-foreground font-medium">Temp.</span>
                  <span className="text-xs font-bold mt-0.5 text-foreground">
                    {weather?.temp}°C
                  </span>
                </div>
                <div className="p-2 bg-muted/40 rounded-xl flex flex-col items-center justify-center text-center">
                  <Wind className="h-4 w-4 text-blue-500 mb-0.5" />
                  <span className="text-[9px] text-muted-foreground font-medium">Vento</span>
                  <span className="text-xs font-bold mt-0.5 text-foreground">
                    {weather?.windSpeed} km/h
                  </span>
                </div>
                <div className="p-2 bg-muted/40 rounded-xl flex flex-col items-center justify-center text-center">
                  <Droplets className="h-4 w-4 text-indigo-500 mb-0.5" />
                  <span className="text-[9px] text-muted-foreground font-medium">Umidade</span>
                  <span className="text-xs font-bold mt-0.5 text-foreground">
                    {weather?.humidity}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telemetry Gauge Card */}
      <Card className="rounded-xl border border-border shadow-sm bg-card text-card-foreground overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="border-b border-border bg-muted/30 px-5 py-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
            <Gauge className="h-4.5 w-4.5" />
            Telemetria da Frota (Real-Time)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-around items-center gap-2">
            {/* Engine Load Gauge */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-border/40"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary transition-all duration-500"
                    strokeWidth="3.5"
                    strokeDasharray={`${telemetry.engineLoad}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="flex flex-col items-center z-10">
                  <span className="text-xs font-bold text-foreground">
                    {telemetry.engineLoad}%
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-1.5">
                Carga do Motor
              </span>
            </div>

            {/* Fuel Rate Gauge */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-border/40"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-500 transition-all duration-500"
                    strokeWidth="3.5"
                    strokeDasharray={`${(telemetry.fuelRate / 80) * 100}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="flex flex-col items-center z-10">
                  <span className="text-xs font-bold text-foreground">
                    {telemetry.fuelRate}
                  </span>
                  <span className="text-[8px] text-muted-foreground">L/h</span>
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-1.5">
                Consumo Comb.
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-3 flex justify-between items-center text-xs font-medium">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" /> Velocidade Média
            </span>
            <span className="font-bold text-foreground">{telemetry.speed} km/h</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
