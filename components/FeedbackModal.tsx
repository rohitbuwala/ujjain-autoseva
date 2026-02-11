"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";

interface FeedbackModalProps {
    trigger?: React.ReactNode;
}

export function FeedbackModal({ trigger }: FeedbackModalProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    // Try to use toast if available, otherwise fallback to alert
    // Assuming toast might not be set up, I'll use simple alert for now as per minimal setup

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (rating === 0) {
            alert("Please select a rating");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment }),
            });

            if (!res.ok) {
                throw new Error("Failed to submit");
            }

            alert("Thank you for your feedback!");
            setOpen(false);
            setRating(0);
            setComment("");
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Rate Us</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rate Your Experience</DialogTitle>
                    <DialogDescription>
                        How was your journey with Ujjain AutoSeva?
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="flex justify-center gap-2 py-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`p-1 transition-all ${rating >= star ? "text-yellow-500 scale-110" : "text-input hover:text-yellow-200"}`}
                                onClick={() => setRating(star)}
                            >
                                <Star size={32} fill={rating >= star ? "currentColor" : "none"} />
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="comment">Your Feedback</Label>
                        <Textarea
                            id="comment"
                            placeholder="Tell us what you liked or how we can improve..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none h-32"
                        />
                    </div>

                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Feedback
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
