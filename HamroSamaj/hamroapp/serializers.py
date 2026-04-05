from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import BlogPost, Follow, User,Visitor,Payment,Complaint,Vote,Comment,PostImage,Post,Room,ChatRoom,Message,ChatRoomName,AdminSubscriptionPayment,SecurityPayment,BlockedUser
from decouple import config
import stripe


class UserSerializer(serializers.ModelSerializer):
    stripe_account_active = serializers.SerializerMethodField()
    room_number = serializers.CharField(write_only=True, required=False)
    monthly_rent = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False)
    room_details = serializers.SerializerMethodField(read_only=True)
    apartmentName = serializers.CharField(required=False)
    subscription_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'apartmentName', 'profileImage',
            'stripe_account_active', 'room_number', 'monthly_rent', 'room_details',
            'first_name', 'last_name', 'gender', 'address','subscription_price','salary'
        ]
        
    def validate(self, data):
        role = data.get('role')
        room_number = data.get('room_number')
        monthly_rent = data.get('monthly_rent')
        username = data.get('username')
        email = data.get('email')
        apartmentName = data.get('apartmentName', self.context['request'].user.apartmentName if role in ['resident', 'security'] else None)
        subscription_price = data.get('subscription_price')
        salary = data.get('salary')

        if not role:
            raise serializers.ValidationError({'role': 'This field is required.'})

        if role == 'admin':
            if self.instance:
                if subscription_price is None or subscription_price <= 0:
                    raise serializers.ValidationError({'subscription_price': 'A valid subscription price greater than 0 is required for admins.'})
            else:
                if subscription_price is None:
                    data['subscription_price'] = 0
                elif subscription_price <= 0:
                    raise serializers.ValidationError({'subscription_price': 'Subscription price must be greater than 0.'})

        if role == 'security':
            if self.instance: 
                if salary is None or salary <= 0:
                    raise serializers.ValidationError({'salary': 'A valid salary greater than 0 is required for security users.'})
            else:
                if salary is None or salary <= 0:
                    raise serializers.ValidationError({'salary': 'A valid salary greater than 0 is required for security users.'})
            if room_number or monthly_rent:
                raise serializers.ValidationError({
                    'room_number': 'This field should not be provided for security guards.',
                    'monthly_rent': 'This field should not be provided for security guards.'
                })

        # Check uniqueness for username and email within apartmentName
        if User.objects.filter(username=username, apartmentName=apartmentName).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError({'username': 'A user with this username already exists in this apartment.'})
        if User.objects.filter(email=email, apartmentName=apartmentName).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists in this apartment.'})

        # Check apartmentName uniqueness for admins
        if role == 'admin' and apartmentName:
            if User.objects.filter(role='admin', apartmentName=apartmentName).exclude(id=self.instance.id if self.instance else None).exists():
                raise serializers.ValidationError({'apartmentName': 'An admin with this apartmentName already exists.'})

        if role == 'resident':
            if not room_number or not monthly_rent:
                raise serializers.ValidationError({
                    'room_number': 'This field is required for residents.',
                    'monthly_rent': 'This field is required for residents.'
                })
        elif role == 'security':
            if room_number or monthly_rent:
                raise serializers.ValidationError({
                    'room_number': 'This field should not be provided for security guards.',
                    'monthly_rent': 'This field should not be provided for security guards.'
                })
        return data

    def to_internal_value(self, data):
        internal_data = super().to_internal_value(data)
        role = internal_data.get('role')
        if role in ['resident', 'security']:
            if not self.context['request'].user.apartmentName:
                raise serializers.ValidationError({'apartmentName': 'Admin must have an apartmentName to add users.'})
            internal_data['apartmentName'] = self.context['request'].user.apartmentName
        return internal_data

    def create(self, validated_data):
        room_number = validated_data.pop('room_number', None)
        monthly_rent = validated_data.pop('monthly_rent', None)
        subscription_price = validated_data.pop('subscription_price', None)
        salary = validated_data.pop('salary', None)
        created_by = validated_data.pop('created_by', None)

        if validated_data.get('role') == 'admin' and 'apartmentName' not in validated_data:
            raise serializers.ValidationError({'apartmentName': 'This field is required for admins.'})

        user = User.objects.create(**validated_data, created_by=created_by,subscription_price=subscription_price,salary=salary)
        
        if room_number and monthly_rent and validated_data.get('role') == 'resident':
            if Room.objects.filter(room_number=room_number, apartment=self.context['request'].user).exists():
                raise serializers.ValidationError({'room_number': 'A room with this number already exists in this apartment.'})
            Room.objects.create(
                room_number=room_number,
                monthly_rent=monthly_rent,
                apartment=self.context['request'].user,
                resident=user
            )
        return user

    def get_room_details(self, obj):
        if obj.role == 'resident':
            try:
                room = Room.objects.get(resident=obj)
                return {
                    'room_number': room.room_number,
                    'monthly_rent': str(room.monthly_rent)
                }
            except Room.DoesNotExist:
                return None
        return None


    def get_stripe_account_active(self, obj):
        if not obj.stripe_account_id:
            return False
        try:
            stripe.api_key = config('STRIPE_SECRET_KEY')
            account = stripe.Account.retrieve(obj.stripe_account_id)
            return account.charges_enabled
        except stripe.StripeError:
            return False


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['room_number', 'monthly_rent']


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'followed', 'created_at']

