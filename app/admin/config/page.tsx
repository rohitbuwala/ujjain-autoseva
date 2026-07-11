"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  Map, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  IndianRupee,
  Settings,
  GripHorizontal
} from "lucide-react";

interface Temple {
  _id: string;
  name: string;
  price: number;
  category: string;
  basePrice: number;
  activeStatus: boolean;
  displayOrder: number;
}

interface TravelRoute {
  _id: string;
  routeName: string;
  slug: string;
  packageType: string;
  templeList: { _id: string; name: string }[];
  totalPrice: number;
  category: string;
  description: string;
  activeStatus: boolean;
  displayOrder: number;
}

export default function AdminConfigDashboard() {
  // Data State
  const [temples, setTemples] = useState<Temple[]>([]);
  const [routes, setRoutes] = useState<TravelRoute[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State - Route
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [routeForm, setRouteForm] = useState<Partial<TravelRoute>>({ activeStatus: true, totalPrice: 0, category: "inside", description: "", templeList: [], displayOrder: 0 });
  const [routeFormId, setRouteFormId] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRoutes, resTemples] = await Promise.all([
        fetch("/api/admin/routes"),
        fetch("/api/admin/temples")
      ]);
      const jsonRoutes = await resRoutes.json();
      const jsonTemples = await resTemples.json();
      setRoutes(jsonRoutes.data || []);
      setTemples(jsonTemples.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= ROUTE FUNCTIONS ================= */
  async function submitRoute(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = isEditingRoute 
        ? `/api/admin/routes/${routeFormId}` 
        : `/api/admin/routes`;
      const method = isEditingRoute ? "PATCH" : "POST";

      const payload = {
        ...routeForm,
        templeList: routeForm.templeList?.map(t => t._id) || []
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to save route");
      
      alert(isEditingRoute ? "Route Updated!" : "Route Created!");
      setIsEditingRoute(false);
      setRouteForm({ activeStatus: true, totalPrice: 0, category: "inside", templeList: [] });
      fetchData();
    } catch {
      alert("Error saving route");
    }
  }

  async function deleteRoute(id: string) {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/routes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setRoutes(routes.filter(r => r._id !== id));
    } catch {
      alert("Error deleting route");
    }
  }

  function editRoute(r: TravelRoute) {
    setIsEditingRoute(true);
    setRouteFormId(r._id);
    setRouteForm({
      routeName: r.routeName,
      totalPrice: r.totalPrice,
      category: r.category,
      description: r.description || "",
      templeList: r.templeList,
      activeStatus: r.activeStatus,
      displayOrder: r.displayOrder || 0
    });
  }

  function toggleRouteTemple(t: Temple) {
    setRouteForm(prev => {
      const exists = prev.templeList?.find(x => x._id === t._id);
      if (exists) {
        return { ...prev, templeList: prev.templeList?.filter(x => x._id !== t._id) };
      }
      return { ...prev, templeList: [...(prev.templeList || []), { _id: t._id, name: t.name }] };
    });
  }


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-white px-4 sm:px-6 py-10 transition-colors">
      
      {/* Heading */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <h1 className="flex items-center justify-center gap-3 text-3xl sm:text-4xl font-extrabold mb-4 gradient-text">
          <Settings size={36} className="text-primary" />
          Manage Routes
        </h1>
        <p className="text-muted-foreground">Create and manage booking packages, pricing, temple mappings and active status.</p>
      </div>

      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            
            {/* Editor Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {isEditingRoute ? <Edit size={20}/> : <Plus size={20}/>}
                {isEditingRoute ? "Edit Auto Route Package" : "Build New Route Package"}
              </h2>
              
              <form onSubmit={submitRoute} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Route Target Name</label>
                    <input required placeholder="E.g., Mahakal Only, 5 Temples..." value={routeForm.routeName || ""} onChange={e => setRouteForm({...routeForm, routeName: e.target.value})} className="w-full h-12 px-4 rounded-xl border bg-transparent focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Category</label>
                    <select value={routeForm.category} onChange={e => setRouteForm({...routeForm, category: e.target.value})} className="w-full h-12 px-4 rounded-xl border bg-transparent focus:ring-2 focus:ring-primary outline-none text-slate-900">
                      <option value="inside">Inside City</option>
                      <option value="outside">Outside City</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Fixed Price (₹)</label>
                    <input type="number" required value={routeForm.totalPrice || 0} onChange={e => setRouteForm({...routeForm, totalPrice: Number(e.target.value)})} className="w-full h-12 px-4 rounded-xl border bg-transparent focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Display Order</label>
                    <input type="number" value={routeForm.displayOrder || 0} onChange={e => setRouteForm({...routeForm, displayOrder: Number(e.target.value)})} className="w-full h-12 px-4 rounded-xl border bg-transparent focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1 block">Description</label>
                  <textarea rows={2} value={routeForm.description || ""} onChange={e => setRouteForm({...routeForm, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-transparent focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Short description shown on pricing card" />
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-muted/20">
                  <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                    <label className="text-sm font-bold m-0 text-foreground">Assigned Temples</label>
                    <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{routeForm.templeList?.length || 0} Listed</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {temples.map(t => {
                      const isSelected = routeForm.templeList?.some(x => x._id === t._id);
                      return (
                        <div 
                          key={t._id} 
                          onClick={() => toggleRouteTemple(t)}
                          className={`cursor-pointer px-3 py-2 border rounded-lg text-xs font-semibold select-none flex items-center justify-between transition-all ${isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-background hover:bg-muted font-medium text-muted-foreground'}`}
                        >
                          <span className="truncate pr-2">{t.name}</span>
                          {isSelected && <CheckCircle size={14} className="shrink-0" />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="r-active" checked={routeForm.activeStatus} onChange={e => setRouteForm({...routeForm, activeStatus: e.target.checked})} className="w-5 h-5 rounded text-primary"/>
                  <label htmlFor="r-active" className="font-medium cursor-pointer">Route is Active on Website</label>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="submit" disabled={!routeForm.routeName || routeForm.templeList?.length === 0} className="flex-1 bg-primary text-white h-12 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isEditingRoute ? "Deploy Route Update" : "Publish Route"}
                  </button>
                  {isEditingRoute && (
                    <button type="button" onClick={() => { setIsEditingRoute(false); setRouteForm({ activeStatus: true, totalPrice: 0, category: "inside", description: "", templeList: [], displayOrder: 0 }); }} className="px-5 bg-muted rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
              {loading ? <p className="text-center py-10">Loading DB...</p> : routes.map(r => (
                <div key={r._id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:border-primary/50 transition-colors relative overflow-hidden group">
                  {!r.activeStatus && <div className="absolute top-0 right-0 w-16 h-16"><div className="absolute transform rotate-45 bg-red-600 text-white text-[10px] font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center shadow-lg">OFFLINE</div></div>}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl flex items-center gap-2">
                        <Map size={20} className="text-primary"/> 
                        {r.routeName}
                      </h3>
                      <p className="text-muted-foreground font-semibold flex items-center gap-1 mt-1">
                        <span className="capitalize border bg-muted px-2 py-0.5 rounded text-xs leading-none">{r.category} City</span>
                        <IndianRupee size={14} className="text-green-600 ml-1" /> <span className="text-green-600 text-sm">₹{r.totalPrice} Package</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editRoute(r)} className="p-2 bg-muted hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"><Edit size={16}/></button>
                      <button onClick={() => deleteRoute(r._id)} className="p-2 bg-muted hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {r.templeList.map(t => (
                      <span key={t._id} className="bg-muted px-2.5 py-1 rounded-md text-xs font-medium border text-muted-foreground flex items-center gap-1">
                        <GripHorizontal size={10} className="opacity-50" /> {t.name}
                      </span>
                    ))}
                    {r.templeList.length === 0 && <span className="text-sm text-red-500 font-medium">⚠️ No temples attached</span>}
                  </div>
                </div>
              ))}
              {routes.length === 0 && !loading && (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl text-muted-foreground bg-white dark:bg-slate-900/50">
                  <Map size={48} className="mx-auto mb-4 opacity-20" />
                  No predefined routes currently open.
                </div>
              )}
            </div>

          </div>

      </div>
    </div>
  );
}
