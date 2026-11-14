import { useSyncExternalStore } from "react";
import type { Obj } from "./api";
let offset = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
export function syncServerClock(time: string) {
  const parsed = Date.parse(time);
  if (Number.isFinite(parsed)) {
    offset = parsed - Date.now();
    listeners.forEach((f) => f());
  }
}
function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!timer) timer = setInterval(() => listeners.forEach((f) => f()), 1000);
  return () => {
    listeners.delete(callback);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
export const currentTime = () =>
  Math.floor((Date.now() + offset) / 1000) * 1000;
export const useNow = () =>
  useSyncExternalStore(subscribe, currentTime, currentTime);
export const timestamp = (value: any) =>
  value ? Date.parse(String(value).replace(" ", "T") + "+07:00") : NaN;
export type SaleState = "active" | "scheduled" | "ended" | "off";
export function saleState(p: Obj, now = currentTime()): SaleState {
  if (
    p.flash_price == null ||
    p.flash_price === "" ||
    !p.flash_start ||
    !p.flash_end
  )
    return "off";
  const start = timestamp(p.flash_start),
    end = timestamp(p.flash_end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return "off";
  return now < start ? "scheduled" : now < end ? "active" : "ended";
}
export function displayProduct(p: Obj, now = currentTime()): Obj {
  const active = saleState(p, now) === "active";
  const variants = (p.variants || []).map((v: Obj) => {
    const base = Number(v.compare_price ?? v.price);
    return {
      ...v,
      compare_price: base,
      price: active ? Math.min(base, Number(p.flash_price)) : base,
    };
  });
  return { ...p, variants, price: variants[0]?.price ?? 0 };
}
export function savings(p: Obj) {
  const base = Number(
    p.variants[0]?.compare_price ?? p.variants[0]?.price ?? 0,
  );
  return base > 0
    ? Math.min(
        Number(p.price) > 0 ? 99 : 100,
        Math.max(0, Math.round(((base - Number(p.price)) / base) * 100)),
      )
    : 0;
}
export function remaining(end: string, now = currentTime()) {
  const seconds = Math.max(0, Math.floor((timestamp(end) - now) / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
    total: seconds,
  };
}
