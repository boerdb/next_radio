"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type UIEvent,
} from "react";
import { stationLabel } from "@/lib/stationLabels";
import type { Station } from "@/lib/types";

const ITEM_HEIGHT = 52;
const PICKER_HEIGHT = 156;
const EDGE_PADDING = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;
const SCROLL_END_MS = 120;

interface StationPickerProps {
  stations: Station[];
  currentStation: Station | null;
  isPlaying: boolean;
  onSelect: (station: Station) => void;
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, index));
}

function indexFromScrollTop(scrollTop: number): number {
  return Math.round(scrollTop / ITEM_HEIGHT);
}

export function StationPicker({
  stations,
  currentStation,
  isPlaying,
  onSelect,
}: StationPickerProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const userScrollingRef = useRef(false);
  const userScrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [focusedIndex, setFocusedIndex] = useState(0);

  const count = stations.length;
  const focusedStation = stations[focusedIndex] ?? null;
  const isFocusedPlaying =
    focusedStation != null &&
    currentStation?.id === focusedStation.id &&
    isPlaying;

  const scrollToIndex = useCallback(
    (index: number, smooth: boolean) => {
      const list = listRef.current;
      if (!list || count === 0) return;
      const next = clampIndex(index, count);
      list.scrollTo({
        top: next * ITEM_HEIGHT,
        behavior: smooth ? "smooth" : "instant",
      });
      setFocusedIndex(next);
    },
    [count],
  );

  useEffect(() => {
    if (userScrollingRef.current || !currentStation) return;
    const index = stations.findIndex((s) => s.id === currentStation.id);
    if (index >= 0) scrollToIndex(index, false);
  }, [currentStation?.id, scrollToIndex, stations, currentStation]);

  useEffect(
    () => () => {
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
      if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
    },
    [],
  );

  const markUserScrolling = () => {
    userScrollingRef.current = true;
    if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
    userScrollTimer.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 400);
  };

  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
    markUserScrolling();
    const next = indexFromScrollTop(event.currentTarget.scrollTop);
    setFocusedIndex(clampIndex(next, count));

    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      const list = listRef.current;
      if (!list) return;
      const snapped = clampIndex(indexFromScrollTop(list.scrollTop), count);
      const targetTop = snapped * ITEM_HEIGHT;
      if (Math.abs(list.scrollTop - targetTop) > 1) {
        list.scrollTo({ top: targetTop, behavior: "smooth" });
      }
      setFocusedIndex(snapped);
    }, SCROLL_END_MS);
  };

  const handleItemClick = (index: number) => {
    const station = stations[index];
    if (!station) return;
    if (index === focusedIndex) {
      onSelect(station);
      return;
    }
    scrollToIndex(index, true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (count === 0) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      scrollToIndex(focusedIndex - 1, true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      scrollToIndex(focusedIndex + 1, true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const station = stations[focusedIndex];
      if (station) onSelect(station);
    }
  };

  if (count === 0) return null;

  return (
    <section
      className="flex min-h-0 flex-1 flex-col px-4 pb-3"
      aria-label="Stations"
    >
      <h3 className="mb-2 shrink-0 text-center text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        Stations
      </h3>

      <div
        className="station-picker relative mx-auto w-full max-w-[280px] shrink-0"
        style={{ height: PICKER_HEIGHT }}
      >
        <div
          className="pointer-events-none absolute inset-x-3 top-1/2 z-10 -translate-y-1/2 rounded-xl border border-[var(--primary)]/35 bg-[var(--primary)]/10"
          style={{ height: ITEM_HEIGHT }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-[var(--background)] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-[var(--background)] to-transparent"
          aria-hidden
        />

        <ul
          ref={listRef}
          tabIndex={0}
          className="station-picker-scroll h-full overflow-y-auto overscroll-y-contain outline-none"
          style={{ scrollPaddingBlock: EDGE_PADDING }}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          aria-label="Scroll om een station te kiezen"
          aria-activedescendant={
            focusedStation ? `station-picker-${focusedStation.id}` : undefined
          }
        >
          <li style={{ height: EDGE_PADDING }} aria-hidden />
          {stations.map((station, index) => {
            const distance = Math.abs(index - focusedIndex);
            const isFocused = index === focusedIndex;
            const isPlayingHere =
              currentStation?.id === station.id && isPlaying;

            return (
              <li key={station.id} className="snap-center snap-always">
                <button
                  id={`station-picker-${station.id}`}
                  type="button"
                  onClick={() => handleItemClick(index)}
                  aria-current={isFocused ? "true" : undefined}
                  className={`station-picker-item flex w-full items-center justify-center gap-1.5 rounded-xl px-4 text-center font-medium transition-[color,opacity,transform] duration-200 ${
                    isFocused
                      ? "text-base text-white"
                      : distance === 1
                        ? "text-sm text-white/65"
                        : "text-sm text-[var(--text-muted)]"
                  }`}
                  style={{
                    height: ITEM_HEIGHT,
                    opacity: isFocused ? 1 : distance === 1 ? 0.72 : 0.38,
                    transform: `scale(${isFocused ? 1 : distance === 1 ? 0.94 : 0.88})`,
                  }}
                >
                  {stationLabel(station)}
                  {station.id === "live" && (
                    <span
                      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                        isPlayingHere ? "bg-[var(--primary)]" : "bg-[var(--danger)]"
                      }`}
                    />
                  )}
                </button>
              </li>
            );
          })}
          <li style={{ height: EDGE_PADDING }} aria-hidden />
        </ul>
      </div>

      <p className="mt-3 shrink-0 text-center text-xs text-[var(--text-muted)]">
        {isFocusedPlaying
          ? "Speelt nu · tik om opnieuw te starten"
          : "Scroll · tik op een station om te luisteren"}
      </p>
    </section>
  );
}
