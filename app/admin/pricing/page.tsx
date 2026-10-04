"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Save,
  Check,
  AlertCircle,
  IndianRupee,
  Tag,
  MapPin,
  Route,
} from "lucide-react";
import { PRICING_SLOT_KEYS } from "@/lib/validators/pricing-configuration";

interface RouteDoc {
  _id: string;
  routeName: string;
  slug: string;
  totalPrice: number;
  packageType: string;
  category: string;
  description: string;
  activeStatus: boolean;
  templeList: { _id: string; name: string }[];
}

interface SlotState {
  key: string;
  route: string | null;
  enabled: boolean;
}

const SLOT_LABELS: Record<string, { title: string; description: string }> = {
  "pricing-primary": {
    title: "Featured Primary Route",
    description: "Main highlighted route on the pricing page",
  },
  "pricing-secondary": {
    title: "Featured Secondary Route",
    description: "Second highlighted route on the pricing page",
  },
  "pricing-custom": {
    title: "Custom Package",
    description: "Custom or seasonal route on the pricing page",
  },
};

const INITIAL_SLOTS: SlotState[] = PRICING_SLOT_KEYS.map((key) => ({
  key,
  route: null,
  enabled: true,
}));

export default function AdminPricingPage() {
  const [slots, setSlots] = useState<SlotState[]>(INITIAL_SLOTS);
  const [routes, setRoutes] = useState<RouteDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, routesRes] = await Promise.all([
        fetch("/api/admin/pricing-configuration"),
        fetch("/api/admin/routes"),
      ]);

      const configJson = await configRes.json();
      const routesJson = await routesRes.json();

      const allRoutes: RouteDoc[] = routesJson.data || [];
      setRoutes(allRoutes.filter((r) => r.activeStatus));

      const savedSlots: Array<{
        key: string;
        route: string | { _id: string } | null;
        enabled: boolean;
      }> = configJson.data?.slots || [];

      const merged = INITIAL_SLOTS.map((blank) => {
        const found = savedSlots.find((s) => s.key === blank.key);
        if (!found) return blank;
        const routeVal = found.route;
        return {
          key: found.key,
          route: routeVal == null
            ? null
            : typeof routeVal === "string"
              ? routeVal
              : routeVal._id,
          enabled: found.enabled,
        };
      });

      setSlots(merged);
    } catch {
      showToast("error", "Failed to load pricing configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateSlot(key: string, field: "route" | "enabled", value: string | boolean | null) {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: value } : s))
    );
  }

  function getSelectedRouteIds(): Set<string> {
    return new Set(
      slots.map((s) => s.route).filter((r): r is string => r !== null)
    );
  }

  function getRouteById(id: string): RouteDoc | undefined {
    return routes.find((r) => r._id === id);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing-configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });

      const json = await res.json();

      if (!res.ok) {
        showToast("error", json.error || "Failed to save");
        return;
      }

      const savedSlots: Array<{
        key: string;
        route: string | { _id: string } | null;
        enabled: boolean;
      }> = json.data?.slots || [];

      setSlots(
        INITIAL_SLOTS.map((blank) => {
          const found = savedSlots.find((s) => s.key === blank.key);
          if (!found) return blank;
          const routeVal = found.route;
          return {
            key: found.key,
            route: routeVal == null
              ? null
              : typeof routeVal === "string"
                ? routeVal
                : routeVal._id,
            enabled: found.enabled,
          };
        })
      );

      showToast("success", "Pricing configuration saved");
    } catch {
      showToast("error", "Failed to save pricing configuration");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading pricing configuration...
      </div>
    );
  }

  const selectedIds = getSelectedRouteIds();

  return (
    <div className="min-h-screen bg-background text-foreground px-3 sm:px-6 py-10 transition-colors">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-xl ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white flex items-center gap-2 animate-in slide-in-from-top duration-300`}
        >
          {toast.type === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              <IndianRupee size={32} className="text-primary" />
              Pricing Configuration
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Assign routes to pricing page slots. Disabled slots are hidden from
              customers.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md transition"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>

        {/* Empty state: no active routes */}
        {routes.length === 0 && (
          <div className="rounded-xl border-2 border-dashed p-10 text-center bg-muted/40">
            <Route size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">
              No active routes available. Create routes first before configuring
              pricing slots.
            </p>
          </div>
        )}

        {/* Slots */}
        {routes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {slots.map((slot) => {
              const label = SLOT_LABELS[slot.key];
              const preview = slot.route ? getRouteById(slot.route) : undefined;

              return (
                <Card key={slot.key} className="relative flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Tag size={14} className="text-primary" />
                        {label?.title || slot.key}
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() =>
                          updateSlot(slot.key, "enabled", !slot.enabled)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          slot.enabled
                            ? "bg-green-600"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            slot.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {label?.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 font-mono">
                      {slot.key}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4 flex flex-col flex-grow">
                    {/* Route dropdown */}
                    <div>
                      <label className="text-sm font-semibold mb-1 block">
                        Route
                      </label>
                      <select
                        value={slot.route ?? ""}
                        onChange={(e) =>
                          updateSlot(slot.key, "route", e.target.value || null)
                        }
                        className="w-full h-12 px-4 rounded-xl border bg-transparent focus:ring-2 focus:ring-primary outline-none text-sm"
                      >
                        <option value="">Select a route...</option>
                        {routes.map((r) => {
                          const isUsedElsewhere =
                            selectedIds.has(r._id) && r._id !== slot.route;
                          return (
                            <option
                              key={r._id}
                              value={r._id}
                              disabled={isUsedElsewhere}
                            >
                              {r.routeName} — ₹{r.totalPrice}
                              {r.slug ? ` (${r.slug})` : ""}
                              {isUsedElsewhere ? " [assigned]" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Live preview */}
                    {preview ? (
                      <div className="rounded-xl border bg-muted/30 p-4 space-y-3 flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">
                            {preview.routeName}
                          </h4>
                          <span className="text-sm font-bold text-green-600">
                            ₹{preview.totalPrice}
                          </span>
                        </div>

                        {preview.slug && (
                          <p className="text-xs text-muted-foreground font-mono">
                            /{preview.slug}
                          </p>
                        )}

                        {preview.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {preview.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {preview.category && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                              {preview.category}
                            </span>
                          )}
                          {preview.packageType && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {preview.packageType.replace("_", " ")}
                            </span>
                          )}
                          {preview.templeList.length > 0 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                              <MapPin size={10} />
                              {preview.templeList.length} temples
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed p-6 text-center flex-grow flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">
                          Select a route to preview
                        </p>
                      </div>
                    )}

                    {/* Status badge */}
                    <div
                      className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                        slot.enabled
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {slot.enabled ? "Active" : "Disabled"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
