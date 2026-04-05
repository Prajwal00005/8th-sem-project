from django.contrib.auth.models import AbstractUser 
from django.contrib.auth import get_user_model  
from django.db import models
from django.conf import settings
import random
from datetime import datetime
import string
from django.db.models import Q


class User(AbstractUser):
    USER_ROLES = (
        ('superadmin', 'Superadmin'),
        ('admin', 'Admin'),
        ('resident', 'Resident'),
        ('security', 'Security'),
    )
    role = models.CharField(max_length=20, choices=USER_ROLES, default='superadmin')
    email = models.EmailField()
    apartmentName = models.CharField(max_length=255, null=True, blank=True)
    profileImage = models.URLField(null=True, blank=True)
    stripe_account_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_account_active = models.BooleanField(default=False)
    created_by = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='created_users', limit_choices_to={'role': 'admin'})
    username = models.CharField(max_length=150, unique=False) 
    gender = models.CharField(max_length=10, choices=(('male', 'Male'), ('female', 'Female'), ('other', 'Other')), null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    subscription_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True) 
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    last_salary_increase = models.DateField(null=True, blank=True)


    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['username', 'apartmentName'], name='unique_username_apartment'),
            models.UniqueConstraint(fields=['email', 'apartmentName'], name='unique_email_apartment'),
            models.UniqueConstraint(
                fields=['apartmentName'],
                condition=Q(role='admin'),
                name='unique_apartment_for_admin'
            )
        ]


class OTP(models.Model):
    user = models.ForeignKey('hamroapp.User', on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def generate_otp(self):
        otp = ''.join(random.choices(string.digits, k=6))
        self.otp = otp
        self.save()
        return otp

class Visitor(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('checked-in', 'Checked In'),
        ('checked-out', 'Checked Out'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=100)
    purpose = models.CharField(max_length=200)
    date = models.DateField()
    expected_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    resident = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='visitors')
    unit = models.CharField(max_length=45,null=True, blank=True)
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Follow(models.Model):
    follower = models.ForeignKey(User, related_name='following', on_delete=models.CASCADE)
    followed = models.ForeignKey(User, related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'followed')

    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"


class Room(models.Model):
    room_number = models.CharField(max_length=50)  
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    last_rent_increase = models.DateField(null=True, blank=True)
    apartment = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms', limit_choices_to={'role': 'admin'})
    resident = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='room', limit_choices_to={'role': 'resident'})

    class Meta:
        unique_together = ('room_number', 'apartment')  # Unique room_number per apartment

    def __str__(self):
        return f"{self.room_number} - ${self.monthly_rent}"


class Payment(models.Model):
    resident = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_made')
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_received')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='payments')
    period_from = models.DateField()
    period_to = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    stripe_payment_id = models.CharField(max_length=255)
    stripe_transfer_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50)

    class Meta:
        ordering = ['-created_at']


#Subscription Payment

class AdminSubscriptionPayment(models.Model): #new model
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscription_payments', limit_choices_to={'role': 'admin'})
    superadmin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscription_payments_received', limit_choices_to={'role': 'superadmin'})
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    stripe_payment_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=50,
        choices=(('active', 'Active'), ('inactive', 'Inactive')),
        default='inactive'
    )
    subscription_year = models.IntegerField(help_text="Year the subscription covers")
    subscription_end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


User = get_user_model()         # type: ignore
class SecurityPayment(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_payments_made', limit_choices_to={'role': 'admin'})
    security = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_payments_received', limit_choices_to={'role': 'security'})
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    stripe_payment_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=50,
        choices=(('success', 'Success'), ('failed', 'Failed')),
        default='failed'
    )
    payment_year = models.IntegerField(help_text="Year the payment covers")
    payment_end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


#Complaints

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved')
    ]

    COMPLAINT_TYPES = [
        ('resident', 'Resident Complaint'),
        ('admin', 'Admin Complaint')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    complaint_type = models.CharField(max_length=20, choices=COMPLAINT_TYPES)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    room_number = models.CharField(max_length=50, null=True, blank=True)  # Only for resident complaints
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sentiment_score = models.FloatField(null=True, blank=True)  # for sentiment analysis  
    sentiment = models.CharField(max_length=20, default='Neutral')  # TextBlob sentiment
    custom_sentiment = models.CharField(max_length=20, default='Neutral')  # Custom model sentiment

    class Meta:
        ordering = ['-created_at']
           
    def __str__(self):
            return self.subject


#Community hub

class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.user.username} on {self.created_at}"


class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    image = models.URLField()

    def __str__(self):
        return f"Image for post {self.post.pk}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.pk}"


class Vote(models.Model):
    VOTE_TYPES = (
        ('upvote', 'Upvote'),
        ('downvote', 'Downvote'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='votes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='votes')
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)

    class Meta:
        unique_together = ('user', 'post')  # Ensure a user can vote only once per post

    def __str__(self):
        return f"{self.vote_type} by {self.user.username} on post {self.post.pk}"
 
class ChatRoom(models.Model):
    apartment_name = models.CharField(max_length=255)
    name = models.CharField(max_length=100, blank=True)  # Default name for groups
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, limit_choices_to={'role': 'resident'})
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_chats')

    def __str__(self):
        return self.name or f"Chat in {self.apartment_name}"

class ChatRoomName(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='custom_names')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    custom_name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('chat_room', 'user')

class Message(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.body[:20]}" 

class BlockedUser(models.Model):
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocks_made')
    blocked_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocks_received')
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked_user', 'chat_room')
 

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.ImageField(upload_to='images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'superadmin'})

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
 