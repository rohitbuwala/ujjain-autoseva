"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  packageName?: string;
  selectedTemples?: string[];
  createdAt?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentDueAt?: string | null;
  paidAt?: string | null;
}

function formatPaymentStatus(status?: string) {
  return (status || "not_required").replace(/_/g, " ");
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

export default function UserBookings() {

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{ show: boolean; booking: Booking | null }>({ show: false, booking: null });
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cashSelectingBookingId, setCashSelectingBookingId] = useState<string | null>(null);
  const [cashPaymentError, setCashPaymentError] = useState<{ bookingId: string | null; message: string }>({
    bookingId: null,
    message: "",
  });

  useEffect(() => {

    async function loadBookings() {

      try {

        const res = await fetch("/api/booking/user");

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();

        setBookings(Array.isArray(data?.data) ? data.data : []);

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
                {b.selectedTemples && b.selectedTemples.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                      Temples
                    </span>
                    <div className="text-sm text-muted-foreground">
                      <ul className="list-disc list-inside space-y-0.5">
                        {b.selectedTemples.map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
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

                {b.status === "confirmed" && (b.paymentStatus === "payment_pending" || (b.paymentMethod === "cash" && b.paymentStatus === "cash_pending")) && (
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

                    {b.paymentStatus === "payment_pending" && (
                      <div className="pt-2 space-y-2">
                        <Button disabled variant="outline" size="sm" className="w-full">
                          <CreditCard size={16} className="mr-2" />
                          Pay Online
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
                      </div>
                    )}
                  </div>
                )}

                {/* DATE */}

                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                    Date
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "N/A"}
                  </span>
                </div>

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
