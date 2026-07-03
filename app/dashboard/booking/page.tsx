"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, CreditCard, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let razorpayScriptPromise: Promise<boolean> | null = null;

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: string,
    callback: (response: { error?: { description?: string } }) => void
  ) => void;
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

interface Booking {
  _id: string;
  bookingId?: string;
  name: string;
  phone: string;
  altPhone?: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  price: string;
  status: string;
  route?: string;
  packageType?: string;
  packageName?: string;
  notes?: string;
  hotel?: boolean;
  driverName?: string;
  driverPhone?: string;
  assignedDriver?: { name?: string; phone?: string } | null;
  temples?: Array<{ _id?: string; name: string; price?: number }>;
  selectedTemples?: string[];
  createdAt?: string;
  updatedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentDueAt?: string | null;
  paidAt?: string | null;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  email?: string;
}

function formatLabel(value?: string) {
  if (!value) return "Not set";

  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAmount(booking: Booking) {
  const amount = booking.paymentAmount || Number(booking.price) || 0;
  return `${booking.paymentCurrency || "INR"} ${amount}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";

  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getBookingTemples(booking: Booking) {
  if (Array.isArray(booking.temples) && booking.temples.length > 0) {
    return booking.temples
      .map((temple) => temple?.name?.trim())
      .filter((name): name is string => Boolean(name));
  }

  return Array.isArray(booking.selectedTemples)
    ? booking.selectedTemples.filter(Boolean)
    : [];
}

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const script = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;

    if (script) {
      script.addEventListener("load", () => resolve(true), { once: true });
      script.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const createdScript = document.createElement("script");
    createdScript.id = RAZORPAY_SCRIPT_ID;
    createdScript.src = RAZORPAY_SCRIPT_SRC;
    createdScript.async = true;
    createdScript.onload = () => resolve(true);
    createdScript.onerror = () => resolve(false);
    document.body.appendChild(createdScript);
  }).finally(() => {
    razorpayScriptPromise = null;
  });

  return razorpayScriptPromise;
}

export default function UserBookings() {

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [cancelModal, setCancelModal] = useState<{ show: boolean; booking: Booking | null }>({ show: false, booking: null });
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [onlineProcessingBookingId, setOnlineProcessingBookingId] = useState<string | null>(null);
  const [onlinePaymentError, setOnlinePaymentError] = useState<{ bookingId: string | null; message: string }>({
    bookingId: null,
    message: "",
  });
  const [cashSelectingBookingId, setCashSelectingBookingId] = useState<string | null>(null);
  const [cashPaymentError, setCashPaymentError] = useState<{ bookingId: string | null; message: string }>({
    bookingId: null,
    message: "",
  });

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  const refreshBookings = async () => {
    const res = await fetch("/api/booking/user");

    if (res.status === 401) {
      window.location.href = "/login";
      return false;
    }

    const data = await res.json();

    if (Array.isArray(data?.data)) {
      setBookings(data.data);
      return true;
    }

    return false;
  };

  useEffect(() => {

    async function loadBookings() {

      try {

        const loaded = await refreshBookings();

        if (!loaded) {
          setBookings([]);
        }

      } catch (err) {
        console.error(err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();

  }, []);

  const handleCancel = async () => {
    if (!cancelModal.booking) return;

    setCancelling(true);

    try {
      const res = await fetch(`/api/booking/${cancelModal.booking._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (res.ok) {
        setBookings(prev =>
          prev.map(b =>
            b._id === cancelModal.booking?._id
              ? { ...b, status: "cancelled" }
              : b
          )
        );
        setCancelModal({ show: false, booking: null });
        setCancelReason("");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  const clearOnlinePaymentState = (bookingId: string, message?: string) => {
    setOnlineProcessingBookingId(null);
    setOnlinePaymentError({
      bookingId: message ? bookingId : null,
      message: message || "",
    });
  };

  const handleOnlinePay = async (booking: Booking) => {
    if (onlineProcessingBookingId) return;

    setOnlineProcessingBookingId(booking._id);
    setOnlinePaymentError({ bookingId: null, message: "" });

    try {
      const res = await fetch("/api/payments/online/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        clearOnlinePaymentState(booking._id, data?.error || data?.message || "Failed to create Razorpay order");
        return;
      }

      const order = data?.data?.order;
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!publicKey) {
        clearOnlinePaymentState(booking._id, "Razorpay checkout is not configured");
        return;
      }

      if (!order?.id || typeof order.amount !== "number" || !order.currency) {
        clearOnlinePaymentState(booking._id, "Invalid Razorpay order response");
        return;
      }

      const scriptReady = await loadRazorpayScript();

      if (!scriptReady || !window.Razorpay) {
        clearOnlinePaymentState(booking._id, "Unable to load Razorpay checkout");
        return;
      }

      const checkout = new window.Razorpay({
        key: publicKey,
        amount: order.amount,
        currency: order.currency,
        name: "Ujjain AutoSeva",
        description: `Payment for ${booking.bookingId || booking._id}`,
        order_id: order.id,
        prefill: {
          name: booking.name,
          email: booking.email || "",
        },
        notes: {
          bookingId: booking.bookingId || booking._id,
          bookingMongoId: booking._id,
        },
        theme: {
          color: "#0ea5e9",
        },
        modal: {
          ondismiss: () => {
            clearOnlinePaymentState(booking._id, "Checkout closed. You can try again.");
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/online/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: booking._id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => null);

            if (!verifyRes.ok) {
              const message = verifyData?.error || verifyData?.message || "Payment verification failed";
              clearOnlinePaymentState(booking._id, message);
              showToast("error", message);
              return;
            }

            setBookings(prev =>
              prev.map(item =>
                item._id === booking._id
                  ? {
                      ...item,
                      paymentMethod: "online",
                      paymentStatus: "paid",
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      paidAt: new Date().toISOString(),
                    }
                  : item
              )
            );

            await refreshBookings().catch((err) => {
              console.error("Failed to refresh bookings after Razorpay verification:", err);
              return false;
            });

            showToast("success", verifyData?.data?.message || "Payment verified successfully");
            clearOnlinePaymentState(booking._id);
          } catch (err) {
            console.error("Razorpay verification error:", err);
            const message = "Something went wrong while verifying payment";
            clearOnlinePaymentState(booking._id, message);
            showToast("error", message);
          }
        },
      });

      checkout.on("payment.failed", (response: { error?: { description?: string } }) => {
        clearOnlinePaymentState(
          booking._id,
          response?.error?.description || "Payment failed. Please try again."
        );
      });

      checkout.open();
    } catch (err) {
      console.error("Online payment error:", err);
      clearOnlinePaymentState(booking._id, "Something went wrong while starting checkout");
    }
  };

  const handleCashSelect = async (booking: Booking) => {
    if (cashSelectingBookingId) return;

    setCashSelectingBookingId(booking._id);
    setCashPaymentError({ bookingId: null, message: "" });

    try {
      const res = await fetch("/api/payments/cash/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setCashPaymentError({
          bookingId: booking._id,
          message: data?.error || data?.message || "Failed to select cash payment",
        });
        return;
      }

      setBookings(prev =>
        prev.map(item =>
          item._id === booking._id
            ? { ...item, paymentMethod: "cash", paymentStatus: "cash_pending" }
            : item
        )
      );
    } catch (err) {
      console.error("Cash payment error:", err);
      setCashPaymentError({
        bookingId: booking._id,
        message: "Something went wrong while selecting cash payment",
      });
    } finally {
      setCashSelectingBookingId(null);
    }
  };

  if (loading) {
    return <p className="p-6 text-center">Loading...</p>;
  }

  return (

    <div className="p-4 md:p-6 space-y-6">

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm ${
            toast.type === "success"
              ? "border-green-500/20 bg-green-500 text-white"
              : "border-red-500/20 bg-red-500 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          My Bookings
        </h1>

        <span className="text-sm bg-muted px-3 py-1 rounded-full">
          Total: {bookings.length}
        </span>
      </div>

      {/* EMPTY */}

      {bookings.length === 0 ? (

        <div className="rounded-xl border border-border p-10 text-center bg-card">
          <p className="text-lg font-medium text-muted-foreground">
            No bookings found
          </p>
          <p className="text-sm text-muted-foreground/70">
            When you book a ride, it will appear here.
          </p>
        </div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {bookings.map((b) => (

            <div
              key={b._id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition"
            >

              {/* TOP */}

              <div className="flex justify-between items-start border-b pb-3 mb-3">

                <div className="text-xs font-semibold uppercase text-primary">
                  Ride Details
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    b.status === "confirmed"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : b.status === "rejected"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : b.status === "cancelled"
                      ? "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {b.status}
                </span>

              </div>

              {/* BODY */}

              <div className="space-y-3">

                {/* ROUTE */}

                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                    Route
                  </span>

                  <span className="text-foreground font-medium wrap-break-word leading-relaxed">
                    {b.route}
                  </span>
                </div>

                {/* TEMPLES */}
                {getBookingTemples(b).length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                      Temples
                    </span>
                    <div className="text-sm text-muted-foreground">
                      <ul className="list-disc list-inside space-y-0.5">
                        {getBookingTemples(b).map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* PACKAGE */}
                {(b.packageName || b.packageType) && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                      Package
                    </span>
                    <span className="text-foreground font-medium leading-relaxed">
                      {b.packageName || formatLabel(b.packageType)}
                    </span>
                  </div>
                )}

                {/* DRIVER */}
                {(b.driverName || b.driverPhone || b.assignedDriver) && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                      Driver
                    </span>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <div className="font-medium text-foreground">
                        {b.assignedDriver?.name || b.driverName || "Not assigned"}
                      </div>
                      {(b.assignedDriver?.phone || b.driverPhone) && (
                        <div>
                          {b.assignedDriver?.phone || b.driverPhone}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* NOTES */}
                {(b.notes || b.hotel !== undefined) && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                      Details
                    </span>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {typeof b.hotel === "boolean" && (
                        <div>
                          Hotel pickup: {b.hotel ? "Yes" : "No"}
                        </div>
                      )}
                      {b.notes && <div>{b.notes}</div>}
                    </div>
                  </div>
                )}

                {/* PRICE */}

                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                    Price
                  </span>

                  <span className="font-bold text-lg text-primary">
                    ₹{b.price}
                  </span>
                </div>

                {/* PAYMENT */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium capitalize text-right">
                      {formatLabel(b.paymentMethod || "none")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <span className="font-medium capitalize text-right">
                      {formatLabel(b.paymentStatus)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-primary">{formatAmount(b)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Due</span>
                    <span className="text-right">{formatDateTime(b.paymentDueAt)}</span>
                  </div>
                  {b.paidAt && (
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Paid At</span>
                      <span className="text-right">{formatDateTime(b.paidAt)}</span>
                    </div>
                  )}
                  {(b.razorpayOrderId || b.razorpayPaymentId) && (
                    <div className="space-y-1 text-xs text-muted-foreground break-all">
                      {b.razorpayOrderId && <p>Order ID: {b.razorpayOrderId}</p>}
                      {b.razorpayPaymentId && <p>Payment ID: {b.razorpayPaymentId}</p>}
                    </div>
                  )}

                  {b.paymentStatus === "payment_pending" && (
                    <div className="pt-2 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOnlinePay(b)}
                        disabled={onlineProcessingBookingId === b._id}
                      >
                        {onlineProcessingBookingId === b._id ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <CreditCard size={16} className="mr-2" />
                        )}
                        {onlineProcessingBookingId === b._id ? "Opening Checkout..." : "Pay Online"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCashSelect(b)}
                        disabled={cashSelectingBookingId === b._id}
                      >
                        <Banknote size={16} className="mr-2" />
                        {cashSelectingBookingId === b._id ? "Processing..." : "Pay Cash"}
                      </Button>
                      {cashPaymentError.bookingId === b._id && cashPaymentError.message && (
                        <p className="text-xs text-red-500">
                          {cashPaymentError.message}
                        </p>
                      )}
                      {onlinePaymentError.bookingId === b._id && onlinePaymentError.message && (
                        <p className="text-xs text-red-500">
                          {onlinePaymentError.message}
                        </p>
                      )}
                    </div>
                  )}

                  {b.paymentStatus === "cash_pending" && (
                    <p className="text-xs text-muted-foreground">
                      Cash payment selected. Awaiting collection.
                    </p>
                  )}

                  {b.paymentStatus === "paid" && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Payment completed successfully.
                    </p>
                  )}

                  {b.paymentStatus === "failed" && (
                    <p className="text-xs text-red-500">
                      Payment failed. You can retry when ready.
                    </p>
                  )}

                  {b.paymentStatus === "cash_collected" && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Cash has been collected.
                    </p>
                  )}

                  {b.paymentStatus === "not_required" && (
                    <p className="text-xs text-muted-foreground">
                      Payment will be available after booking confirmation.
                    </p>
                  )}
                </div>

                {/* DATES */}

                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                    Booked
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "N/A"}
                  </span>
                </div>

                {b.updatedAt && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                      Updated
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(b.updatedAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

              </div>

              {(b.status === "pending" || b.status === "confirmed") && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => setCancelModal({ show: true, booking: b })}
                  >
                    <X size={16} className="mr-2" />
                    Cancel Booking
                  </Button>
                </div>
              )}

            </div>

          ))}

        </div>

      )}

      {/* CANCEL MODAL */}

      {cancelModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={20} />
              </div>
              <h2 className="text-xl font-bold">Cancel Booking</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>

            {cancelModal.booking && (
              <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
                <p><strong>ID:</strong> {cancelModal.booking.bookingId || cancelModal.booking._id}</p>
                <p><strong>Route:</strong> {cancelModal.booking.route}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                rows={3}
                placeholder="Tell us why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCancelModal({ show: false, booking: null });
                  setCancelReason("");
                }}
                disabled={cancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
