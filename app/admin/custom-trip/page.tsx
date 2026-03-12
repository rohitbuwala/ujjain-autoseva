"use client";

import { useEffect, useState } from "react";
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
import { Loader2, Plus, Pencil, Trash2, X, Check, AlertCircle, ArrowLeft, MapPin } from "lucide-react";

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
    _id: { _id: string; name: string; price: number };
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
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
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

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "temples") {
        const res = await fetch("/api/admin/temples");
        const data = await res.json();
        if (Array.isArray(data)) setTemples(data);
      } else {
        const res = await fetch("/api/admin/custom-bookings");
        const data = await res.json();
        if (Array.isArray(data)) setBookings(data);
      }
    } catch (err) {
      console.error("Load error:", err);
      showToast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

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
        : "/api/admin/temples";
      
      const method = editingTemple ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templeForm.name,
          price: Number(templeForm.price),
          description: templeForm.description,
          isActive: templeForm.isActive,
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
    try {
      const res = await fetch(`/api/admin/temples/${temple._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !temple.isActive }),
      });

      if (res.ok) {
        showToast("success", `Temple ${temple.isActive ? "deactivated" : "activated"}`);
        loadData();
      }
    } catch (err) {
      showToast("error", "Failed to update status");
    }
  }

  async function deleteTemple(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/temples/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Temple deleted");
        loadData();
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
      const res = await fetch(`/api/admin/custom-bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast("success", `Booking ${status}`);
        loadData();
      }
    } catch (err) {
      showToast("error", "Failed to update status");
    }
  }

  async function deleteBooking(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/custom-bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Booking deleted");
        loadData();
      }
    } catch (err) {
      showToast("error", "Failed to delete");
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        } text-white flex items-center gap-2 animate-in slide-in-from-right`}>
          {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Custom Trips</h1>
            <p className="text-slate-500">Manage temples and custom trip bookings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "temples" ? "default" : "outline"}
            onClick={() => setActiveTab("temples")}
            className="gap-2"
          >
            <MapPin size={18} />
            Temples
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveTab("bookings")}
            className="gap-2"
          >
            Bookings
          </Button>
        </div>

        {/* Temples Tab */}
        {activeTab === "temples" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Temple Management</CardTitle>
              <Button onClick={openAddTemple} className="gap-2">
                <Plus size={18} />
                Add Temple
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : temples.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No temples found. Add your first temple.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Temple Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temples.map((temple) => (
                      <TableRow key={temple._id}>
                        <TableCell className="font-medium">{temple.name}</TableCell>
                        <TableCell>₹{temple.price}</TableCell>
                        <TableCell>
                          <Badge variant={temple.isActive ? "default" : "secondary"}>
                            {temple.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleTempleStatus(temple)}
                            >
                              {temple.isActive ? <X size={16} /> : <Check size={16} />}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditTemple(temple)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setDeletingId(temple._id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              {deletingId === temple._id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Trip Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No custom trip bookings yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Temples</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell className="font-medium">{booking.name}</TableCell>
                        <TableCell>{booking.phone}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {booking.temples?.map((t, i) => (
                              <span key={i} className="text-sm">
                                {t.name}{i < (booking.temples?.length || 0) - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{booking.date}</div>
                          <div className="text-xs text-slate-500">{booking.time}</div>
                        </TableCell>
                        <TableCell className="font-medium">₹{booking.price}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              booking.status === "confirmed" ? "default" :
                              booking.status === "rejected" ? "destructive" : "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking._id, "confirmed")}
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking._id, "rejected")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setDeletingId(booking._id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              {deletingId === booking._id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Temple Dialog */}
      <Dialog open={templeDialogOpen} onOpenChange={setTempleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemple ? "Edit Temple" : "Add New Temple"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Temple Name *</Label>
              <Input
                id="name"
                value={templeForm.name}
                onChange={(e) => setTempleForm({ ...templeForm, name: e.target.value })}
                placeholder="e.g., Mahakaleshwar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={templeForm.price}
                onChange={(e) => setTempleForm({ ...templeForm, price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={templeForm.description}
                onChange={(e) => setTempleForm({ ...templeForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={templeForm.isActive}
                onChange={(e) => setTempleForm({ ...templeForm, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTempleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemple} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemple ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete this {activeTab === "temples" ? "temple" : "booking"}? 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
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
              disabled={!!deletingId}
            >
              {deletingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
