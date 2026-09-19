'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, MessageSquare, User, Send, ThumbsUp } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  reviewerName: string;
  comment?: string | null;
  createdAt: string;
}

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  onRatingUpdate?: (avgRating: number, reviewCount: number) => void;
}

export function ProductReviewsSection({
  productId,
  productName,
  onRatingUpdate,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);

  // Form State
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
        setReviewCount(data.reviewCount || 0);
        if (data.distribution) {
          setDistribution(data.distribution);
        }
        if (onRatingUpdate) {
          onRatingUpdate(data.avgRating || 0, data.reviewCount || 0);
        }
      }
    } catch {
      // Failed to load reviews silently
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating < 1 || userRating > 5) {
      setErrorMsg('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          reviewerName: 'Verified Customer',
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.review) {
        setReviews((prev) => [data.review, ...prev]);
        setAvgRating(data.avgRating);
        setReviewCount(data.reviewCount);
        if (data.distribution) {
          setDistribution(data.distribution);
        }
        if (onRatingUpdate) {
          onRatingUpdate(data.avgRating, data.reviewCount);
        }

        setSuccessMsg('Thank you! Your rating and review have been submitted.');
        setComment('');
        setUserRating(5);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(data.error || 'Failed to submit review.');
      }
    } catch {
      setErrorMsg('Error connecting to network. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Star size={20} fill="#f59e0b" color="#f59e0b" />
        Customer Ratings & Reviews
      </h3>

      {/* Grid: Rating Overview & Review Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Rating Summary Card */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {reviewCount > 0 ? avgRating.toFixed(1) : 'N/A'}
              </span>
              <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ 5.0</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', margin: '0.35rem 0' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = reviewCount > 0 && star <= Math.round(avgRating);
                return (
                  <Star
                    key={star}
                    size={18}
                    fill={filled ? '#f59e0b' : '#e2e8f0'}
                    color={filled ? '#f59e0b' : '#cbd5e1'}
                  />
                );
              })}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '1rem' }}>
              {reviewCount > 0 ? `Based on ${reviewCount} verified ratings` : 'No ratings yet. Be the first to rate!'}
            </div>
          </div>

          {/* Rating Breakdown Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percent = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;

              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '28px', color: '#334155', fontWeight: 700, textAlign: 'right' }}>
                    {stars} ★
                  </span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        backgroundColor: stars >= 4 ? '#f59e0b' : stars === 3 ? '#eab308' : '#ef4444',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <span style={{ width: '32px', color: '#64748b', fontSize: '0.7rem' }}>
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write a Review Form Card */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem' }}>
            Rate & Review this Product
          </h4>

          <form onSubmit={handleSubmitReview}>
            {/* Interactive Star Picker */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Select Your Rating
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || userRating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.1rem',
                      }}
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        size={26}
                        fill={active ? '#f59e0b' : '#cbd5e1'}
                        color={active ? '#f59e0b' : '#94a3b8'}
                      />
                    </button>
                  );
                })}
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb', marginLeft: '0.5rem' }}>
                  {hoverRating || userRating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Comment Input */}
            <div style={{ marginBottom: '0.85rem' }}>
              <textarea
                placeholder="Share your feedback or thoughts about this product (optional)..."
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>

            {errorMsg && (
              <p style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginBottom: '0.5rem' }}>
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginBottom: '0.5rem' }}>
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.55rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                borderRadius: '8px',
                justifyContent: 'center',
              }}
            >
              <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </div>
      </div>

      {/* Customer Reviews List */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem' }}>
          Customer Reviews ({reviews.length})
        </h4>

        {loading ? (
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading customer reviews...</p>
        ) : reviews.length === 0 ? (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.85rem',
            }}
          >
            No user reviews submitted yet. Be the first to rate and review <strong>{productName}</strong>!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviews.map((rev) => {
              const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={rev.id}
                  className="card"
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        {rev.reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                        {rev.reviewerName}
                      </span>
                      <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                        ✓ Verified Buyer
                      </span>
                    </div>

                    <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{formattedDate}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.35rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= rev.rating ? '#f59e0b' : '#e2e8f0'}
                        color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                      />
                    ))}
                  </div>

                  {rev.comment && (
                    <p style={{ fontSize: '0.825rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                      {rev.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
