"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Phone,
  User,
  Calendar,
  Clock,
  IndianRupee,
  MapPin,
  ClipboardList,
  Edit,
  Car,
  Package,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Temple {
  _id: string;
  name: string;
  price: number;
}

interface Booking {
  _id: string;
  name: string;
  phone: string;
  altPhone?: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  price: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  packageType?: string;
  packageName?: string;
  temples?: Temple[];
  hotel?: boolean;
  userId?: { email?: string };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    price: string;
    driverName: string;
    driverPhone: string;
  }>({ price: "", driverName: "", driverPhone: "" });

  const [expandedTemples, setExpandedTemples] = useState<Set<string>>(new Set());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      setBookings(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateBooking(id: string, payload: Partial<Booking>) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Update Failed ❌");
        return;
      }

      setBookings(prev =>
        prev.map(b => (b._id === id ? { ...b, ...payload } : b))
      );

      if (payload.status && !editId) {
        alert(`Booking ${payload.status} ✅`);
      }
      
      if (editId) {
        setEditId(null);
      }

    } catch (err) {
      console.error(err);
      alert("Server Error ❌");
    }
  }

  function startEdit(b: Booking) {
    setEditId(b._id);
    setEditForm({
      price: b.price,
      driverName: b.driverName || "",
      driverPhone: b.driverPhone || "",
    });
  }

  function saveEdit() {
    if (!editId) return;
    updateBooking(editId, editForm);
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ price: "", driverName: "", driverPhone: "" });
  }

  function toggleTemples(id: string) {
    setExpandedTemples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  if (loading) {
    return (
      <p className="text-center mt-20 text-slate-500 dark:text-slate-400">Loading DB...</p>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-white px-3 sm:px-6 py-10 transition-colors">
      <h1 className="flex items-center justify-center gap-3 text-2xl sm:text-4xl font-extrabold mb-10 gradient-text text-center">
        <ClipboardList size={32} className="text-primary" />
        Booking Management
      </h1>

      {bookings.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400">No bookings found</p>
      )}

      <div className="space-y-4 max-w-5xl mx-auto">
        {bookings.map((b) => (
          <div
            key={b._id}
            className={`border rounded-xl p-5 bg-white dark:bg-slate-900 transition-all ${
              b.status === "pending" ? "border-amber-500/50 shadow-md shadow-amber-500/5" : "border-border"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              
              {/* Info Panel */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  <p className="flex items-center gap-1.5"><User size={15} className="text-muted-foreground" /> <b>{b.name}</b></p>
                  <p className="flex items-center gap-1.5"><Phone size={15} className="text-muted-foreground" /> {b.phone}</p>
                  {b.altPhone && <p className="flex items-center gap-1.5"><Phone size={15} className="text-muted-foreground" /> Alt: {b.altPhone}</p>}
                  
                  <p className="flex items-start gap-1.5 sm:col-span-2">
                    <MapPin size={15} className="mt-0.5 text-primary" />
                    <span><b>Pickup:</b> <span className="text-primary">{b.pickup}</span></span>
                  </p>

                  <p className="flex items-center gap-1.5"><Calendar size={15} className="text-muted-foreground" /> {b.date}</p>
                  <p className="flex items-center gap-1.5"><Clock size={15} className="text-muted-foreground" /> {b.time}</p>
                  
                  <p className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      b.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>{b.status}</span>
                  </p>
                </div>

                {/* Package Info */}
                <div className="flex flex-wrap gap-3 items-center pt-3 border-t border-dashed">
                  <div className="flex items-center gap-1.5 text-sm bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                    <Package size={15} className="text-primary" />
                    <span className="font-bold text-primary">
                      {b.packageType === "five" ? "5 Temple Darshan" : 
                       b.packageType === "custom" ? "Custom Selection" : 
                       b.packageName || b.packageType || "Standard Ride"}
                    </span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm font-medium">
                    {b.temples?.length || 0} temple(s) selected
                  </span>
                </div>

                {/* Temples List */}
                {b.temples && b.temples.length > 0 && (
                  <div className="pt-2">
                    <button 
                      onClick={() => toggleTemples(b._id)}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {expandedTemples.has(b._id) ? "▼ Hide" : "▶ Show"} Temple List ({b.temples.length})
                    </button>
                    
                    {expandedTemples.has(b._id) && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {b.temples.map((t, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <MapPin size={12} className="text-primary shrink-0" />
                              <span>{t.name}</span>
                              <span className="text-muted-foreground text-xs">₹{t.price}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Driver Info */}
                {b.driverName && (
                   <p className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium pt-2 border-t border-dashed">
                     <Car size={15} /> Driver: {b.driverName} ({b.driverPhone})
                   </p>
                )}
              </div>

              {/* Action Panel */}
              <div className="flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                
                <div className="text-center mb-2">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Fare</div>
                  <div className="text-2xl font-black text-primary">₹{b.price}</div>
                </div>

                {editId === b._id ? (
                  <div className="space-y-3 bg-muted p-3 rounded-lg border border-primary/20 animate-in fade-in zoom-in-95">
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="Override Price (₹)" 
                        value={editForm.price} 
                        onChange={e => setEditForm({...editForm, price: e.target.value})} 
                        className="pl-8 text-sm"
                      />
                    </div>
                    <Input 
                      type="text" 
                      placeholder="Assign Driver Name" 
                      value={editForm.driverName} 
                      onChange={e => setEditForm({...editForm, driverName: e.target.value})} 
                      className="text-sm"
                    />
                    <Input 
                      type="text" 
                      placeholder="Driver Phone" 
                      value={editForm.driverPhone} 
                      onChange={e => setEditForm({...editForm, driverPhone: e.target.value})} 
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} size="sm" className="flex-1">
                        <Save size={14} className="mr-1" /> Save
                      </Button>
                      <Button onClick={cancelEdit} size="sm" variant="outline" className="flex-1">
                        <X size={14} className="mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button onClick={() => startEdit(b)} variant="outline" size="sm" className="w-full">
                      <Edit size={14} className="mr-1" /> Edit Details
                    </Button>

                    {b.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => updateBooking(b._id, { status: "confirmed" })}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={14} className="mr-1" /> Accept
                        </Button>
                        <Button
                          onClick={() => updateBooking(b._id, { status: "rejected" })}
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle size={14} className="mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
