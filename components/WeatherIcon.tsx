"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { resolveWeatherIconFileUrl } from "@/lib/weatherIconSrc";

interface WeatherIconProps {
  icon: string;
  description: string;
  size?: number;
  className?: string;
}

/** OpenWeather icon codes → duidelijke SVG (zon/maan/wolken/regen, etc.) */
export function WeatherIcon({
  icon,
  description,
  size = 44,
  className = "",
}: WeatherIconProps) {
  const customSrc = resolveWeatherIconFileUrl(icon);
  const [customFailed, setCustomFailed] = useState(!customSrc);

  const onImgError = useCallback(() => {
    setCustomFailed(true);
  }, []);

  if (customSrc && !customFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- externe / eigen static host; geen Image-config nodig
      <img
        src={customSrc}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
        onError={onImgError}
        decoding="async"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={description}
    >
      <title>{description}</title>
      {iconSvgContent(icon)}
    </svg>
  );
}

function iconSvgContent(code: string): ReactNode {
  const c = code.trim().toLowerCase();
  const night = c.endsWith("n");

  switch (c) {
    case "01d":
      return <ClearDay />;
    case "01n":
      return <ClearNight />;
    case "02d":
      return <FewClouds variant="day" />;
    case "02n":
      return <FewClouds variant="night" />;
    case "03d":
    case "03n":
      return <ScatteredClouds night={night} />;
    case "04d":
    case "04n":
      return <BrokenClouds night={night} />;
    case "09d":
    case "09n":
      return <ShowerRain night={night} />;
    case "10d":
      return <RainDay />;
    case "10n":
      return <RainNight />;
    case "11d":
    case "11n":
      return <Thunderstorm night={night} />;
    case "13d":
    case "13n":
      return <Snow night={night} />;
    case "50d":
    case "50n":
      return <Mist night={night} />;
    default:
      return night ? <ClearNight /> : <ClearDay />;
  }
}

function ClearDay() {
  return (
    <>
      <circle cx="24" cy="22" r="10" fill="#FFC107" stroke="#F9A825" strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="24"
          y1="22"
          x2={24 + 16 * Math.cos((deg * Math.PI) / 180)}
          y2={22 + 16 * Math.sin((deg * Math.PI) / 180)}
          stroke="#FFC107"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

function ClearNight() {
  return (
    <>
      <path
        d="M 34 10 A 12 12 0 1 1 18 28 A 9 9 0 1 0 34 10 Z"
        fill="#FFEB3B"
        stroke="#FDD835"
        strokeWidth="0.75"
      />
      <circle cx="12" cy="14" r="1" fill="#CFD8DC" opacity="0.85" />
      <circle cx="38" cy="16" r="0.75" fill="#CFD8DC" opacity="0.65" />
      <circle cx="8" cy="22" r="0.6" fill="#CFD8DC" opacity="0.55" />
    </>
  );
}

function cloudFill(night: boolean) {
  return night ? "#90A4AE" : "#ECEFF1";
}

function cloudStroke(night: boolean) {
  return night ? "#78909C" : "#B0BEC5";
}

function FewClouds({ variant }: { variant: "day" | "night" }) {
  const n = variant === "night";
  return (
    <>
      {n ? <ClearNight /> : <ClearDay />}
      <ellipse cx="30" cy="32" rx="12" ry="8" fill={cloudFill(n)} stroke={cloudStroke(n)} strokeWidth="1" />
      <ellipse cx="22" cy="34" rx="9" ry="6" fill={cloudFill(n)} stroke={cloudStroke(n)} strokeWidth="1" />
    </>
  );
}

function ScatteredClouds({ night }: { night: boolean }) {
  return (
    <>
      <ellipse cx="26" cy="28" rx="14" ry="10" fill={cloudFill(night)} stroke={cloudStroke(night)} strokeWidth="1" />
      <ellipse cx="16" cy="30" rx="10" ry="7" fill={cloudFill(night)} stroke={cloudStroke(night)} strokeWidth="1" />
      <ellipse cx="34" cy="30" rx="9" ry="6" fill={cloudFill(night)} stroke={cloudStroke(night)} strokeWidth="1" />
    </>
  );
}

function BrokenClouds({ night }: { night: boolean }) {
  return (
    <>
      <ellipse cx="28" cy="26" rx="15" ry="11" fill={cloudFill(night)} stroke={cloudStroke(night)} strokeWidth="1" />
      <ellipse cx="14" cy="30" rx="11" ry="8" fill={cloudFill(night)} stroke={cloudStroke(night)} strokeWidth="1" />
      <ellipse cx="36" cy="32" rx="10" ry="7" fill="#B0BEC5" stroke="#90A4AE" strokeWidth="1" />
    </>
  );
}

function ShowerRain({ night }: { night: boolean }) {
  return (
    <>
      <ScatteredClouds night={night} />
      <line x1="16" y1="38" x2="14" y2="44" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="38" x2="22" y2="44" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="38" x2="30" y2="44" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function RainDay() {
  return (
    <>
      <FewClouds variant="day" />
      <line x1="18" y1="38" x2="16" y2="46" stroke="#2196F3" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="26" y1="38" x2="24" y2="46" stroke="#2196F3" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="34" y1="38" x2="32" y2="46" stroke="#2196F3" strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
}

function RainNight() {
  return (
    <>
      <FewClouds variant="night" />
      <line x1="18" y1="38" x2="16" y2="46" stroke="#64B5F6" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="26" y1="38" x2="24" y2="46" stroke="#64B5F6" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="34" y1="38" x2="32" y2="46" stroke="#64B5F6" strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
}

function Thunderstorm({ night }: { night: boolean }) {
  return (
    <>
      <BrokenClouds night={night} />
      <path d="M22 36 L20 44 L24 40 L22 48 L28 38 Z" fill="#FFCA28" stroke="#F9A825" strokeWidth="0.5" />
    </>
  );
}

function Snow({ night }: { night: boolean }) {
  return (
    <>
      <ScatteredClouds night={night} />
      <circle cx="18" cy="42" r="1.5" fill="#E3F2FD" />
      <circle cx="26" cy="44" r="1.5" fill="#E3F2FD" />
      <circle cx="32" cy="41" r="1.5" fill="#E3F2FD" />
    </>
  );
}

function Mist({ night }: { night: boolean }) {
  const f = night ? "#78909C" : "#B0BEC5";
  return (
    <>
      <rect x="8" y="20" width="32" height="4" rx="2" fill={f} opacity="0.7" />
      <rect x="10" y="28" width="28" height="4" rx="2" fill={f} opacity="0.55" />
      <rect x="6" y="36" width="36" height="4" rx="2" fill={f} opacity="0.45" />
    </>
  );
}
