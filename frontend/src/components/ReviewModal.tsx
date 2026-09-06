import React, { useState } from "react";
import { createProductReview } from "../services/reviewApi";
import type { ReviewDto } from "../services/reviewApi";

interface ReviewModalProps {
  productId: number;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewAdded: (newReview: ReviewDto) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  productId,
  productName,
  isOpen,
  onClose,
  onReviewAdded,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please enter your review feedback.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const review = await createProductReview(productId, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      onReviewAdded(review);
      onClose();
      setTitle("");
      setComment("");
      setRating(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <span className="cart-badge-eyebrow">VERIFIED BUYER FEEDBACK</span>
            <h3 className="modal-title">Review {productName}</h3>
          </div>
          <button onClick={onClose} className="btn-admin-del" style={{ padding: "6px 12px" }}>
            ✕
          </button>
        </div>

        {error && (
          <div className="order-cancelled-box" style={{ padding: "10px 14px", marginTop: "12px", background: "#fef2f2", borderColor: "#fecaca" }}>
            <span>⚠️</span>
            <span style={{ fontSize: "12px" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form">
          {/* Star selector */}
          <div className="form-group-block">
            <label className="input-label-stylish">Your Overall Rating</label>
            <div className="interactive-stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`star-select-btn ${(hoverRating || rating) >= star ? "is-filled" : ""}`}
                >
                  ★
                </button>
              ))}
              <span className="star-rating-hint">
                {rating === 5 && "⭐ Excellent - Highly Recommended"}
                {rating === 4 && "👍 Good - Very Satisfied"}
                {rating === 3 && "👌 Average - Decent"}
                {rating === 2 && "👎 Below Expectations"}
                {rating === 1 && "❌ Poor Quality"}
              </span>
            </div>
          </div>

          <div className="form-group-block">
            <label className="input-label-stylish">Headline / Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Great build quality, fast delivery!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="styled-input-field"
            />
          </div>

          <div className="form-group-block">
            <label className="input-label-stylish">Detailed Review *</label>
            <textarea
              rows={4}
              placeholder="What did you like or dislike? How does it perform in daily use?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="styled-input-field"
              required
            />
          </div>

          <div className="modal-actions-row">
            <button type="button" onClick={onClose} className="btn-refresh-orders" style={{ padding: "10px 18px" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-hero-primary"
              style={{ padding: "10px 22px" }}
            >
              {submitting ? "Submitting Review..." : "Submit Review ⭐"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
