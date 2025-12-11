from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from .models import Review

@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def update_user_rating(sender, instance, **kwargs):
    """
    Automatically recalculate user's average rating 
    whenever a review is created, updated, or deleted.
    
    Only PLATFORM reviews (from completed contracts) count toward ratings.
    External testimonials are shown separately but don't affect the main rating.
    """
    reviewee = instance.reviewee
    if not reviewee:
        return
    
    # Calculate average rating from ONLY verified platform reviews
    avg_rating = Review.objects.filter(
        reviewee=reviewee,
        is_verified=True,
        review_type='platform'  # ← Only contract-based reviews count
    ).aggregate(Avg('rating'))['rating__avg']
    
    # Set to 0.0 if no reviews exist yet
    if avg_rating is None:
        avg_rating = 0.0
    
    # Update the user's rating_avg field
    reviewee.rating_avg = round(avg_rating, 2)
    reviewee.save(update_fields=['rating_avg'])
    
    print(f"[Rating Updated] {reviewee.email}: {reviewee.rating_avg} ⭐ (Platform reviews only)")