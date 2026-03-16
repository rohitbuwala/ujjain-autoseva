"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  MessageCircle,
  FileText,
  Loader2,
  AlertCircle,
  Lock,
  Settings
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Temple {
  _id: string;
  name: string;
  price: number;
  category: string;
}

const FIVE_TEMPLE_DARSHAN_TEMPLES = [
  "Sandipani ashram",
  "Mangalnath mandir",
  "Kaal Bhairav",
  "Gadkalika mandir",
  "Ishthirman ganesh mandir"
];

const CITY_TOUR_TEMPLES = [
  "Rinmukteshwar mahadev",
  "Chintaman ganesh",
  "ashtavinayak mandir",
  "navgrah shani mandir",
  "Iskcon mandir"
];

const FIVE_TEMPLE_PRICE = 650;
const CITY_TOUR_PRICE = 850;

const PACKAGES = [
  { id: "city-tour", name: "Mahakal + City Tour", price: CITY_TOUR_PRICE, icon: Check, desc: "Most popular spiritual tour", locked: true },
  { id: "five", name: "5 Temple Darshan", price: FIVE_TEMPLE_PRICE, icon: Check, desc: "Pre-selected temples at fixed price", locked: true },
  { id: "custom", name: "Custom Selection", price: 0, icon: Settings, desc: "Choose temples and get instant fare", locked: false },
];

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initPkg = searchParams.get("package");
  
  const [step, setStep] = useState(1);
  const [loadingTemples, setLoadingTemples] = useState(true);
  const [dbTemples, setDbTemples] = useState<Temple[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [minDate, setMinDate] = useState("");

  const [formData, setFormData] = useState({
    packageType: initPkg === "city-tour" ? "city-tour" : initPkg === "five" ? "five" : "custom",
    selectedTemples: [] as string[],
    date: "",
    time: "",
    pickup: "",
    hotel: false,
    name: "",
    phone: "",
    whatsappOptIn: true,
    notes: ""
  });

  useEffect(() => {
    fetch("/api/temples")
      .then(res => res.json())
      .then((data) => {
        const temples = (data as { data?: Temple[] }).data || data as Temple[] || [];
        if (Array.isArray(temples)) {
          setDbTemples(temples);
          
          if (initPkg === "five" || initPkg === "city-tour") {
            const templeList = initPkg === "five" ? FIVE_TEMPLE_DARSHAN_TEMPLES : CITY_TOUR_TEMPLES;
            const lockedTemples = temples.filter((t: Temple) => 
              templeList.some(name => 
                t.name.toLowerCase().includes(name.toLowerCase())
              )
            );
            
            if (lockedTemples.length > 0) {
              setFormData(prev => ({
                ...prev,
                packageType: initPkg as string,
                selectedTemples: lockedTemples.map((t: Temple) => t._id)
              }));
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingTemples(false));
  }, [initPkg]);

  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setMinDate(todayStr);
    setFormData(prev => ({ ...prev, date: todayStr }));
  }, []);

  const calculateTotal = () => {
    if (formData.packageType === "five") {
      return FIVE_TEMPLE_PRICE;
    }
    if (formData.packageType === "city-tour") {
      return CITY_TOUR_PRICE;
    }
    return formData.selectedTemples.reduce((sum, id) => {
      const temple = dbTemples.find(t => t._id === id);
      return sum + (temple?.price || 200);
    }, 0);
  };

  const getPackageDetails = (id: string) => {
    return PACKAGES.find(p => p.id === id) || PACKAGES[2];
  };

  const isFixedPlan = formData.packageType === "five" || formData.packageType === "city-tour";

  const handleNext = () => {
    setSubmitError("");
    
    if (step === 1) {
      if (isFixedPlan) {
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 3) {
      if (!formData.date || formData.date < minDate) {
        setSubmitError("Please select a valid future date.");
        return;
      }
      if (formData.date === minDate) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [selH, selM] = formData.time.split(":").map(Number);
        const selMins = selH * 60 + selM;
        if (formData.time && selMins < currentMins) {
          setSubmitError("Please select a valid future time for today.");
          return;
        }
      }
      setStep(4);
    } else if (step === 4) {
      const isDigitsOnly = /^\d+$/.test(formData.phone);
      if (formData.phone.length !== 10 || !isDigitsOnly) {
        setSubmitError("Enter valid 10-digit mobile number.");
        return;
      }
      setStep(5);
    } else if (step < 5) {
      setStep(s => Math.min(s + 1, 5));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSubmitError("");
    if (step === 3 && isFixedPlan) {
      setStep(1);
    } else if (step === 2) {
      setStep(1);
    } else if (step > 1) {
      setStep(s => Math.max(s - 1, 1));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: val });
  };

  const submitBooking = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError("");
      
      const packageDetails = getPackageDetails(formData.packageType);
      
      const payload = {
        packageType: formData.packageType,
        packageName: packageDetails.name,
        temples: formData.selectedTemples.map(id => {
          const t = dbTemples.find(temple => temple._id === id);
          return t ? { _id: t._id, name: t.name, price: t.price } : null;
        }).filter(Boolean),
        selectedTemples: formData.selectedTemples.map(id => {
          const t = dbTemples.find(temple => temple._id === id);
          return t ? t.name : "";
        }).filter(Boolean),
        totalPrice: calculateTotal(),
        name: formData.name,
        phone: formData.phone,
        pickup: formData.pickup,
        hotel: formData.hotel,
        date: formData.date,
        time: formData.time,
        notes: formData.notes
      };

      const res = await fetch("/api/custom-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Submission failed");
      
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTemple = (id: string) => {
    if (formData.packageType === "five") return;
    
    setFormData(prev => ({
      ...prev,
      selectedTemples: prev.selectedTemples.includes(id)
        ? prev.selectedTemples.filter(t => t !== id)
        : [...prev.selectedTemples, id]
    }));
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background pt-32 pb-20 flex items-center justify-center">
        <Card className="max-w-md mx-auto w-full border-none shadow-2xl shadow-green-500/10 text-center p-8 animate-in fade-in zoom-in-95 duration-500 rounded-3xl">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Booking Submitted Successfully!</h2>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Your booking request has been sent to our desk. Awaiting admin confirmation. We will notify you via WhatsApp shortly.
          </p>
          <div className="bg-muted text-left p-6 rounded-2xl space-y-3 mb-8">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Status</span>
              <span className="font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-0.5 rounded-full text-sm">Pending Approval</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">{formData.date} at {formData.time}</span>
            </div>
          </div>
          <Button onClick={() => router.push("/")} className="w-full h-14 rounded-full text-lg shadow-lg hover:scale-105 transition-transform">
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background pt-24 pb-28 md:pb-0 px-4 md:px-0">
      <div className="container-custom max-w-5xl px-4 md:px-0">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">Book Your Journey</h1>
          <p className="text-muted-foreground text-lg">Fast, reliable, and transparent booking.</p>
        </div>

        <div className="flex items-center justify-center mb-12 max-w-2xl mx-auto px-4">
          {[1, 2, 3, 4, 5].map((num, i) => {
            const showStep = isFixedPlan
              ? (num === 2 ? false : true)
              : true;
            if (!showStep) return null;
            return (
              <div key={num} className={`flex items-center ${i !== 0 ? 'flex-1' : ''}`}>
                {i !== 0 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-500 ${step >= num ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base border-2 transition-all duration-500 ${
                  step > num ? 'bg-primary border-primary text-primary-foreground' :
                  step === num ? 'border-primary text-primary shadow-lg shadow-primary/20 scale-110 bg-background' :
                  'border-border text-muted-foreground bg-background'
                }`}>
                  {step > num ? <Check size={16} /> : num}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:border-border overflow-hidden rounded-3xl">
              <div className="h-2 bg-primary w-full" />
              <CardContent className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {submitError && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="font-medium">{submitError}</p>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Select Package Type</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {PACKAGES.map((pkg) => (
                        <div 
                          key={pkg.id}
                          onClick={() => {
                            if (pkg.locked) {
                              const templeList = pkg.id === "five" ? FIVE_TEMPLE_DARSHAN_TEMPLES : CITY_TOUR_TEMPLES;
                              const lockedTemples = dbTemples.filter(t => 
                                templeList.some(name => 
                                  t.name.toLowerCase().includes(name.toLowerCase())
                                )
                              );
                              setFormData({ 
                                ...formData, 
                                packageType: pkg.id, 
                                selectedTemples: lockedTemples.map(t => t._id)
                              });
                            } else {
                              setFormData({ 
                                ...formData, 
                                packageType: pkg.id, 
                                selectedTemples: [] 
                              });
                            }
                          }}
                          className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 flex flex-col items-start gap-4 ${
                            formData.packageType === pkg.id 
                              ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className={`p-3 rounded-full ${formData.packageType === pkg.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                            <pkg.icon size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{pkg.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{pkg.desc}</p>
                            {pkg.locked && (
                              <div className="mt-3 space-y-1">
                                <p className="text-[10px] uppercase font-bold text-primary tracking-wider">Includes:</p>
                                <div className="flex flex-wrap gap-x-2 gap-y-1">
                                  {(pkg.id === "five" ? FIVE_TEMPLE_DARSHAN_TEMPLES : CITY_TOUR_TEMPLES).map((t, i) => (
                                    <span key={i} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {pkg.locked && (
                            <span className="font-extrabold text-primary text-xl mt-auto pt-2">₹{pkg.price}</span>
                          )}
                          {pkg.locked && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Lock size={12} /> Fixed selection
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Select Temples</h2>
                      <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{formData.selectedTemples.length} Selected</span>
                    </div>
                    {formData.selectedTemples.length > 0 && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {dbTemples
                          .filter(t => formData.selectedTemples.includes(t._id))
                          .map(t => t.name)
                          .join(", ")}
                      </p>
                    )}
                    {loadingTemples ? (
                      <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">Loading temples...</div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {dbTemples.map(t => {
                          const isSelected = formData.selectedTemples.includes(t._id);
                          return (
                            <div 
                              key={t._id}
                              onClick={() => toggleTemple(t._id)}
                              className={`cursor-pointer p-4 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                                isSelected 
                                  ? "bg-primary text-white border-primary shadow-md scale-[1.03]" 
                                  : "bg-background border-border hover:bg-muted hover:scale-105"
                              }`}
                            >
                              <MapPin size={20} className={isSelected ? "opacity-100" : "opacity-50"} />
                              <span className="font-semibold text-sm leading-tight">{t.name}</span>
                              <span className={`text-xs ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>+₹{t.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Trip Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-muted-foreground"><CalendarIcon size={16} /> Date</Label>
                        <Input 
                          type="date"
                          min={minDate}
                          value={formData.date} 
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="h-12 border-input focus:ring-primary text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-muted-foreground"><Clock size={16} /> Time</Label>
                        <Input 
                          type="time" 
                          value={formData.time} 
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
                          className="h-12 border-input focus:ring-primary text-base"
                        />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <Label className="flex items-center gap-2 text-muted-foreground"><MapPin size={16} /> Pickup Location (Railway Station, Bus Stand, etc.)</Label>
                        <Input 
                          placeholder="Enter your exact pickup point" 
                          value={formData.pickup} 
                          onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                          className="h-12 border-input focus:ring-primary text-base"
                        />
                      </div>
                      <div className="space-y-3 md:col-span-2 flex items-center gap-3 bg-muted/50 p-4 rounded-xl border border-border">
                        <input 
                          type="checkbox" 
                          id="hotelCheck"
                          checked={formData.hotel}
                          onChange={(e) => setFormData({...formData, hotel: e.target.checked})}
                          className="w-5 h-5 rounded text-primary focus:ring-primary"
                        />
                        <Label htmlFor="hotelCheck" className="text-base cursor-pointer">This is a Hotel/Guest House pickup</Label>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Passenger Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-muted-foreground"><User size={16} /> Full Name</Label>
                        <Input 
                          placeholder="John Doe" 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="h-12 border-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-muted-foreground"><Phone size={16} /> Mobile Number</Label>
                        <Input 
                          placeholder="10-digit number" 
                          type="text"
                          inputMode="numeric"
                          value={formData.phone} 
                          onChange={handlePhoneChange}
                          className="h-12 border-input"
                          maxLength={10}
                        />
                      </div>
                      <div className="space-y-3 md:col-span-2 flex items-center gap-3 bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-green-800 dark:text-green-300">
                        <input 
                          type="checkbox" 
                          id="waCheck"
                          checked={formData.whatsappOptIn}
                          onChange={(e) => setFormData({...formData, whatsappOptIn: e.target.checked})}
                          className="w-5 h-5 rounded text-green-600 focus:ring-green-600"
                        />
                        <Label htmlFor="waCheck" className="text-base cursor-pointer flex items-center gap-2"><MessageCircle size={18} /> Enable WhatsApp Updates for this booking</Label>
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <Label className="flex items-center gap-2 text-muted-foreground"><FileText size={16} /> Special Notes / Requests (Optional)</Label>
                        <Input 
                          placeholder="E.g., Require wheelchair accessible auto, waiting time, etc." 
                          value={formData.notes} 
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          className="h-12 border-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                    <h2 className="text-3xl font-bold mb-2">Final Review</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                      Please verify your details before submitting. You&apos;ll receive a WhatsApp confirmation once our admins approve your booking.
                    </p>
                    <div className="bg-muted p-6 rounded-2xl border border-border text-left max-w-sm mx-auto space-y-4 mb-8">
                       <div className="flex justify-between border-b pb-2">
                         <span className="text-muted-foreground">Total Fare:</span>
                         <span className="font-bold text-xl text-primary">₹{calculateTotal()}</span>
                       </div>
                       <div className="pt-1">
                          <span className="text-muted-foreground block mb-2 text-xs font-bold uppercase tracking-wider">Temples:</span>
                          <div className="flex flex-wrap gap-1.5">
                             {formData.selectedTemples.map((id, idx) => {
                               const temple = dbTemples.find(t => t._id === id);
                               return (
                               <span key={idx} className="bg-primary/5 text-primary text-[11px] px-2 py-0.5 rounded-full border border-primary/10">
                                 {temple?.name || id}
                               </span>
                             );})}
                          </div>
                       </div>
                       <div className="flex justify-between pt-2">
                         <span className="text-muted-foreground">Name:</span>
                         <span className="font-medium text-right">{formData.name || "-"}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Phone:</span>
                         <span className="font-medium text-right">+91 {formData.phone}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Date:</span>
                         <span className="font-medium text-right">{formData.date}</span>
                       </div>
                    </div>
                    <Button 
                      onClick={submitBooking}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-10 text-lg rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={22} /> Submitting...</>
                      ) : (
                        <><Check size={22} /> Confirm & Book</>
                      )}
                    </Button>
                  </div>
                )}

                {step < 5 && (
                  <div className="fixed md:static bottom-0 left-0 right-0 bg-background md:bg-transparent border-t p-4 md:p-0 md:mt-10 md:pt-6 z-50 flex items-center justify-between shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-none transition-all">
                    <Button 
                      variant="ghost" 
                      onClick={handleBack}
                      disabled={step === 1}
                      className={`text-sm md:text-base h-12 px-4 md:px-6 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                      <ChevronLeft className="mr-1 md:mr-2" size={18} /> Back
                    </Button>
                    <Button 
                      onClick={handleNext} 
                      className="text-sm md:text-base h-12 px-6 md:px-8 font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95"
                      disabled={
                        (step === 2 && formData.selectedTemples.length === 0) ||
                        (step === 3 && (!formData.date || !formData.time || !formData.pickup)) ||
                        (step === 4 && (!formData.name || formData.phone.length !== 10))
                      }
                    >
                      Next Step <ChevronRight className="ml-1 md:ml-2" size={18} />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28">
              <Card className="border-border shadow-lg rounded-3xl">
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-6 border-b pb-4">Booking Summary</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-1 uppercase text-xs font-bold tracking-wider">Package</span>
                      <span className="font-semibold text-base">{getPackageDetails(formData.packageType).name}</span>
                    </div>
                    {formData.selectedTemples.length > 0 && (
                      <div className="pt-2">
                        <span className="text-muted-foreground block mb-3 uppercase text-xs font-bold tracking-wider">
                          Selected Temples ({formData.selectedTemples.length})
                          {isFixedPlan && (
                            <span className="ml-1 inline-flex items-center gap-1">
                              <Lock size={10} />
                            </span>
                          )}
                        </span>
                        <ul className="space-y-2">
                          {formData.selectedTemples.map((id, idx) => {
                            const temple = dbTemples.find(t => t._id === id);
                            return (
                            <li key={idx} className="flex items-center gap-2 text-sm font-medium">
                              <MapPin size={12} className="text-primary" /> {temple?.name || id}
                            </li>
                          );})}
                        </ul>
                      </div>
                    )}
                    {(formData.date || formData.time) && (
                      <div className="pt-2">
                        <span className="text-muted-foreground block mb-1 uppercase text-xs font-bold tracking-wider">Schedule</span>
                        <span className="font-semibold flex items-center gap-2 text-base">
                          <CalendarIcon size={14}/> {formData.date || "-"} 
                          <span className="text-muted-foreground mx-1">|</span> 
                          <Clock size={14}/> {formData.time || "-"}
                        </span>
                      </div>
                    )}
                    {formData.pickup && (
                      <div className="pt-2">
                        <span className="text-muted-foreground block mb-1 uppercase text-xs font-bold tracking-wider">Pickup</span>
                        <span className="font-semibold flex items-start gap-1 text-base">
                          <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                          {formData.pickup} {formData.hotel && "(Hotel)"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-8 pt-4 border-t border-dashed">
                    <div className="flex items-end justify-between">
                      <span className="text-muted-foreground font-medium">Est. Total</span>
                      <span className="text-3xl font-black text-primary animate-in fade-in duration-300">₹{calculateTotal()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomBookingClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-24"><div className="animate-pulse flex flex-col items-center"><Settings size={40} className="text-primary mb-4 opacity-50" /><p className="text-muted-foreground">Loading Booking System...</p></div></div>}>
      <BookingForm />
    </Suspense>
  );
}
