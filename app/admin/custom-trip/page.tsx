"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, X, Check, AlertCircle, ArrowLeft, MapPin, Calendar, Clock, Phone, IndianRupee } from "lucide-react";

interface Temple {
  _id: string;
  name: string;
  price: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

interface CustomBooking {
  _id: string;
  name: string;
  phone: string;
  altPhone?: string;
  temples: Array<{
    _id: any;
    name: string;
    price: number;
  }>;
  date: string;
  time: string;
  price: string;
  status: string;
  adminNote?: string;
  createdAt: string;
}

export default function CustomTripAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"temples" | "bookings">("temples");
  const [temples, setTemples] = useState<Temple[]>([]);
  const [bookings, setBookings] = useState<CustomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [templeDialogOpen, setTempleDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [editingBooking, setEditingBooking] = useState<CustomBooking | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [templeForm, setTempleForm] = useState({
    name: "",
    price: "",
    description: "",
    isActive: true,
  });

  const [bookingForm, setBookingForm] = useState({
    price: "",
    adminNote: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "temples") {
        const res = await fetch("/api/temples");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTemples(data.data.map((t: any) => ({
            ...t,
            price: t.basePrice ?? t.price ?? 0,
            isActive: t.activeStatus ?? t.isActive ?? true
          })));
        } else if (Array.isArray(data)) {
          setTemples(data);
        }
      } else {
        const res = await fetch("/api/admin/custom-bookings", { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) setBookings(data);
      }
    } catch (err) {
      showToast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function openAddTemple() {
    setEditingTemple(null);
    setTempleForm({ name: "", price: "", description: "", isActive: true });
    setTempleDialogOpen(true);
  }

  function openEditTemple(temple: Temple) {
    setEditingTemple(temple);
    setTempleForm({
      name: temple.name,
      price: String(temple.price),
      description: temple.description || "",
      isActive: temple.isActive,
    });
    setTempleDialogOpen(true);
  }

  async function saveTemple() {
    if (!templeForm.name || !templeForm.price) {
      showToast("error", "Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const url = editingTemple 
        ? `/api/admin/temples/${editingTemple._id}`
        : "/api/temples";
      
      const method = editingTemple ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templeForm.name,
          price: Number(templeForm.price),
          category: "inside",
          active: templeForm.isActive,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      showToast("success", editingTemple ? "Temple updated" : "Temple added");
      setTempleDialogOpen(false);
      loadData();
    } catch (err) {
      showToast("error", "Failed to save temple");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTempleStatus(temple: Temple) {
    const newStatus = !temple.isActive;
    try {
      // Optimistic update
      setTemples(prev => prev.map(t => 
        t._id === temple._id ? { ...t, isActive: newStatus } : t
      ));

      const res = await fetch(`/api/admin/temples/${temple._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (res.ok) {
        showToast("success", `Temple ${newStatus ? "activated" : "deactivated"}`);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Revert on error
      setTemples(prev => prev.map(t => 
        t._id === temple._id ? { ...t, isActive: !newStatus } : t
      ));
      showToast("error", "Failed to update status");
    }
  }

  async function deleteTemple(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/temples/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Temple deleted");
        setTemples(prev => prev.filter(t => t._id !== id));
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("error", "Failed to delete");
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      // Optimistic update
      setBookings(prev => prev.map(b => 
        b._id === bookingId ? { ...b, status } : b
      ));

      const res = await fetch(`/api/admin/custom-bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast("success", `Booking ${status}`);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Revert
      loadData();
      showToast("error", "Failed to update status");
    }
  }

  async function deleteBooking(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/custom-bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Booking deleted");
        setBookings(prev => prev.filter(b => b._id !== id));
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("error", "Failed to delete");
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
    }
  }

  function openEditBooking(booking: CustomBooking) {
    setEditingBooking(booking);
    setBookingForm({
      price: String(booking.price),
      adminNote: booking.adminNote || "",
    });
    setBookingDialogOpen(true);
  }

  async function saveBooking() {
    if (!bookingForm.price || isNaN(Number(bookingForm.price))) {
      showToast("error", "Please enter a valid price");
      return;
    }

    if (!editingBooking) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/custom-bookings/${editingBooking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: bookingForm.price,
          adminNote: bookingForm.adminNote,
        }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        showToast("error", result.error || "Failed to save");
        return;
      }

      // Update local state immediately with returned data
      if (result.success && result.data) {
        setBookings(prev => prev.map(b => 
          b._id === editingBooking._id 
            ? { ...b, price: result.data.price, adminNote: result.data.adminNote }
            : b
        ));
      }

      showToast("success", "Booking updated successfully");
      setBookingDialogOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      showToast("error", "Failed to update booking");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-3 sm:px-6 py-4 sm:py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-xl ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        } text-white flex items-center gap-2 animate-in slide-in-from-top duration-300`}>
          {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Custom Trips</h1>
            <p className="text-slate-500 text-sm sm:text-base">Manage locations and personalized bookings</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("temples")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "temples" 
                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <MapPin size={16} />
            Temples
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "bookings" 
                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Calendar size={16} />
            Bookings
          </button>
        </div>

        {/* Main Content Area */}
        {activeTab === "temples" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Available Temples</h2>
              <Button onClick={openAddTemple} className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                <Plus size={18} /> Add New Temple
              </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                    <p className="text-slate-500 font-medium animate-pulse">Loading temples...</p>
                  </div>
                ) : temples.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="bg-slate-200 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No temples found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Start by adding temples that users can choose for their custom trips.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                          <TableHead className="font-bold">Temple Name</TableHead>
                          <TableHead className="font-bold">Base Price</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="text-right font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {temples.map((temple) => (
                          <TableRow key={temple._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <TableCell className="font-semibold py-4">{temple.name}</TableCell>
                            <TableCell className="py-4">
                              <span className="flex items-center font-mono">₹{temple.price}</span>
                            </TableCell>
                            <TableCell className="py-4">
                              <button 
                                onClick={() => toggleTempleStatus(temple)}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                                  temple.isActive 
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${temple.isActive ? "bg-green-500" : "bg-slate-400"}`}></span>
                                {temple.isActive ? "ACTIVE" : "INACTIVE"}
                              </button>
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 border-slate-200 dark:border-slate-700 hover:text-blue-600 hover:border-blue-300"
                                  onClick={() => openEditTemple(temple)}
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                  onClick={() => {
                                    setDeletingId(temple._id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Recent Bookings</h2>
              <p className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {bookings.length} Total Bookings
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-slate-500 font-medium animate-pulse">Fetching bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                    <Calendar size={32} className="text-slate-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">No bookings found</h3>
                    <p className="text-slate-500 max-w-sm">When customers book custom trips, they will appear here for your review.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop View Table */}
                <Card className="hidden lg:block border-none shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                          <TableRow>
                            <TableHead className="font-bold">Customer</TableHead>
                            <TableHead className="font-bold">Trip Details</TableHead>
                            <TableHead className="font-bold">Schedule</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Amount</TableHead>
                            <TableHead className="text-right font-bold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((booking) => (
                            <TableRow key={booking._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                              <TableCell className="py-5">
                                <div className="font-bold text-slate-900 dark:text-slate-100">{booking.name}</div>
                                <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone size={12} /> {booking.phone}
                                </div>
                              </TableCell>
                              <TableCell className="py-5">
                                <div className="max-w-[240px] flex flex-wrap gap-1">
                                  {booking.temples?.map((t, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400">
                                      {t.name}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="py-5 text-sm">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <Calendar size={14} className="text-slate-400" /> {booking.date}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                  <Clock size={14} className="text-slate-400" /> {booking.time}
                                </div>
                              </TableCell>
                              <TableCell className="py-5">
                                <Badge 
                                  className={`capitalize px-2.5 py-1 text-xs font-bold border-none ${
                                    booking.status === "confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                    booking.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  }`}
                                >
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-5">
                                <div className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                                  ₹{booking.price}
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-5">
                                <div className="flex justify-end items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 flex items-center gap-1.5 hover:bg-blue-50 hover:text-blue-600"
                                    onClick={() => openEditBooking(booking)}
                                  >
                                    <IndianRupee size={14} /> Price
                                  </Button>
                                  
                                  {booking.status === "pending" && (
                                    <>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => updateBookingStatus(booking._id, "confirmed")}
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => updateBookingStatus(booking._id, "rejected")}
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                                    onClick={() => {
                                      setDeletingId(booking._id);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile & Tablet View Cards */}
                <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((booking) => (
                    <Card key={booking._id} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                      <div className={`h-1 w-full ${
                        booking.status === "confirmed" ? "bg-green-500" :
                        booking.status === "rejected" ? "bg-red-500" : "bg-amber-500"
                      }`}></div>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg leading-none">{booking.name}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-2">
                              <Phone size={14} /> {booking.phone}
                            </p>
                          </div>
                          <Badge 
                            className={`capitalize text-[10px] font-bold ${
                              booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                              booking.status === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {booking.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1.5 py-1">
                          {booking.temples?.map((t, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {t.name}
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-sm border-y border-slate-100 dark:border-slate-800 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <Calendar size={14} className="text-slate-400" /> {booking.date}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock size={14} className="text-slate-400" /> {booking.time}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Amount</p>
                            <p className="text-xl font-mono font-bold text-slate-900 dark:text-slate-50">₹{booking.price}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 gap-1.5"
                            onClick={() => openEditBooking(booking)}
                          >
                            <Pencil size={14} /> Edit Price
                          </Button>
                          
                          {booking.status === "pending" && (
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => updateBookingStatus(booking._id, "confirmed")}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-red-600 border-red-200"
                                onClick={() => updateBookingStatus(booking._id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 w-full"
                            onClick={() => {
                              setDeletingId(booking._id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 size={14} className="mr-2" /> Delete Booking
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Booking Price Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Booking Price</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {editingBooking && (
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                  {editingBooking.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{editingBooking.name}</p>
                  <p className="text-xs text-slate-500">{editingBooking.phone}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingPrice" className="text-sm font-bold flex items-center gap-2">
                  <IndianRupee size={14} /> Trip Cost (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                  <Input
                    id="bookingPrice"
                    type="number"
                    value={bookingForm.price}
                    onChange={(e) => setBookingForm({ ...bookingForm, price: e.target.value })}
                    className="pl-8 h-12 text-lg font-mono focus-visible:ring-blue-500 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminNote" className="text-sm font-bold">Internal Note</Label>
                <textarea
                  id="adminNote"
                  rows={3}
                  value={bookingForm.adminNote}
                  onChange={(e) => setBookingForm({ ...bookingForm, adminNote: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Private notes for admin review..."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)} className="rounded-lg h-11 flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={saveBooking} 
              disabled={saving} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11 flex-1 sm:flex-none min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Temple Dialog */}
      <Dialog open={templeDialogOpen} onOpenChange={setTempleDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingTemple ? "Edit Temple Location" : "Add New Location"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold">Temple Name *</Label>
              <Input
                id="name"
                value={templeForm.name}
                onChange={(e) => setTempleForm({ ...templeForm, name: e.target.value })}
                placeholder="e.g., Mahakaleshwar Jyotirlinga"
                className="h-11 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-bold">Base Price (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <Input
                  id="price"
                  type="number"
                  value={templeForm.price}
                  onChange={(e) => setTempleForm({ ...templeForm, price: e.target.value })}
                  className="pl-7 h-11 font-mono rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold">Short Description</Label>
              <Input
                id="description"
                value={templeForm.description}
                onChange={(e) => setTempleForm({ ...templeForm, description: e.target.value })}
                placeholder="Location details or timing info"
                className="h-11 rounded-lg"
              />
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
              <input
                type="checkbox"
                id="isActive"
                checked={templeForm.isActive}
                onChange={(e) => setTempleForm({ ...templeForm, isActive: e.target.checked })}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
              <Label htmlFor="isActive" className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                Visible for custom booking
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTempleDialogOpen(false)} className="rounded-lg h-11 flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={saveTemple} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11 flex-1 sm:flex-none min-w-[100px]"
            >
              {saving ? <Loader2 className="animate-spin h-5 w-5" /> : (editingTemple ? "Update Temple" : "Add Temple")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <AlertCircle size={24} /> Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this {activeTab === "temples" ? "temple" : "booking"}? 
              This action <span className="font-bold text-slate-900 dark:text-slate-100 underline decoration-red-500">cannot be undone</span>.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-lg h-11 flex-1 sm:flex-none">
              Keep it
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (activeTab === "temples" && deletingId) {
                  deleteTemple(deletingId);
                } else if (activeTab === "bookings" && deletingId) {
                  deleteBooking(deletingId);
                }
              }}
              disabled={!!deletingId && saving}
              className="bg-red-600 hover:bg-red-700 rounded-lg h-11 flex-1 sm:flex-none"
            >
              {deletingId && saving ? <Loader2 className="animate-spin h-5 w-5" /> : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}