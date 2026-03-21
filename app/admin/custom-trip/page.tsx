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
  basePrice?: number;
  isActive: boolean;
  activeStatus?: boolean;
  description?: string;
  category?: string;
  createdAt: string;
}

interface TempleResponse {
  _id: string;
  name: string;
  price?: number;
  basePrice?: number;
  isActive?: boolean;
  activeStatus?: boolean;
  description?: string;
  category?: string;
  createdAt?: string;
}

export default function CustomTripAdminPage() {
  const router = useRouter();
  const [temples, setTemples] = useState<Temple[]>([]);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/temples");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTemples(data.data.map((t: TempleResponse) => ({
          ...t,
          price: t.basePrice ?? t.price ?? 0,
          isActive: t.activeStatus ?? t.isActive ?? true
        })));
      } else if (Array.isArray(data)) {
        setTemples(data);
      }
    } catch (err) {
      showToast("error", "Failed to load temples");
    } finally {
      setLoading(false);
    }
  }, []);

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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Manage Locations</h1>
            <p className="text-slate-500 text-sm sm:text-base">Add or edit temples for custom trips. Bookings are handled in the <span className="font-bold text-primary cursor-pointer hover:underline" onClick={() => router.push("/admin/bookings")}>Main Bookings</span> page.</p>
          </div>
        </div>

        {/* Main Content Area */}
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
      </div>

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
              Are you sure you want to permanently delete this temple? 
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
                if (deletingId) {
                  deleteTemple(deletingId);
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