#For payments

class PaySerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.username', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'resident_name', 'period_from', 'period_to', 'amount', 'room_number', 
                  'stripe_payment_id', 'created_at', 'status', 'admin', 'resident', 'room']
        read_only_fields = ['resident_name', 'stripe_payment_id','room_number', 'created_at']       
  
class AdminSubscriptionPaymentSerializer(serializers.ModelSerializer):       #new field whole 
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    superadmin_username = serializers.CharField(source='superadmin.username', read_only=True)

    class Meta:
        model = AdminSubscriptionPayment
        fields = ['id', 'admin', 'superadmin', 'admin_username', 'superadmin_username', 'amount', 'stripe_payment_id', 'created_at', 'status', 'subscription_year','subscription_end_date']
        read_only_fields = ['admin_username', 'superadmin_username', 'created_at','subscription_end_date']


class SecurityPaymentSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    security_username = serializers.CharField(source='security.username', read_only=True)

    class Meta:
        model = SecurityPayment
        fields = ['id', 'admin', 'security', 'admin_username', 'security_username', 'amount', 'stripe_payment_id', 'created_at', 'status', 'payment_year', 'payment_end_date']
        read_only_fields = ['admin_username', 'security_username', 'created_at', 'payment_end_date']
 
#For visitor section 
     
class VisitorSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.username', read_only=True)
    
    class Meta:
        model = Visitor
        fields = ['id', 'name', 'purpose', 'date', 'expected_time', 'status', 
                 'resident_name', 'unit', 'check_in_time', 'check_out_time', 
                 'created_at', 'updated_at']
        read_only_fields = ['check_in_time', 'check_out_time', 'created_at', 'updated_at']

    def validate(self, data):
        if 'date' not in data:
            raise serializers.ValidationError({"date": "This field is required."})
        if 'expected_time' not in data:
            raise serializers.ValidationError({"expected_time": "This field is required."})
        return data

#for complaint section    

class ComplaintSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    apartment_name = serializers.CharField(source='user.apartmentName', read_only=True)
    
    class Meta:
        model = Complaint
        fields = ['id', 'username', 'apartment_name', 'complaint_type', 'subject', 
                 'description', 'room_number', 'status', 'response', 
                 'created_at', 'updated_at','sentiment_score', 'sentiment', 'custom_sentiment']
        read_only_fields = ['created_at', 'updated_at','sentiment_score', 'sentiment', 'custom_sentiment']
        
        
#community hub
class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'image']


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    profileImage = serializers.URLField(source='user.profileImage', read_only=True, allow_null=True)
    role = serializers.CharField(source='user.role', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'user_id', 'role','profileImage', 'content', 'parent', 'created_at', 'updated_at', 'replies']
        read_only_fields = ['created_at', 'updated_at']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'user', 'post', 'vote_type']
        read_only_fields = ['user']


class PostSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id',read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    profileImage = serializers.URLField(source='user.profileImage', read_only=True)
    comments = serializers.SerializerMethodField()
    upvotes = serializers.SerializerMethodField()
    downvotes = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'user', 'user_id', 'content', 'images', 'profileImage','comments', 'upvotes', 'downvotes', 'user_vote', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'user_id', 'images', 'comments', 'upvotes', 'downvotes', 'user_vote', 'created_at', 'updated_at']
    
    def validate_content(self, value):
        if not value or value.strip() == '':
            raise serializers.ValidationError("Content cannot be empty")
        return value

    def get_comments(self, obj):
        top_level_comments = obj.comments.filter(parent__isnull=True)
        return CommentSerializer(top_level_comments, many=True).data

    def get_upvotes(self, obj):
        return obj.votes.filter(vote_type='upvote').count()

    def get_downvotes(self, obj):
        return obj.votes.filter(vote_type='downvote').count()

    def get_user_vote(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            vote = obj.votes.filter(user=user).first()
            return vote.vote_type if vote else None
        return None

#chat components
User = get_user_model()

class ChatRoomNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoomName
        fields = ['user', 'custom_name']

class ChatRoomSerializer(serializers.ModelSerializer):
    participants = serializers.SlugRelatedField(many=True, read_only=True, slug_field='username')
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    custom_name = serializers.SerializerMethodField()
    is_blocked = serializers.SerializerMethodField()
    blocked_by_me = serializers.SerializerMethodField()

    def get_custom_name(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            custom_name_obj = obj.custom_names.filter(user=request.user).first()
            return custom_name_obj.custom_name if custom_name_obj else None
        return None
    
    def get_is_blocked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and not obj.is_group:
            return BlockedUser.objects.filter(
                chat_room=obj,
                blocker=request.user
            ).exists() or BlockedUser.objects.filter(
                chat_room=obj,
                blocked_user=request.user
            ).exists()
        return False

    def get_blocked_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and not obj.is_group:
            return BlockedUser.objects.filter(
                chat_room=obj,
                blocker=request.user
            ).exists()
        return False

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'custom_name', 'is_group', 'apartment_name', 'participants', 'created_by', 'is_blocked', 'blocked_by_me']

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username')
    class Meta:
        model = Message
        fields = ['sender', 'body', 'timestamp']
        
#blog component

class BlogPostSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='created_by.username', read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'content', 'image', 'created_at', 'updated_at', 'is_published', 'author']
        read_only_fields = ['created_at', 'updated_at', 'author']
