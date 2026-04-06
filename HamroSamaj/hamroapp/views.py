from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status,generics
from .models import User, Visitor, Payment,Complaint,Room,Post, PostImage, Comment, Vote,OTP,BlogPost,Follow,ChatRoom,Message,ChatRoomName,AdminSubscriptionPayment,SecurityPayment,BlockedUser,Bill,BillItem
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from .serializers import UserSerializer,VisitorSerializer,PaySerializer,ComplaintSerializer,RoomSerializer,PostSerializer, CommentSerializer, VoteSerializer,BlogPostSerializer,FollowSerializer,ChatRoomSerializer,MessageSerializer,ChatRoomSerializer,MessageSerializer,AdminSubscriptionPaymentSerializer,SecurityPaymentSerializer,BillSerializer
from django.contrib.auth.hashers import make_password
from .permissions import IsSuperAdmin,IsAdminUser
from rest_framework.permissions import AllowAny,IsAuthenticated
from django.db import IntegrityError,models,transaction
from django.core.files.storage import default_storage
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
from django.core.mail import EmailMessage
from django.db.models.functions import TruncDay, TruncMonth
from django.db.models import Count
from django.utils.timezone import now
from textblob import TextBlob
from .utils import predict_custom_sentiment
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from decimal import ROUND_HALF_UP, Decimal
from decouple import config
from django.db.models import Q
import decimal
import random
import string
import stripe



@api_view(['POST'])
@permission_classes([AllowAny])
def loginUser(request):
    identifier = request.data.get('username')
    password = request.data.get('password')
    
    if not identifier or not password:
        return Response({'error': 'Username/Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Query users by username or email
    users = User.objects.filter(models.Q(username=identifier) | models.Q(email=identifier)).distinct()
    if not users.exists():
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    # Handle superadmin case
    superadmin = users.filter(role='superadmin').first()
    if superadmin:
        user = authenticate(request, username=identifier, password=password)
        if user and user.role == 'superadmin': # type: ignore
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'username': user.username,
                'role': user.role, # type: ignore
                'apartmentName': user.apartmentName or '' # type: ignore
            }, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    # Handle multiple users with apartment selection
    if users.count() > 1:
        if 'apartmentName' not in request.data:
            apartment_list = list(str(user.apartmentName) if user.apartmentName else '' for user in users) # type: ignore
            return Response({
                'message': 'Multiple accounts found. Please select an apartment.',
                'apartments': apartment_list
            }, status=status.HTTP_300_MULTIPLE_CHOICES)
        
        # Authenticate with apartmentName
        user = authenticate(request, username=identifier, password=password, apartmentName=request.data['apartmentName'])
        if not user:
            return Response({'error': 'Invalid credentials or apartment selection'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        user = authenticate(request, username=identifier, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'username': user.username,
        'role': user.role, # type: ignore
        'apartmentName': user.apartmentName or '' # type: ignore
    }, status=status.HTTP_200_OK)
    
    

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def addAdmin(request):
    data = request.data.copy()
    data['role'] = 'admin'
    try:
        serializer = UserSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            admin_user = serializer.save(password=make_password(data['password']))

            # Automatically grant 1-year paid subscription when an apartment admin is first created
            try:
                from .models import AdminSubscriptionPayment

                superadmin = User.objects.filter(role='superadmin').first()
                if superadmin and admin_user.subscription_price and admin_user.subscription_price > 0:
                    AdminSubscriptionPayment.objects.create(
                        admin=admin_user,
                        superadmin=superadmin,
                        amount=admin_user.subscription_price,
                        stripe_payment_id='INITIAL_ADMIN_CREATION',
                        status='active',
                        subscription_year=timezone.now().year,
                        subscription_end_date=(timezone.now() + timedelta(days=365)).date()
                    )
            except Exception as sub_err:
                # Log subscription auto-creation issues but do not block admin creation
                print(f"Auto-subscription creation failed for new admin {admin_user.id}: {sub_err}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Exception: {str(e)}")  # Debug log
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def addUser(request):
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'error': 'Only admins and superadmins can add users.'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data
    print(f"Received data: {data}, Admin apartmentName: {request.user.apartmentName}")
    role = data.get('role', 'resident')
    if role not in ['resident', 'security']:
        return Response({'error': 'Admins can only create users with roles "resident" or "security".'}, 
                        status=status.HTTP_400_BAD_REQUEST)

    serializer = UserSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        try:
            with transaction.atomic():  # Ensure atomicity
                user = serializer.save(password=make_password(data['password']), created_by=request.user)
                print(f"User created: {user.username}, ID: {user.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Transaction error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    print(f"Validation errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteUser(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if request.user.role != 'admin' or user.role not in ['resident', 'security']: # type: ignore
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        Room.objects.filter(resident=user).delete()  # Delete associated room
        user.delete()
        return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsSuperAdmin])
def deleteAdmin(request, admin_id):
    try:
        admin = User.objects.get(id=admin_id, role='admin')
        admin.delete()  # Cascades to delete created users and rooms
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)



# for Profile Section

@api_view(['GET'])
def userProfile(request, user_id=None):
    if user_id:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        user = request.user
    
    serializer = UserSerializer(user)
    data = serializer.data
    data['followers_count'] = Follow.objects.filter(followed=user).count()
    data['following_count'] = Follow.objects.filter(follower=user).count()
    return Response(data, status=status.HTTP_200_OK)


# Profile Image Section
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateProfile(request):
    user = request.user
    
    allowed_fields = ['first_name', 'last_name', 'gender', 'address']
    for field in allowed_fields:
        if field in request.data:
            setattr(user, field, request.data[field])

    # Check if profile image is included in the request
    if 'profileImage' in request.FILES:
        profileImage = request.FILES['profileImage']
        
        # Save the new profile image to the server
        file_name = f"profileImages/{user.id}_{profileImage.name}"
        file_path = default_storage.save(file_name, profileImage)
        file_url = default_storage.url(file_path)
        
        # Update the user's profile with the image URL
        user.profileImage = file_url

    try:
        user.save()
    except IntegrityError as e:
        return Response({'error': f'Failed to update profile: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    # Return the updated user information
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updatePassword(request):
    user = request.user
    if user.role == 'superadmin':
        return Response({'error': 'Superadmin cannot change password'}, status=status.HTTP_403_FORBIDDEN)
    
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')
    
    if not password or not confirm_password:
        return Response({'error': 'Both password and confirm_password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(password)
    user.save()
    return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request):
    followed_id = request.data.get('followed_id')
    if not followed_id:
        return Response({'error': 'Followed user ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        followed = User.objects.get(id=followed_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.user == followed:
        return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    if Follow.objects.filter(follower=request.user, followed=followed).exists():
        return Response({'error': 'You are already following this user'}, status=status.HTTP_400_BAD_REQUEST)
    
    follow = Follow.objects.create(follower=request.user, followed=followed)
    serializer = FollowSerializer(follow)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfollow_user(request):
    followed_id = request.data.get('followed_id')
    if not followed_id:
        return Response({'error': 'Followed user ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        followed = User.objects.get(id=followed_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    follow = Follow.objects.filter(follower=request.user, followed=followed)
    if not follow.exists():
        return Response({'error': 'You are not following this user'}, status=status.HTTP_400_BAD_REQUEST)
    
    follow.delete()
    return Response({'message': 'Unfollowed successfully'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_follow_status(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    is_following = Follow.objects.filter(follower=request.user, followed=user).exists()
    return Response({'is_following': is_following}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def getAdminList(request):
    # Get all admins (users with role 'admin')
    admins = User.objects.filter(role='admin')
    serializer = UserSerializer(admins, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def getUserList(request):
    admin = request.user
    if not admin.apartmentName:
        return Response({"error": "Admin is not associated with any apartment"}, status=status.HTTP_400_BAD_REQUEST)

    # Get all admins (users with role 'admin')
    users = User.objects.filter(created_by=admin, role__in=['resident', 'security'])
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateUser(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role != 'admin' or user.role not in ['resident', 'security']: # type: ignore
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()
        if user.role == 'resident':
            room_number = request.data.get('room_number')
            monthly_rent = request.data.get('monthly_rent')
            if room_number and monthly_rent:
                try:
                    room = Room.objects.get(resident=user)
                    room.room_number = room_number
                    room.monthly_rent = monthly_rent
                    room.save()
                except Room.DoesNotExist:
                    Room.objects.create(
                        room_number=room_number,
                        monthly_rent=monthly_rent,
                        apartment=request.user,
                        resident=user
                    )
            elif room_number or monthly_rent:
                return Response({'error': 'Both room_number and monthly_rent must be provided for residents.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.data, status=status.HTTP_200_OK)
    print(f"Validation errors: {serializer.errors}")  # Debug log
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['PUT'])
@permission_classes([IsSuperAdmin])
def updateAdmin(request, admin_id):
    try:
        admin = User.objects.get(id=admin_id, role='admin')
        admin.username = request.data.get('username', admin.username)
        admin.email = request.data.get('email', admin.email)
        admin.apartmentName = request.data.get('apartmentName', admin.apartmentName)  # type: ignore
        subscription_price = request.data.get('subscription_price')
        if subscription_price is not None:
            try:
                admin.subscription_price = float(subscription_price) # type: ignore
                if admin.subscription_price <= 0: # type: ignore
                    return Response({'error': 'Subscription price must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid subscription price format.'}, status=status.HTTP_400_BAD_REQUEST)
        admin.save()
        serializer = UserSerializer(admin)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

  
# for Forgot Password Functionality

EMAIL_HEADERS = {
    'Reply-To': 'hamrosamajapp@gmail.com',
    'X-Mailer': 'HamroSamaj OTP System',
    'X-Priority': '1',
    'X-MSMail-Priority': 'High',
    'X-Importance': 'High'
}

def generateOTP():
    return ''.join(random.choices(string.digits, k=6))

@api_view(['POST'])
@permission_classes([AllowAny])
def requestOTP(request):
    """
    Request an OTP for password reset.
    """
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        
        # Generate OTP
        otp = generateOTP()
        otp_instance, created = OTP.objects.get_or_create(user=user)
        otp_instance.otp = otp
        otp_instance.created_at = now()
        otp_instance.save()

        # Prepare the email content
        subject = "HamroSamaj - Your OTP for Password Reset"
        message = f"""
        Hello,

        You requested a password reset for your HamroSamaj account.

        Your OTP for resetting your password is: {otp}

        This OTP will expire in 10 minutes. Please use it promptly. If you did not request a password reset, please ignore this email.

        Regards,
        HamroSamaj Team
        """
        
        # Create an email message with extra headers
        email_message = EmailMessage(
            subject,
            message,
            'support@hamrosamaj.com',
            [email],
            headers=EMAIL_HEADERS
        )

        # Send OTP email
        email_message.send()

        return Response({"message": "OTP sent to your email."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def resetPasswordOTP(request):
    """
    Reset password using the OTP.
    """
    email = request.data.get('email')
    otp = request.data.get('otp')
    newPassword = request.data.get('newPassword')

    try:
        user = User.objects.get(email=email)
        otp_instance = OTP.objects.get(user=user, otp=otp)

        # Check if OTP is valid (within 10 minutes)
        time_diff = now() - otp_instance.created_at
        if time_diff > timedelta(minutes=10):
            return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Reset the password
        user.set_password(newPassword)
        user.save()

        # Clean up the OTP
        otp_instance.delete()

        return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
    except OTP.DoesNotExist:
        return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)


#for visitor section

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registerVisitor(request):
    """Register a new visitor.

    - Residents can register visitors for their own apartment.
    - Security can register walk-in visitors for the apartment they guard
      (linked to their admin/creator).
    """

    role = getattr(request.user, 'role', None)
    if role not in ['resident', 'security']:
        return Response({'error': 'Only residents or security can register visitors'},
                        status=status.HTTP_403_FORBIDDEN)

    # Determine the resident and unit based on role
    if role == 'resident':
        resident = request.user
        unit = request.user.apartmentName
    else:  # security
        resident = getattr(request.user, 'created_by', None)
        if not resident:
            return Response({'error': 'Security is not linked to an admin; cannot register visitor.'},
                            status=status.HTTP_400_BAD_REQUEST)
        unit = resident.apartmentName

    # Create a data dictionary with all required fields
    visitor_data = {
        'name': request.data.get('name'),
        'address': request.data.get('address'),
        'phone_number': request.data.get('phone_number'),
        'purpose': request.data.get('purpose'),
        'date': request.data.get('date'),
        'expected_time': request.data.get('expected_time'),
        'unit': unit
    }
  
    serializer = VisitorSerializer(data=visitor_data)
    if serializer.is_valid():
        try:
            serializer.save(
                resident=resident,
                status='pending'
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': 'Failed to save visitor',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'error': 'Validation failed',
        'details': serializer.errors,
        'received_data': visitor_data
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getVisitors(request):

    if request.user.role == 'resident':
        visitors = Visitor.objects.filter(resident=request.user)
    elif request.user.role == 'security':
        visitors = Visitor.objects.filter(
            status__in=['pending', 'checked-in'],
            resident__apartmentName=request.user.apartmentName
        )
    elif request.user.role in ['admin', 'superadmin']:
        visitors = Visitor.objects.filter(
            resident__apartmentName=request.user.apartmentName
        )
    else:
        return Response({'error': 'Invalid role'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateVisitorStatus(request, visitor_id):
    """
    Update visitor status (Security only)
    """
    if request.user.role != 'security':
        return Response({'error': 'Only security personnel can update visitor status'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        visitor = Visitor.objects.get(id=visitor_id)
    except Visitor.DoesNotExist:
        return Response({'error': 'Visitor not found'}, status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    if new_status not in ['checked-in', 'checked-out', 'rejected']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    
    visitor.status = new_status
    if new_status == 'checked-in':
        visitor.check_in_time = timezone.now()
    elif new_status == 'checked-out':
        visitor.check_out_time = timezone.now()
    
    visitor.save()
    serializer = VisitorSerializer(visitor)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def visitorHistory(request):
    """
    Get visitor history with optional filters
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    status = request.query_params.get('status')
    
    visitors = Visitor.objects.filter(resident__apartmentName=request.user.apartmentName)
    
    if start_date:
        visitors = visitors.filter(date__gte=start_date)
    if end_date:
        visitors = visitors.filter(date__lte=end_date)
    if status:
        visitors = visitors.filter(status=status)
    
    serializer = VisitorSerializer(visitors, many=True)
    return Response(serializer.data)


# --------- Room helper for security/admin (for bill autosuggest) ---------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getApartmentRooms(request):
    """Return all rooms in the current apartment for admin/security.

    Used for autosuggest in bill management (room number + resident name).
    """
    user = request.user
    if user.role == 'admin':
        admin = user
    elif user.role == 'security':
        admin = getattr(user, 'created_by', None)
        if not admin:
            return Response({'error': 'Security is not linked to an admin.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'error': 'Only admin or security can view apartment rooms.'}, status=status.HTTP_403_FORBIDDEN)

    rooms = Room.objects.filter(apartment=admin).select_related('resident')
    data = [
        {
            'id': room.id,
            'room_number': room.room_number,
            'resident_id': room.resident.id if room.resident else None,
            'resident_name': room.resident.username if room.resident else None,
        }
        for room in rooms
    ]
    return Response(data)


# --------- Room helper for security/admin (for bill autosuggest) ---------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getApartmentRooms(request):
    """Return all rooms in the current apartment for admin/security.

    Used for autosuggest in bill management (room number + resident name).
    """
    user = request.user
    if user.role == 'admin':
        admin = user
    elif user.role == 'security':
        admin = getattr(user, 'created_by', None)
        if not admin:
            return Response({'error': 'Security is not linked to an admin.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'error': 'Only admin or security can view apartment rooms.'}, status=status.HTTP_403_FORBIDDEN)

    rooms = Room.objects.filter(apartment=admin).select_related('resident')
    data = [
        {
            'id': room.id,
            'room_number': room.room_number,
            'resident_id': room.resident.id if room.resident else None,
            'resident_name': room.resident.username if room.resident else None,
        }
        for room in rooms
    ]
    return Response(data)


#for payment section

stripe.api_key = config('STRIPE_SECRET_KEY')

class IsAdminOrSuperadminOrSecurity(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'superadmin', 'security']

class AdminStripeConnect(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperadminOrSecurity]
    
    def get(self, request):
        """Start Stripe Connect OAuth process for admin"""
        try:
            # Validate user role
            if request.user.role not in ['admin', 'superadmin','security']:
                return Response(
                    {'error': 'Resident cannot connect Stripe accounts'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not all([
                config('STRIPE_SECRET_KEY'),
                config('STRIPE_CLIENT_ID'),
                settings.SITE_URL
            ]):
                return Response(
                    {'error': 'Stripe configuration is incomplete'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            role = request.user.role
            if role == 'security':
                dashboard_url = f"{settings.SITE_URL}/security-dashboard/"
                setup_url = f"{settings.SITE_URL}/security-dashboard/stripe-setup"
            elif role == 'admin':
                dashboard_url = f"{settings.SITE_URL}/admin-dashboard/"
                setup_url = f"{settings.SITE_URL}/admin-dashboard/stripe-setup"
            elif role == 'superadmin':
                dashboard_url = f"{settings.SITE_URL}/superadmin-dashboard/"
                setup_url = f"{settings.SITE_URL}/superadmin-dashboard/stripe-setup"
            else:
                return Response(
                    {'error': 'Invalid user role'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                # If user already has a Stripe account ID, verify it exists
                if request.user.stripe_account_id:
                    try:
                        stripe.Account.retrieve(request.user.stripe_account_id)
                    except stripe.InvalidRequestError:
                        # Clear invalid account ID
                        request.user.stripe_account_id = None
                        request.user.save()

                # Create new account if needed
                if not request.user.stripe_account_id:
                    account = stripe.Account.create(
                        type="express",
                        email=request.user.email,
                        capabilities={
                            "card_payments": {"requested": True},
                            "transfers": {"requested": True},
                        },
                        business_type="individual",
                        metadata={
                            "user_id": str(request.user.id),
                            "apartment_name": request.user.apartmentName
                        }
                    )
                    request.user.stripe_account_id = account.id
                    request.user.save()

            except stripe.StripeError as e:
                return Response(
                    {'error': f'Failed to create Stripe account: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )


            try:
                account_links = stripe.AccountLink.create(
                    account=request.user.stripe_account_id,
                    refresh_url=setup_url,
                    return_url=dashboard_url,
                    type="account_onboarding",
                )
                return Response({'url': account_links.url})
                
            except stripe.StripeError as e:
                return Response(
                    {'error': f'Failed to create account link: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            
    def _get_or_create_stripe_account(self, user):
            """Create or get existing Stripe account for admin"""
            if user.stripe_account_id:
                return user.stripe_account_id
                
            try:
                account = stripe.Account.create(
                    type="express",
                    email=user.email,
                    capabilities={
                        "card_payments": {"requested": True},
                        "transfers": {"requested": True},
                    },
                    business_type="individual",
                    metadata={
                        "user_id": str(user.id),
                        "apartment_name": user.apartmentName
                    },
                    settings={
                        "payouts": {
                            "schedule": {
                                "interval": "manual"
                            }
                        }
                    }
                )
                
                user.stripe_account_id = account.id
                user.save()
                
                return account.id
                
            except stripe.StripeError as e:
                raise stripe.StripeError(f"Failed to create Stripe account: {str(e)}")



class StripeConnectComplete(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperadminOrSecurity]
    
    def get(self, request):
        try:
            if not request.user.stripe_account_id:
                return Response({
                    'error': 'No Stripe account connected',
                    'active': False
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # Retrieve the Stripe account status
            account = stripe.Account.retrieve(request.user.stripe_account_id)
            
            # Check if the account is fully activated
            is_active = account.charges_enabled and account.payouts_enabled
            if is_active != request.user.stripe_account_active:
                request.user.stripe_account_active = is_active
                request.user.save()
            
            if is_active:
                return Response({
                    'message': 'Stripe account successfully connected',
                    'account_id': request.user.stripe_account_id,
                    'active': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Account not fully activated. Please complete Stripe onboarding.',
                    'active': False
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except stripe.StripeError as e:
            return Response({'error': f'Stripe error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentListView(ListAPIView):
    # Only authenticated users with role 'admin' and a valid apartment
    # can see this data. We enforce that in get_queryset, so a generic
    # IsAuthenticated permission is enough here.
    permission_classes = [IsAuthenticated]
    serializer_class = PaySerializer

    def get_queryset(self):
        admin = self.request.user
        if not isinstance(admin, User) or admin.role != 'admin' or not admin.apartmentName: # type: ignore
            return Payment.objects.none()
        return Payment.objects.filter(
            admin=admin,
            resident__apartmentName=admin.apartmentName, # type: ignore
            status__in=['paid', 'advance']
        ).select_related('resident', 'room', 'admin')


# ---------------- Bill management (Security + Resident) ----------------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def securityBills(request):
    """Security can list and create bills for rooms in their apartment."""
    user = request.user
    if user.role != 'security':
        return Response({'error': 'Only security can manage bills.'}, status=status.HTTP_403_FORBIDDEN)

    admin = getattr(user, 'created_by', None)
    if not admin:
        return Response({'error': 'Security is not linked to an admin.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        bills = Bill.objects.filter(room__apartment=admin).select_related('room', 'resident', 'security')
        serializer = BillSerializer(bills, many=True)
        return Response(serializer.data)

    # POST - create bill
    room_id = request.data.get('room')
    room_number = request.data.get('room_number')

    try:
        if room_id:
            room = Room.objects.get(id=room_id, apartment=admin)
        elif room_number:
            room = Room.objects.get(room_number=room_number, apartment=admin)
        else:
            return Response({'error': 'room or room_number is required.'}, status=status.HTTP_400_BAD_REQUEST)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found for this apartment.'}, status=status.HTTP_404_NOT_FOUND)

    resident = room.resident
    if not resident:
        return Response({'error': 'Selected room does not have an assigned resident.'}, status=status.HTTP_400_BAD_REQUEST)

    bill_data = {
        'room': room.id,
        'resident': resident.id,
        'security': user.id,
        'date': request.data.get('date') or timezone.now().date(),
        'total_amount': request.data.get('total_amount') or 0,
        'items': request.data.get('items', []),
    }

    serializer = BillSerializer(data=bill_data)
    if serializer.is_valid():
        bill = serializer.save()
        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def securityBillDetail(request, bill_id):
    """Retrieve, update or delete a bill (security only)."""
    user = request.user
    if user.role != 'security':
        return Response({'error': 'Only security can manage bills.'}, status=status.HTTP_403_FORBIDDEN)

    admin = getattr(user, 'created_by', None)
    if not admin:
        return Response({'error': 'Security is not linked to an admin.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        bill = Bill.objects.select_related('room', 'resident', 'security').get(
            id=bill_id, room__apartment=admin
        )
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(BillSerializer(bill).data)

    if request.method == 'DELETE':
        bill.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PUT - full update (including items)
    data = request.data.copy()
    data.setdefault('room', bill.room.id)
    data.setdefault('resident', bill.resident.id)
    data.setdefault('security', user.id)
    serializer = BillSerializer(bill, data=data)
    if serializer.is_valid():
        bill = serializer.save()
        return Response(BillSerializer(bill).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def residentBills(request):
    """List all bills for the logged-in resident."""
    if request.user.role != 'resident':
        return Response({'error': 'Only residents can view their bills.'}, status=status.HTTP_403_FORBIDDEN)

    bills = Bill.objects.filter(resident=request.user).select_related('room', 'security')
    serializer = BillSerializer(bills, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def residentBillDetail(request, bill_id):
    """Get details of a single bill for the resident."""
    if request.user.role != 'resident':
        return Response({'error': 'Only residents can view their bills.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        bill = Bill.objects.select_related('room', 'security').get(id=bill_id, resident=request.user)
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response(BillSerializer(bill).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getAllResidentPaymentsReport(request):
    """Report of resident rent/bill payments.

    - Superadmin: sees all payments.
    - Admin: sees payments only for their own apartment.
    """
    user = request.user

    if getattr(user, 'role', None) == 'superadmin':
        qs = Payment.objects.filter(
            status__in=['paid', 'advance']
        )
    elif getattr(user, 'role', None) == 'admin':
        qs = Payment.objects.filter(
            admin=user,
            status__in=['paid', 'advance']
        )
    else:
        return Response(
            {'error': 'Only admin or superadmin can view this report.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    payments = qs.select_related('resident', 'room', 'admin')
    serializer = PaySerializer(payments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


class createBillPaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, bill_id):
        resident = request.user
        if resident.role != 'resident':
            return Response({'error': 'Only residents can pay bills'}, status=status.HTTP_403_FORBIDDEN)

        try:
            bill = Bill.objects.select_related('room', 'resident').get(id=bill_id, resident=resident)
        except Bill.DoesNotExist:
            return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)

        if bill.payment_status == 'paid':
            return Response({'error': 'Bill is already paid'}, status=status.HTTP_400_BAD_REQUEST)

        room = bill.room
        admin = room.apartment

        if not admin or not admin.pk:
            return Response({'error': 'No valid admin found for this apartment'}, status=status.HTTP_404_NOT_FOUND)

        if not admin.stripe_account_id or not admin.stripe_account_active:  # type: ignore
            return Response({'error': 'Admin has not set up payment processing'}, status=status.HTTP_400_BAD_REQUEST)

        amount = float(bill.total_amount)
        amount_cents = int(amount * 100)

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='npr',
                payment_method_types=['card'],
                transfer_data={'destination': admin.stripe_account_id},  # type: ignore
                metadata={
                    'type': 'bill',
                    'bill_id': bill.id,
                    'resident_id': resident.id,
                    'room_number': room.room_number,
                    'apartment_name': resident.apartmentName,
                    'admin_id': admin.pk,
                },
            )
        except stripe.StripeError as e:
            return Response({'error': f'Payment processing error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id,
                'amount': amount,
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getResidentPayments(request):
    resident = request.user
    if resident.role != 'resident':
        return Response({'error': 'Only residents can view their payment history'}, status=status.HTTP_403_FORBIDDEN)
    
    payments = Payment.objects.filter(
        resident=resident,
        resident__apartmentName=resident.apartmentName,
        status__in=['paid', 'advance']
    ).select_related('resident', 'room', 'admin')
    serializer = PaySerializer(payments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_rent_increase(request):
    try:
        room = Room.objects.get(resident=request.user)
        now = timezone.now().date()
        rent_increased = False
        previous_rent = float(room.monthly_rent)

        if not room.last_rent_increase:
            user_creation_date = request.user.created_at.date()
            room.last_rent_increase = user_creation_date
            room.save()
            print(f"Setting initial last_rent_increase to: {room.last_rent_increase}")


        days_since_increase = (now - room.last_rent_increase).days
        print(f"Days since last increase: {days_since_increase}")
        
        if 360 <= days_since_increase < 365:
            print("Triggering pre-increase reminder")
            return Response({
                'rent_increased': False,
                'current_rent': previous_rent,
                'last_increase_date': room.last_rent_increase,
                'reminder': f'Rent increase scheduled in {365 - days_since_increase} days'
            })
        
        if days_since_increase >= 365:
            current_rent = previous_rent * 1.05  # 5% increase
            room.monthly_rent = current_rent # type: ignore
            room.last_rent_increase = now
            room.save()
            rent_increased = True
            
            return Response({
                'rent_increased': True,
                'previous_rent': previous_rent,
                'current_rent': current_rent,
                'last_increase_date': now,
                'reminder': 'Rent has been increased by 5%'
            })

        print("No rent increase or reminder needed")
        return Response({
            'rent_increased': False,
            'current_rent': previous_rent,
            'last_increase_date': room.last_rent_increase
        })
    except Room.DoesNotExist:
        return Response({'error': 'No room found'}, status=status.HTTP_404_NOT_FOUND)
    

class createPayIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resident = request.user
        if resident.role != 'resident':
            return Response({'error': 'Only residents can make payments'}, status=status.HTTP_403_FORBIDDEN)

        try:
            room = Room.objects.get(resident=resident)
        except Room.DoesNotExist:
            return Response({'error': 'No room assigned to this resident'}, status=status.HTTP_400_BAD_REQUEST)

        admin = User.objects.filter(role='admin', apartmentName=resident.apartmentName).first()
        if not admin or not admin.pk:
            return Response({'error': 'No valid admin found for this apartment'}, status=status.HTTP_404_NOT_FOUND)

        if not admin.stripe_account_id or not admin.stripe_account_active: # type: ignore
            return Response({'error': 'Admin has not set up payment processing'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        period_from = data.get('period_from')
        period_to = data.get('period_to')

        if not all([period_from, period_to]):
            return Response({'error': 'Please provide both start and end dates.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from_date = datetime.strptime(period_from, '%Y-%m-%d').date()
            to_date = datetime.strptime(period_to, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Dates should be in YYYY-MM-DD format.'}, status=status.HTTP_400_BAD_REQUEST)

        days_covered = (to_date - from_date).days + 1
        if days_covered <= 0:
            return Response({'error': 'The end date must be after the start date.'}, status=status.HTTP_400_BAD_REQUEST)

        if days_covered % 30 != 0:
            suggested_to = from_date + timedelta(days=(days_covered // 30 + 1) * 30 - 1)
            return Response({
                'error': f'Please choose a period that’s a full 30 days (e.g., {from_date} to {suggested_to}). Current period is {days_covered} days.',
                'suggested_period_to': suggested_to.strftime('%Y-%m-%d')
            }, status=status.HTTP_400_BAD_REQUEST)

        months_covered = days_covered // 30
        if months_covered < 1:
            return Response({'error': 'The period must cover at least 30 days.'}, status=status.HTTP_400_BAD_REQUEST)


        existing_payments = Payment.objects.filter(
            resident=resident,
            room=room,
            period_from__lte=to_date,
            period_to__gte=from_date
        ).exclude(status='pending')
        if existing_payments.exists():
            return Response({
                'error': f'This period ({from_date} to {to_date}) overlaps with an existing payment.'
            }, status=status.HTTP_400_BAD_REQUEST)

        amount = float(room.monthly_rent) * months_covered
        amount_cents = int(amount * 100)

        # Create Stripe Payment Intent
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='npr',
                payment_method_types=['card'],
                transfer_data={'destination': admin.stripe_account_id}, # type: ignore
                metadata={
                    'resident_id': resident.id,
                    'room_number': room.room_number,
                    'period_from': period_from,
                    'period_to': period_to,
                    'apartment_name': resident.apartmentName,
                    'admin_id': admin.pk,
                }
            )
        except stripe.StripeError as e:
            return Response({'error': f'Payment processing error: {str(e)}', 'shouldResetForm': True}, status=status.HTTP_400_BAD_REQUEST)

        payment_data = {
            'resident': resident.id,
            'admin': admin.pk,
            'room': room.pk,
            'period_from': period_from,
            'period_to': period_to,
            'amount': amount,
            'stripe_payment_id': intent.id,
            'status': 'pending'
        }
        serializer = PaySerializer(data=payment_data)
        if serializer.is_valid():
            payment = serializer.save()
            response_data = {
                'clientSecret': intent.client_secret,
                'payment_id': payment.id,
                'payment': serializer.data,
                'shouldResetForm': True 
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmPayment(request):
    resident = request.user
    if resident.role != 'resident':
        return Response({'error': 'Only residents can confirm payments'}, status=status.HTTP_403_FORBIDDEN)

    payment_id = request.data.get('payment_id')
    payment_intent_id = request.data.get('payment_intent_id')

    if not payment_id or not payment_intent_id:
        return Response({'error': 'Payment ID and intent ID are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payment = Payment.objects.get(id=payment_id, resident=resident)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found or not authorized.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == 'succeeded':
            today = timezone.now().date()
            payment_to_date = datetime.strptime(str(payment.period_to), '%Y-%m-%d').date()
            payment.status = 'paid' if payment_to_date <= today else 'advance'
            payment.stripe_payment_id = payment_intent_id
            payment.save()
            serializer = PaySerializer(payment)

            # Generate and send invoice PDF
            invoice_pdf = generate_invoice_pdf(payment)
            response = HttpResponse(invoice_pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{payment.pk}_{resident.username}.pdf"'
            response['shouldResetForm'] = 'true'
            return response
        else:
            payment.status = 'canceled'
            payment.save()
            return Response({'error': 'Payment has not been completed yet.',
                'shouldResetForm': True}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.StripeError as e:
        payment.status = 'failed'
        payment.save()
        return Response({'error': f'Error verifying payment: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        payment.status = 'failed'
        payment.save()
        return Response({'error': f'Unexpected error: {str(e)}','shouldResetForm': True}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getResidentRoom(request):
    if request.user.role != 'resident':
        return Response({'error': 'Only residents can access room details'}, status=status.HTTP_403_FORBIDDEN)
    try:
        room = Room.objects.get(resident=request.user)
        serializer = RoomSerializer(room)
        return Response(serializer.data)
    except Room.DoesNotExist:
        return Response({'error': 'No room assigned'}, status=status.HTTP_404_NOT_FOUND)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkPaymentDue(request):
    resident = request.user
    if resident.role != 'resident':
        return Response({'error': 'Only residents can check payment dues'}, status=status.HTTP_403_FORBIDDEN)

    try:
        room = Room.objects.get(resident=resident)
    except Room.DoesNotExist:
        return Response({'error': 'No room assigned to this resident'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if not resident.created_at:
            return Response({'error': 'User creation date is not set'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        
        payments = Payment.objects.filter(resident=resident, room=room).order_by('-period_to')

        if not payments.exists():
            next_period_start = today.replace(day=1)  # Start of current month
            next_period_end = next_period_start + timedelta(days=29)  # 30-day period
            return Response({
                'reminder': f'No payments recorded. Payment of ₹{room.monthly_rent} for {next_period_start} to {next_period_end} is due soon.',
                'due_date': next_period_end.strftime('%Y-%m-%d'),
                'days_until_due': (next_period_end - today).days,
                'monthly_rent': float(room.monthly_rent)
            }, status=status.HTTP_200_OK)
            
            
        latest_payment = payments.first()
        if latest_payment:
            period_end = latest_payment.period_to
        else:
            return Response({'error': 'No payment records found.'}, status=status.HTTP_404_NOT_FOUND)
        next_period_start = period_end + timedelta(days=1)
        next_period_end = next_period_start + timedelta(days=29)  # 30 days

        days_until_period_end = (period_end - today).days

        # Check if we're within 2 days of the period end and no payment exists for the next period
        if days_until_period_end <= 2:
            next_period_payments = Payment.objects.filter(
                resident=resident,
                room=room,
                period_from=next_period_start,
                period_to=next_period_end
            )
            if not next_period_payments.exists():
                response_data = {
                    'reminder': f'Payment for {next_period_start} to {next_period_end} is due soon. Your last payment ends on {period_end}.',
                    'due_date': next_period_end.strftime('%Y-%m-%d'),
                    'days_until_due': (next_period_end - today).days,
                    'monthly_rent': float(room.monthly_rent)
                }
                
        response_data = {
            'reminder': 'No payment due at this time.',
            'monthly_rent': float(room.monthly_rent)
        }
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmBillPayment(request):
    resident = request.user
    if resident.role != 'resident':
        return Response({'error': 'Only residents can confirm bill payments'}, status=status.HTTP_403_FORBIDDEN)

    payment_intent_id = request.data.get('payment_intent_id')
    bill_id = request.data.get('bill_id')

    if not payment_intent_id or not bill_id:
        return Response({'error': 'payment_intent_id and bill_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        bill = Bill.objects.select_related('room', 'resident').get(id=bill_id, resident=resident)
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found or not authorized.'}, status=status.HTTP_404_NOT_FOUND)

    if bill.payment_status == 'paid':
        return Response(BillSerializer(bill).data, status=status.HTTP_200_OK)

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == 'succeeded':
            # Optionally validate that the intent belongs to this bill
            intent_bill_id = intent.metadata.get('bill_id') if getattr(intent, 'metadata', None) else None
            if intent_bill_id and int(intent_bill_id) != bill.id:
                return Response({'error': 'Payment does not match the specified bill.'}, status=status.HTTP_400_BAD_REQUEST)

            bill.payment_status = 'paid'
            bill.save()
            return Response(BillSerializer(bill).data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Payment has not been completed yet.'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.StripeError as e:
        return Response({'error': f'Error verifying payment: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

User = get_user_model()

class CreateAdminSubscriptionIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        admin = request.user
        if admin.role != 'admin':
            return Response({'error': 'Only admins can make subscription payments'}, status=status.HTTP_403_FORBIDDEN)

        superadmin = User.objects.filter(role='superadmin').first()
        if not superadmin or not superadmin.stripe_account_id: # type: ignore
            return Response({'error': 'Superadmin has not set up payment processing'}, status=status.HTTP_400_BAD_REQUEST)

        if not admin.subscription_price or admin.subscription_price <= 0:
            return Response({'error': 'No valid subscription price set. Please contact the superadmin.'}, status=status.HTTP_400_BAD_REQUEST)

        current_year = datetime.now().year
        existing_payment = AdminSubscriptionPayment.objects.filter(
            admin=admin,
            subscription_year=current_year,
            status='active'
        )
        if existing_payment.exists():
            return Response({'error': f'Subscription for {current_year} already paid'}, status=status.HTTP_400_BAD_REQUEST)

        amount = float(admin.subscription_price)
        amount_cents = int(amount * 100)

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='npr',
                payment_method_types=['card'],
                transfer_data={'destination': superadmin.stripe_account_id}, # type: ignore
                metadata={
                    'admin_id': admin.id,
                    'superadmin_id': superadmin.pk,
                    'subscription_year': current_year, # type: ignore
                }
            )
            return Response({
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id,
                'payment': {
                    'amount': amount,
                    'subscription_year': current_year
                }
            }, status=status.HTTP_200_OK)
        except stripe.StripeError as e:
            return Response({'error': f'Payment processing error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmAdminSubscription(request):
    admin = request.user
    if admin.role != 'admin':
        return Response({'error': 'Only admins can confirm subscription payments'}, status=status.HTTP_403_FORBIDDEN)

    payment_intent_id = request.data.get('payment_intent_id')
    if not payment_intent_id:
        return Response({'error': 'Payment intent ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == 'succeeded':
            # Check if payment already exists to avoid duplicates
            if AdminSubscriptionPayment.objects.filter(stripe_payment_id=payment_intent_id).exists():
                return Response({'error': 'Payment already processed.'}, status=status.HTTP_400_BAD_REQUEST)

            superadmin = User.objects.filter(role='superadmin').first()
            if not superadmin:
                return Response({'error': 'Superadmin not found.'}, status=status.HTTP_400_BAD_REQUEST)

            # Create payment record
            payment = AdminSubscriptionPayment.objects.create(
                admin=admin,
                superadmin=superadmin,
                amount=intent.amount / 100.0,
                stripe_payment_id=payment_intent_id,
                status='active',
                subscription_year=intent.metadata.get('subscription_year', datetime.now().year),
                subscription_end_date=(timezone.now() + timedelta(days=365)).date()
            )
            serializer = AdminSubscriptionPaymentSerializer(payment)
            return Response({
                'message': 'Subscription payment successful',
                'payment': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Payment has not been completed.'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.StripeError as e:
        return Response({'error': f'Error verifying payment: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getAdminSubscriptionPayments(request):
    user = request.user
    if user.role not in ['admin', 'superadmin']:
        return Response({'error': 'Only admins or superadmins can view subscription payments'}, status=status.HTTP_403_FORBIDDEN)

    if user.role == 'admin':
        payments = AdminSubscriptionPayment.objects.filter(admin=user).select_related('superadmin')
    else:
        payments = AdminSubscriptionPayment.objects.filter(superadmin=user).select_related('admin')
    serializer = AdminSubscriptionPaymentSerializer(payments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def recordAdminCashSubscription(request, admin_id):
    """Superadmin: record a manual (cash) 1-year subscription payment for an admin.

    Creates a new AdminSubscriptionPayment with status active and
    subscription_end_date one year from today. This is useful when
    subscription was paid outside Stripe (cash/bank transfer).
    """
    try:
        admin = User.objects.get(id=admin_id, role='admin')
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    superadmin = request.user
    if getattr(superadmin, 'role', None) != 'superadmin':
        return Response({'error': 'Only superadmin can record manual payments'}, status=status.HTTP_403_FORBIDDEN)

    # Use provided amount if given, otherwise fall back to admin.subscription_price
    raw_amount = request.data.get('amount')
    try:
        amount = float(raw_amount) if raw_amount is not None else float(admin.subscription_price or 0)
    except (TypeError, ValueError):
        return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Amount must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

    current_year = timezone.now().year
    end_date = (timezone.now() + timedelta(days=365)).date()

    payment = AdminSubscriptionPayment.objects.create(
        admin=admin,
        superadmin=superadmin,
        amount=amount,
        stripe_payment_id=f'CASH_{admin.id}_{timezone.now().strftime("%Y%m%d%H%M%S")}',
        status='active',
        subscription_year=current_year,
        subscription_end_date=end_date,
    )

    serializer = AdminSubscriptionPaymentSerializer(payment)
    return Response({
        'message': 'Manual subscription recorded for 1 year',
        'payment': serializer.data,
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkSubscriptionDue(request):
    user = request.user
    if user.role not in ['admin', 'superadmin']:
        return Response({'error': 'Only admins or superadmins can check subscription dues'}, status=status.HTTP_403_FORBIDDEN)

    today = timezone.now().date()
    reminders = []

    if user.role == 'admin':
        payments = AdminSubscriptionPayment.objects.filter(admin=user, status='active').order_by('-subscription_end_date')
        if not payments.exists():
            return Response({
                'reminder': 'No subscription payments recorded. Please pay your subscription.',
                'due_date': today.strftime('%Y-%m-%d'),
                'days_until_due': 0
            }, status=status.HTTP_200_OK)

        latest_payment = payments.first()
        if latest_payment:
            end_date = latest_payment.subscription_end_date
        else:
            return Response({'error': 'No active subscription payment found.'}, status=status.HTTP_404_NOT_FOUND)
        if end_date is None:
            return Response({
                'error': 'Subscription end date is not set for the active payment.'
            }, status=status.HTTP_400_BAD_REQUEST)

        days_until_due = (end_date - today).days
        
        if 0 <= days_until_due <= 7:
            reminders.append({
                'reminder': f'Your subscription ends on {end_date}. Please renew your subscription for {end_date.year + 1}.',
                'due_date': end_date.strftime('%Y-%m-%d') if end_date else None,
                'days_until_due': days_until_due,
                'amount_due': float(user.subscription_price)
            })

    elif user.role == 'superadmin':
        payments = AdminSubscriptionPayment.objects.filter(superadmin=user, status='active').select_related('admin')
        for payment in payments:
            end_date = payment.subscription_end_date
            days_until_due = (end_date - today).days # type: ignore
            if 0 <= days_until_due <= 7:
                reminders.append({
                    'reminder': f"Admin {payment.admin.username}'s subscription ends on {end_date}. They need to renew for {end_date.year + 1}.", # type: ignore
                    'admin_id': payment.admin.id, # type: ignore
                    'due_date': end_date.strftime('%Y-%m-%d') if end_date else None,
                    'days_until_due': days_until_due,
                    'amount_due': float(payment.admin.subscription_price) if payment.admin.subscription_price is not None else 0.0
                })

    if user.role == 'admin' and not reminders:
        return Response({
            'reminder': 'No subscription payments due within the next 7 days.',
            'due_date': None,
            'days_until_due': None
        }, status=status.HTTP_200_OK)

    if user.role == 'superadmin' and not reminders:
        return Response({'reminder': 'No subscription payments due within the next 7 days.'}, status=status.HTTP_200_OK)

    return Response(reminders, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def extendAdminSubscription(request, admin_id):
    """Superadmin: give an admin a one-time 7 day grace extension.

    This updates the latest active AdminSubscriptionPayment for that admin
    by setting its extended_until date.
    """
    try:
        admin = User.objects.get(id=admin_id, role='admin')
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    latest_payment = AdminSubscriptionPayment.objects.filter(admin=admin).order_by('-subscription_end_date').first()
    if not latest_payment or not latest_payment.subscription_end_date:
        return Response({'error': 'No subscription record with an end date found for this admin.'}, status=status.HTTP_400_BAD_REQUEST)

    # Prevent stacking multiple 7 day extensions on the same payment
    if latest_payment.extended_until and latest_payment.extended_until > latest_payment.subscription_end_date:
        return Response({'error': 'This subscription has already been extended.'}, status=status.HTTP_400_BAD_REQUEST)

    base_end = latest_payment.subscription_end_date
    latest_payment.extended_until = base_end + timedelta(days=7)
    latest_payment.save()

    serializer = AdminSubscriptionPaymentSerializer(latest_payment)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def toggleAdminAccess(request, admin_id):
    """Superadmin: activate/deactivate an admin's ability to log in.

    This uses Django's built-in User.is_active flag.
    """
    try:
        admin = User.objects.get(id=admin_id, role='admin')
    except User.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    is_active = request.data.get('is_active')
    if is_active is None:
        return Response({'error': 'is_active field is required.'}, status=status.HTTP_400_BAD_REQUEST)

    admin.is_active = bool(is_active)
    admin.save()

    return Response({
        'admin_id': admin.id,
        'username': admin.username,
        'is_active': admin.is_active
    }, status=status.HTTP_200_OK)

    if not reminders:
        return Response({'reminder': 'No subscription payments due within the next 7 days.'}, status=status.HTTP_200_OK)
    return Response(reminders, status=status.HTTP_200_OK)


class CreateSecurityPaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        admin = request.user
        if admin.role != 'admin':
            return Response({'error': 'Only admins can make security payments'}, status=status.HTTP_403_FORBIDDEN)

        security_id = request.data.get('security_id')
        payment_year = request.data.get('payment_year', datetime.now().year)
        if not security_id or not str(security_id).isdigit():
            return Response({'error': 'Security ID must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            security = User.objects.get(id=security_id, role='security', apartmentName=admin.apartmentName)
        except User.DoesNotExist:
            return Response({'error': 'Security user not found or not in your apartment'}, status=status.HTTP_404_NOT_FOUND)

        if not security.stripe_account_id: # type: ignore
            return Response({'error': 'Security user has not set up payment processing'}, status=status.HTTP_400_BAD_REQUEST)

        if not security.salary or security.salary <= 0: # type: ignore
            return Response({'error': 'No valid salary set for this security user'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not security.created_at: # type: ignore
            return Response({'error': 'Security user creation date is not set'}, status=status.HTTP_400_BAD_REQUEST)

        existing_payment = SecurityPayment.objects.filter(
            admin=admin,
            security=security,
            payment_year=payment_year,
            status='success'
        )
        
        if existing_payment.exists():
            return Response({'error': f'Payment for {payment_year} already made'}, status=status.HTTP_400_BAD_REQUEST)

        if not security.last_salary_increase: # type: ignore
            security.last_salary_increase = security.created_at.date() # type: ignore
            security.save()
        
        years_since_increase = (datetime.now().date() - security.last_salary_increase).days // 365 # type: ignore
        if years_since_increase >= 1:
            security.salary = float(security.salary) * (1.10 ** years_since_increase) # type: ignore
            security.last_salary_increase = datetime.now().date() # type: ignore
            security.save()

        years_since_creation = (datetime.now().year - security.created_at.year) # type: ignore
        salary_increase_factor = 1.10 ** max(0, years_since_creation)
        adjusted_salary = float(security.salary) * salary_increase_factor # type: ignore
        amount_cents = int(adjusted_salary * 100)

        period_start = datetime.strptime(f'{payment_year}-01-01', '%Y-%m-%d').date()
        period_end = datetime.strptime(f'{payment_year}-12-31', '%Y-%m-%d').date()

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='npr',
                payment_method_types=['card'],
                transfer_data={'destination': security.stripe_account_id}, # type: ignore
                metadata={
                    'admin_id': admin.id,
                    'security_id': security.id, # type: ignore
                    'payment_year': payment_year,
                    'period_start': period_start.strftime('%Y-%m-%d'),
                    'period_end': period_end.strftime('%Y-%m-%d'),
                }
            )
            return Response({
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id,
                'payment': {
                    'amount': adjusted_salary,
                    'payment_year': payment_year,
                    'period_start': period_start.strftime('%Y-%m-%d'),
                    'period_end': period_end.strftime('%Y-%m-%d')
                }
            }, status=status.HTTP_200_OK)
        except stripe.StripeError as e:
            print(f"ERROR: Stripe error for user {security.username} (ID: {security_id}): {str(e)}")
            return Response({
                'error': f'Payment processing error: {str(e)}',
                'shouldResetForm': True
            }, status=status.HTTP_400_BAD_REQUEST)
            

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmSecurityPayment(request):
    admin = request.user
    if admin.role != 'admin':
        return Response({'error': 'Only admins can confirm security payments'}, status=status.HTTP_403_FORBIDDEN)

    payment_intent_id = request.data.get('payment_intent_id')
    if not payment_intent_id:
        return Response({'error': 'Payment intent ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == 'succeeded':
            if SecurityPayment.objects.filter(stripe_payment_id=payment_intent_id).exists():
                return Response({'error': 'Payment already processed.'}, status=status.HTTP_400_BAD_REQUEST)

            security_id = intent.metadata.get('security_id')
            try:
                security = User.objects.get(id=security_id, role='security')
            except User.DoesNotExist:
                return Response({'error': 'Security user not found.'}, status=status.HTTP_400_BAD_REQUEST)

            payment = SecurityPayment.objects.create(
                admin=admin,
                security=security,
                amount=intent.amount / 100.0,
                stripe_payment_id=payment_intent_id,
                status='success',
                payment_year=intent.metadata.get('payment_year', datetime.now().year),
                payment_end_date=(timezone.now() + timedelta(days=365)).date()
            )
            serializer = SecurityPaymentSerializer(payment)
            return Response({
                'message': 'Security payment successful',
                'payment': serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Payment has not been completed.'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.StripeError as e:
        return Response({'error': f'Error verifying payment: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getSecurityPayments(request):
    user = request.user
    if user.role not in ['admin', 'security']:
        return Response({'error': 'Only admins or security users can view security payments'}, status=status.HTTP_403_FORBIDDEN)

    if user.role == 'admin':
        payments = SecurityPayment.objects.filter(admin=user).select_related('security')
    else:
        payments = SecurityPayment.objects.filter(security=user).select_related('admin')
    serializer = SecurityPaymentSerializer(payments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recordSecurityCashPayment(request, security_id):
    """Admin: record a manual (cash) yearly salary payment for a security user.

    Creates a SecurityPayment with status 'success' and a payment_end_date
    at the end of the given payment year (default: current year).
    """
    admin = request.user
    if getattr(admin, 'role', None) != 'admin':
        return Response({'error': 'Only admins can record manual security payments'}, status=status.HTTP_403_FORBIDDEN)

    try:
        security = User.objects.get(id=security_id, role='security', apartmentName=admin.apartmentName)
    except User.DoesNotExist:
        return Response({'error': 'Security user not found for your apartment'}, status=status.HTTP_404_NOT_FOUND)

    # Determine payment year
    raw_year = request.data.get('payment_year')
    try:
        payment_year = int(raw_year) if raw_year is not None else datetime.now().year
    except (TypeError, ValueError):
        return Response({'error': 'payment_year must be a valid year'}, status=status.HTTP_400_BAD_REQUEST)

    if not security.salary or security.salary <= 0:  # type: ignore
        return Response({'error': 'No valid salary set for this security user'}, status=status.HTTP_400_BAD_REQUEST)

    existing = SecurityPayment.objects.filter(
        admin=admin,
        security=security,
        payment_year=payment_year,
        status='success',
    )
    if existing.exists():
        return Response({'error': f'Salary for {payment_year} already recorded'}, status=status.HTTP_400_BAD_REQUEST)

    amount = float(security.salary)  # type: ignore
    period_start = datetime.strptime(f'{payment_year}-01-01', '%Y-%m-%d').date()
    period_end = datetime.strptime(f'{payment_year}-12-31', '%Y-%m-%d').date()

    payment = SecurityPayment.objects.create(
        admin=admin,
        security=security,
        amount=amount,
        stripe_payment_id=f'CASH_SEC_{security.id}_{timezone.now().strftime("%Y%m%d%H%M%S")}',
        status='success',
        payment_year=payment_year,
        payment_end_date=period_end,
    )

    serializer = SecurityPaymentSerializer(payment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recordManualRentPayment(request, resident_id):
    """Admin: record a manual (cash) rent payment for a resident.

    Mirrors the period validation of card payments but directly creates
    a Payment record with status 'paid' or 'advance'.
    """
    admin = request.user
    if getattr(admin, 'role', None) != 'admin':
        return Response({'error': 'Only admins can record manual rent payments'}, status=status.HTTP_403_FORBIDDEN)

    try:
        resident = User.objects.get(id=resident_id, role='resident', apartmentName=admin.apartmentName)
    except User.DoesNotExist:
        return Response({'error': 'Resident not found for your apartment'}, status=status.HTTP_404_NOT_FOUND)

    try:
        room = Room.objects.get(resident=resident, apartment=admin)
    except Room.DoesNotExist:
        return Response({'error': 'No room assigned to this resident in your apartment'}, status=status.HTTP_400_BAD_REQUEST)

    period_from = request.data.get('period_from')
    period_to = request.data.get('period_to')

    if not all([period_from, period_to]):
        return Response({'error': 'Please provide both start and end dates.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from_date = datetime.strptime(period_from, '%Y-%m-%d').date()
        to_date = datetime.strptime(period_to, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Dates should be in YYYY-MM-DD format.'}, status=status.HTTP_400_BAD_REQUEST)

    days_covered = (to_date - from_date).days + 1
    if days_covered <= 0:
        return Response({'error': 'The end date must be after the start date.'}, status=status.HTTP_400_BAD_REQUEST)

    if days_covered % 30 != 0:
        suggested_to = from_date + timedelta(days=(days_covered // 30 + 1) * 30 - 1)
        return Response({
            'error': f'Please choose a period that’s a full 30 days (e.g., {from_date} to {suggested_to}). Current period is {days_covered} days.',
            'suggested_period_to': suggested_to.strftime('%Y-%m-%d')
        }, status=status.HTTP_400_BAD_REQUEST)

    months_covered = days_covered // 30
    if months_covered < 1:
        return Response({'error': 'The period must cover at least 30 days.'}, status=status.HTTP_400_BAD_REQUEST)

    existing_payments = Payment.objects.filter(
        resident=resident,
        room=room,
        period_from__lte=to_date,
        period_to__gte=from_date
    ).exclude(status='pending')
    if existing_payments.exists():
        return Response({
            'error': f'This period ({from_date} to {to_date}) overlaps with an existing payment.'
        }, status=status.HTTP_400_BAD_REQUEST)

    amount = float(room.monthly_rent) * months_covered
    today = timezone.now().date()
    status_value = 'paid' if to_date <= today else 'advance'

    payment = Payment.objects.create(
        resident=resident,
        admin=admin,
        room=room,
        period_from=from_date,
        period_to=to_date,
        amount=amount,
        stripe_payment_id=f'CASH_RENT_{resident.id}_{timezone.now().strftime("%Y%m%d%H%M%S")}',
        status=status_value,
    )

    serializer = PaySerializer(payment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checkSecurityPaymentDue(request):
    user = request.user
    if user.role not in ['admin', 'security']:
        return Response({'error': 'Only admins or security users can check payment dues'}, status=status.HTTP_403_FORBIDDEN)

    today = timezone.now().date()
    reminders = []
    
    def calculate_adjusted_salary(security, apply_next_year=False):
        if not security.salary or security.salary <= 0:
            return 0
        if not security.created_at:
            raise ValueError('User creation date is not set')
        
        # Initialize last_salary_increase if null
        if not security.last_salary_increase:
            security.last_salary_increase = security.created_at.date()
            security.save()

        years_since_increase = (today - security.last_salary_increase).days // 365
        if years_since_increase >= 1:
            # Apply 10% increase for each year since last increase
            security.salary = float(security.salary) * (1.10 ** years_since_increase)
            security.last_salary_increase = today
            security.save()
        
        years_since_creation = (today - security.created_at.date()).days // 365
        adjustment_factor = 1.10 ** (max(0, years_since_creation + (1 if apply_next_year else 0)))
        return float(security.salary) * adjustment_factor

    if user.role == 'admin':
        security_users = User.objects.filter(role='security', apartmentName=user.apartmentName)
        for security in security_users:
            try:
                payments = SecurityPayment.objects.filter(admin=user, security=security, status='success').order_by('-payment_end_date')
                if not payments.exists():
                    reminders.append({
                        'reminder': f'No payments recorded for {security.username}. Please pay their salary.',
                        'security_id': security.id, # type: ignore
                        'due_date': today.strftime('%Y-%m-%d'),
                        'days_until_due': 0,
                        'amount_due': calculate_adjusted_salary(security)
                    })
                    continue

                latest_payment = payments.first()
                if latest_payment:
                    if latest_payment:
                        end_date = latest_payment.payment_end_date
                    else:
                        return Response({'error': 'No active subscription payment found.'}, status=status.HTTP_404_NOT_FOUND)
                else:
                    return Response({'error': 'No payment records found.'}, status=status.HTTP_404_NOT_FOUND)
                if end_date is None:
                    return Response({
                        'error': 'End date is not set for security payments.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                days_until_due = (end_date - today).days

                if 0 <= days_until_due <= 7:
                    reminders.append({
                        'reminder': f'Payment for {security.username} ends on {end_date}. Please pay their salary for {end_date.year + 1}.',
                        'security_id': security.id, # type: ignore
                        'due_date': end_date.strftime('%Y-%m-%d'),
                        'days_until_due': days_until_due,
                        'amount_due': calculate_adjusted_salary(security, apply_next_year=True)
                    })
            except ValueError as e:
                reminders.append({
                    'reminder': f'Error for {security.username}: {str(e)}',
                    'security_id': security.id, # type: ignore
                    'due_date': today.strftime('%Y-%m-%d'),
                    'days_until_due': 0,
                    'amount_due': 0
                })

    elif user.role == 'security':
        try:    
            payments = SecurityPayment.objects.filter(security=user, status='active').order_by('-payment_end_date')
            if not payments.exists():
                return Response({
                    'reminder': 'No salary payments recorded. Please contact your admin.',
                    'due_date': today.strftime('%Y-%m-%d'),
                    'days_until_due': 0,
                    'amount_due': calculate_adjusted_salary(user)
                }, status=status.HTTP_200_OK)

            latest_payment = payments.first()
            end_date = latest_payment.payment_end_date # type: ignore
            if end_date is None:
                return Response({
                    'error': 'End date is not set for security payments.'
                }, status=status.HTTP_400_BAD_REQUEST)

            days_until_due = (end_date - today).days

            if 0 <= days_until_due <= 7:
                return Response({
                    'reminder': f'Your salary payment ends on {end_date}. Please remind your admin to pay for {end_date.year + 1}.',
                    'due_date': end_date.strftime('%Y-%m-%d'),
                    'days_until_due': days_until_due,
                    'amount_due': calculate_adjusted_salary(user, apply_next_year=True)
                }, status=status.HTTP_200_OK)
                
            return Response({
                'reminder': 'No salary payments due within the next 7 days.',
                'due_date': None,
                'days_until_due': None,
                'amount_due': calculate_adjusted_salary(user)
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({
                'reminder': f'Error: {str(e)}',
                'due_date': today.strftime('%Y-%m-%d'),
                'days_until_due': 0,
                'amount_due': 0
            }, status=status.HTTP_400_BAD_REQUEST)

    if not reminders:
        return Response({'reminder': 'No security payments due within the next 7 days.'}, status=status.HTTP_200_OK)
    return Response(reminders, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_salary_increase(request):
    user = request.user
    if user.role != 'security':
        return Response({'error': 'Only security users can check salary increases'}, status=status.HTTP_403_FORBIDDEN)

    try:
        if not user.salary or user.salary <= 0:
            return Response({'error': 'No valid salary set'}, status=status.HTTP_400_BAD_REQUEST)
        
        now = timezone.now().date()
        salary_increased = False
        previous_salary = float(user.salary)

        if not user.last_salary_increase:
            user.last_salary_increase = user.created_at.date() if user.created_at else now - timedelta(days=365)
            user.save()

        days_since_increase = (now - user.last_salary_increase).days
        if days_since_increase >= 365:
            payment_salary = previous_salary * 1.10  # 10% increase
            user.salary = payment_salary
            user.last_salary_increase = now
            user.save()
            salary_increased = True

            return Response({
                'salary_increased': True,
                'previous_salary': previous_salary,
                'current_salary': payment_salary,
                'last_increase_date': now
            }, status=status.HTTP_200_OK)

        return Response({
            'salary_increased': False,
            'current_salary': previous_salary,
            'last_increase_date': user.last_salary_increase
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': f'Error checking salary increase: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)



#for payment reports

from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,Image
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from django.http import HttpResponse
import os

def generate_invoice_pdf(payment):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []

    styles = getSampleStyleSheet()
    header_style = styles['Heading1']
    header_style.alignment = 1  # Center
    normal_style = styles['Normal']
    normal_style.fontSize = 10

    try:
        logo_path = os.path.join(settings.MEDIA_ROOT, 'logo.png')
        logo = Image(logo_path, width=1.5*inch, height=1*inch)
        elements.append(logo)
    except:
        elements.append(Paragraph("HamroSamaj", header_style))  # Fallback if logo fails

    elements.append(Paragraph("Invoice", header_style))
    elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d')}", normal_style))
    elements.append(Spacer(1, 0.2*inch))

    # Invoice Data
    resident = payment.resident
    room = payment.room
    data = [
        ['Tenant Name:', resident.username],
        ['E-mail:', resident.email or 'N/A'],
        ['Date:', payment.created_at.strftime('%Y-%m-%d')],
        ['Amount Paid:', f"₹{payment.amount}"],
        ['For Rent at:', room.room_number],
        ['Period From:', payment.period_from.strftime('%Y-%m-%d')],
        ['Period To:', payment.period_to.strftime('%Y-%m-%d')],
        ['Payment Method:', 'Stripe' if payment.stripe_payment_id else 'Cash'],  
    ]

    table = Table(data, colWidths=[1.5*inch, 4*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.green),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (0, -1), 5),
    ]))
    elements.append(table)

    # Footer
    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 12)
        canvas.drawString(inch, 0.5*inch, "HamroSamaj - Rent Payment Invoice")
        canvas.restoreState()

    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generatePaymentHistoryPDF(request):
    user = request.user
    if user.role not in ['resident', 'admin']:
        return Response({'error': 'Only residents and admins can generate payment history'}, status=status.HTTP_403_FORBIDDEN)

    payment_ids = request.data.get('payment_ids', [])
    if not payment_ids:
        return Response({'error': 'No payment IDs provided'}, status=status.HTTP_400_BAD_REQUEST)

    if user.role == 'resident':
        payments = Payment.objects.filter(resident=user, id__in=payment_ids).order_by('-created_at')
        title = f"Payment History Report\nResident: {user.username}"
        filename = f"payment_history_resident_{user.username}"
    else:  # admin
        payments = Payment.objects.filter(admin=user, id__in=payment_ids).order_by('-created_at')
        title = f"Payment History Report\nAdmin: {user.username}"
        filename = f"payment_history_admin_{user.username}"

    if not payments.exists():
        return Response({'error': 'No matching payments found'}, status=status.HTTP_404_NOT_FOUND)

    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []

    styles = getSampleStyleSheet()
    header_style = styles['Heading1']
    header_style.alignment = 1  # Center
    normal_style = styles['Normal']
    normal_style.fontSize = 10

    # Header
    elements.append(Paragraph(title, header_style))
    elements.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d')}", normal_style))
    elements.append(Spacer(1, 0.2*inch))

    # Table data with resident name and room number
    data = [['Resident', 'Room', 'Date', 'Period From', 'Period To', 'Amount', 'Status']]
    for payment in payments:
        data.append([
            payment.resident.username,  # Resident name
            payment.room.room_number,  # Room number
            payment.created_at.strftime('%Y-%m-%d'),
            payment.period_from.strftime('%Y-%m-%d'),
            payment.period_to.strftime('%Y-%m-%d'),
            f"₹{payment.amount}",
            payment.status.capitalize()
        ])

    # Table
    table = Table(data, colWidths=[1.2*inch, 1.0*inch, 1.2*inch, 1.5*inch, 1.5*inch, 1.2*inch, 1.1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.green),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
    ]))
    elements.append(table)

    # Footer
    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 12)
        canvas.drawString(inch, 0.5*inch, f"Page {doc.page} - HamroSamaj Payment Report")
        canvas.restoreState()

    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
    pdf = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
    return response


#for complaints

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submitComplaint(request):
    if request.user.role == 'resident':
        complaint_type = 'resident'
        if not request.data.get('room_number'):
            return Response({'error': 'Room number is required for resident complaints'},
                            status=status.HTTP_400_BAD_REQUEST)
    elif request.user.role == 'admin':
        complaint_type = 'admin'
    else:
        return Response({'error': 'Only residents and admins can submit complaints'},
                        status=status.HTTP_403_FORBIDDEN)
    
    data = {**request.data, 'complaint_type': complaint_type}
    serializer = ComplaintSerializer(data=data)
    if serializer.is_valid():
        complaint = serializer.save(user=request.user)
        

        # Custom model sentiment
        custom_sentiment = predict_custom_sentiment(complaint.description)
        
        complaint.custom_sentiment = custom_sentiment
        complaint.save()
        
        serializer = ComplaintSerializer(complaint)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getComplaints(request):
    if request.user.role == 'resident':
        complaints = Complaint.objects.filter(
            user=request.user,
            complaint_type='resident'
        )
    elif request.user.role == 'admin':
        complaints = Complaint.objects.filter(
            models.Q(user__apartmentName=request.user.apartmentName, complaint_type='resident') |
            models.Q(user=request.user, complaint_type='admin')
        )
    elif request.user.role == 'superadmin':
        complaints = Complaint.objects.filter(complaint_type='admin')
    else:
        return Response({'error': 'Invalid role'}, status=status.HTTP_403_FORBIDDEN)
    
            
    serializer = ComplaintSerializer(complaints, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getComplaintSentimentAnalysis(request):
    if request.user.role == 'admin':
        complaints = Complaint.objects.filter(
            models.Q(user__apartmentName=request.user.apartmentName, complaint_type='resident')
        )
    elif request.user.role == 'superadmin':
        complaints = Complaint.objects.filter(complaint_type='admin')
    else:
        return Response({'error': 'Invalid role'}, status=status.HTTP_403_FORBIDDEN)

    sentiment_data = {
        'custom': {
            'positive': complaints.filter(custom_sentiment='Positive').count(),
            'negative': complaints.filter(custom_sentiment='Negative').count(),
            'neutral': complaints.filter(custom_sentiment='Neutral').count(),
        }
    }
    return Response(sentiment_data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respondComplaint(request, complaint_id):
    try:
        if request.user.role == 'admin':
            complaint = Complaint.objects.get(
                id=complaint_id,
                complaint_type='resident',
                user__apartmentName=request.user.apartmentName
            )
        elif request.user.role == 'superadmin':
            complaint = Complaint.objects.get(
                id=complaint_id,
                complaint_type='admin'
            )
        else:
            return Response({'error': 'Invalid role'}, 
                          status=status.HTTP_403_FORBIDDEN)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    complaint.response = request.data.get('response')
    complaint.status = request.data.get('status', 'in_progress')
    complaint.save()
    
    serializer = ComplaintSerializer(complaint)
    return Response(serializer.data)


# for garphs and trends

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getComplaintTrends(request):
    six_months_ago = datetime.now() - timedelta(days=180)
    complaints = Complaint.objects.filter(created_at__gte=six_months_ago)
    if request.user.role == 'admin':
        complaints = complaints.filter(user__apartmentName=request.user.apartmentName, complaint_type='resident')
    elif request.user.role == 'superadmin':
        complaints = complaints.filter(complaint_type='admin')
    else:
        return Response({'error': 'Invalid role'}, status=403)
    
    trends = complaints.annotate(month=TruncMonth('created_at')).values('month').annotate(
        total=Count('id'),
        resolved=Count('id', filter=models.Q(status='resolved')),
        in_progress=Count('id', filter=models.Q(status='in_progress'))
    ).order_by('month')
    
    data = [
        {
            'month': item['month'].strftime('%b'),
            'total': item['total'],
            'resolved': item['resolved'],
            'in_progress': item['in_progress']
        } for item in trends
    ]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getSentimentTrends(request):
    six_months_ago = datetime.now() - timedelta(days=180)
    complaints = Complaint.objects.filter(created_at__gte=six_months_ago)
    if request.user.role == 'admin':
        complaints = complaints.filter(user__apartmentName=request.user.apartmentName, complaint_type='resident')
    elif request.user.role == 'superadmin':
        complaints = complaints.filter(complaint_type='admin')
    else:
        return Response({'error': 'Invalid role'}, status=403)
    
    trends = complaints.annotate(month=TruncMonth('created_at')).values('month').annotate(
        positive=Count('id', filter=models.Q(custom_sentiment='Positive')),
        negative=Count('id', filter=models.Q(custom_sentiment='Negative')),
        neutral=Count('id', filter=models.Q(custom_sentiment='Neutral'))
    ).order_by('month')
    
    data = [
        {
            'month': item['month'].strftime('%b'),
            'positive': item['positive'],
            'negative': item['negative'],
            'neutral': item['neutral']
        } for item in trends
    ]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getVisitorStats(request):
    if request.user.role != 'security':
        return Response({'error': 'Invalid role'}, status=403)
    
    stats = Visitor.objects.values('status').annotate(count=Count('id'))
    data = [
        {'status': item['status'], 'count': item['count']} for item in stats
    ]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getVisitorTrends(request):
    if request.user.role != 'security':
        return Response({'error': 'Invalid role'}, status=403)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    trends = Visitor.objects.filter(created_at__gte=thirty_days_ago).annotate(
        day=TruncDay('created_at')
    ).values('day').annotate(
        total=Count('id')
    ).order_by('day')
    data = [
        {'day': item['day'].strftime('%Y-%m-%d'), 'total': item['total']} for item in trends
    ]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getRecentVisitors(request):
    if request.user.role != 'security':
        return Response({'error': 'Invalid role'}, status=403)
    visitors = Visitor.objects.filter(created_at__gte=datetime.now() - timedelta(days=7))[:10]
    data = [
        {
            'id': v.id, # type: ignore
            'name': v.name,
            'status': v.status,
            'created_at': v.created_at.strftime('%Y-%m-%d %H:%M')
        } for v in visitors
    ]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getResidentComplaintTrends(request):
    if request.user.role != 'resident':
        return Response({'error': 'Invalid role'}, status=403)
    six_months_ago = datetime.now() - timedelta(days=180)
    trends = Complaint.objects.filter(
        user=request.user, created_at__gte=six_months_ago
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Count('id'),
        resolved=Count('id', filter=models.Q(status='resolved')),
        in_progress=Count('id', filter=models.Q(status='in_progress'))
    ).order_by('month')
    data = [
        {
            'month': item['month'].strftime('%b'),
            'total': item['total'],
            'resolved': item['resolved'],
            'in_progress': item['in_progress']
        } for item in trends
    ]
    return Response(data)

# for Community Hub

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    if request.user.role != 'resident':
        return Response({'error': 'Only residents can create posts'}, status=status.HTTP_403_FORBIDDEN)

    data = {'content': request.data.get('content')}
    serializer = PostSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        post = serializer.save(user=request.user)

        # Handle image uploads
        if 'images' in request.FILES:
            for image in request.FILES.getlist('images'):
                file_name = f"post_images/{post.id}_{image.name}"
                file_path = default_storage.save(file_name, image)
                file_url = default_storage.url(file_path)
                PostImage.objects.create(post=post, image=file_url)

        post = Post.objects.get(id=post.id)  # Refresh to include related fields
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id, user=request.user)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found or not authorized'}, status=status.HTTP_404_NOT_FOUND)

    data = {'content': request.data.get('content', post.content)}
    serializer = PostSerializer(post, data=data, partial=True, context={'request': request})
    if serializer.is_valid():
        post = serializer.save()
        
        replace_images = request.data.get('replace_images') == 'true'
        
        if replace_images and 'images' in request.FILES:
           
            for post_image in PostImage.objects.filter(post=post):
                try:
                    
                    file_path = post_image.image.split('/media/')[-1]
                    if default_storage.exists(file_path):
                        default_storage.delete(file_path)
                except Exception as e:
                    print(f"Error deleting file: {e}")
            
            # Delete image records from database
            PostImage.objects.filter(post=post).delete()
        
        # Handle image uploads for updates
        if 'images' in request.FILES:
            for image in request.FILES.getlist('images'):
                file_name = f"post_images/{post.id}_Updates_{image.name}"
                file_path = default_storage.save(file_name, image)
                file_url = default_storage.url(file_path)
                PostImage.objects.create(post=post, image=file_url)
        
        # Refresh post to include updated related fields
        post = Post.objects.get(id=post.id)
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id, user=request.user)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found or not authorized'}, status=status.HTTP_404_NOT_FOUND)

    post.delete()
    return Response({'message': 'Post deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_posts(request):
    if request.user.role != 'resident':
        return Response({'error': 'Only residents can view posts'}, status=status.HTTP_403_FORBIDDEN)

    posts = Post.objects.filter(user__apartmentName=request.user.apartmentName)
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    data = {
        'post': post.pk,
        'content': request.data.get('content'),
        'parent': request.data.get('parent', None),
    }
    serializer = CommentSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        post = Post.objects.get(id=post_id) 
        post_serializer = PostSerializer(post, context={'request': request})
        return Response(post_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    vote_type = request.data.get('vote_type')
    if vote_type not in ['upvote', 'downvote']:
        return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user has already voted
    vote = Vote.objects.filter(user=request.user, post=post).first()
    if vote:
        if vote.vote_type == vote_type:
            # If the same vote type, remove the vote
            vote.delete()
        else:
            # Update the vote type
            vote.vote_type = vote_type
            vote.save()
    else:
        # Create a new vote
        Vote.objects.create(user=request.user, post=post, vote_type=vote_type)

    post = Post.objects.get(id=post_id)  # Refresh to include updated votes
    serializer = PostSerializer(post, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

#for chat section

User = get_user_model()

class createPrivateChat(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'resident':
            return Response({"error": "Unauthorized"}, status=403)

        other_username = request.data.get('other_username')
        if not other_username:
            return Response({"error": "Other username required"}, status=400)

        try:
            other_user = User.objects.get(username=other_username, role='resident', apartmentName=user.apartmentName)
        except User.DoesNotExist:
            return Response({"error": "User not found or not in same apartment"}, status=404)

        # Check if either user has blocked the other
        if BlockedUser.objects.filter(
            Q(blocker=user, blocked_user=other_user, chat_room__is_group=False) |
            Q(blocker=other_user, blocked_user=user, chat_room__is_group=False)
        ).exists():
            existing_chat = ChatRoom.objects.filter(
                is_group=False,
                participants=user
            ).filter(participants=other_user).first()
            if existing_chat:
                serializer = ChatRoomSerializer(existing_chat, context={'request': request})
                return Response(serializer.data, status=200)
            return Response({"error": "Cannot create chat due to a block"}, status=400)
        
        existing_chat = ChatRoom.objects.filter(
            is_group=False,
            participants=user
        ).filter(participants=other_user).first()

        if existing_chat:
            serializer = ChatRoomSerializer(existing_chat, context={'request': request})
            return Response(serializer.data, status=200) 
        
        chat_room = ChatRoom.objects.create(apartment_name=user.apartmentName, is_group=False, created_by=user)
        chat_room.participants.add(user, other_user)
        serializer = ChatRoomSerializer(chat_room, context={'request': request})
        return Response(serializer.data, status=201) 


class chatRoomList(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Include chats where the user is a participant or was a participant
        return ChatRoom.objects.filter(participants=self.request.user)

class chatRoomDetail(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            chat_room = ChatRoom.objects.get(id=pk, participants=request.user)
            custom_name = request.data.get('custom_name')
            is_global = request.data.get('is_global', False)

            if not custom_name:
                return Response({"error": "Custom name is required"}, status=400)

            if is_global and chat_room.created_by == request.user and chat_room.is_group:
                chat_room.name = custom_name
                chat_room.save()
                chat_room.custom_names.all().delete()  # type: ignore
            else:
                ChatRoomName.objects.update_or_create(
                    chat_room=chat_room,
                    user=request.user,
                    defaults={'custom_name': custom_name}
                )

            serializer = ChatRoomSerializer(chat_room, context={'request': request})
            return Response(serializer.data)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat not found"}, status=404)

    def delete(self, request, pk):
        try:
            chat_room = ChatRoom.objects.get(id=pk, participants=request.user)
            if chat_room.is_group:
                if chat_room.created_by == request.user:
                    # Creator deletes group: fully delete it globally
                    chat_room.custom_names.all().delete()  # type: ignore # Clear custom names
                    Message.objects.filter(chat_room=chat_room).delete()  # Clear message history
                    chat_room.delete()
                else:
                    # Non-creator leaves group: remove locally
                    chat_room.participants.remove(request.user) # type: ignore
                    chat_room.save()
                    Message.objects.create(
                        chat_room=chat_room,
                        sender=request.user,
                        body=f"{request.user.username} has left the group"
                    )
            else:  
                return Response({"error": "Delete not allowed for private chats"}, status=400)
            return Response(status=204)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat not found"}, status=404)
        
        
class createGroupChat(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'resident':
            return Response({"error": "Unauthorized"}, status=403)

        apartment_name = request.data.get('apartment_name')
        group_name = request.data.get('name')
        participants = request.data.get('participants', [])
        
        if not (apartment_name and group_name and participants):
            return Response({"error": "Apartment name, group name, and participants required"}, status=400)

        existing_chat = ChatRoom.objects.filter(
            is_group=True,
            apartment_name=apartment_name,
            name=group_name
        ).first()

        if existing_chat:
            serializer = ChatRoomSerializer(existing_chat, context={'request': request})
            return Response(serializer.data, status=409)

        try:
            valid_participants = User.objects.filter(
                id__in=participants, role='resident', apartmentName=apartment_name
            )
            if not valid_participants.exists():
                return Response({"error": "No valid participants found"}, status=400)
        except Exception:
            return Response({"error": "Invalid participant IDs"}, status=400)

        chat_room = ChatRoom.objects.create(
            apartment_name=request.data['apartment_name'],
            name=group_name,
            is_group=True,
            created_by=user
        )
        participant_ids = request.data.get('participants', [])
        participants = User.objects.filter(id__in=participant_ids, role='resident', apartmentName=user.apartmentName)
        chat_room.participants.add(user, *participants)
        serializer = ChatRoomSerializer(chat_room, context={'request': request})
        return Response(serializer.data, status=201)
    
    
class messageList(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        chat_room_id = self.kwargs['chat_room_id']
        user = self.request.user
        try:
            chat_room = ChatRoom.objects.get(id=chat_room_id, participants=user)
            if BlockedUser.objects.filter(
                Q(blocker=user, chat_room=chat_room) |
                Q(blocked_user=user, chat_room=chat_room)
            ).exists():
                return Message.objects.none()
            return Message.objects.filter(chat_room_id=chat_room_id, chat_room__participants=user)
        except ChatRoom.DoesNotExist:
            return Message.objects.none()

class blockUser(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'resident':
            return Response({"error": "Unauthorized"}, status=403)
        
        chat_room_id = request.data.get('chat_room_id')
        blocked_username = request.data.get('blocked_username')
        if not (chat_room_id and blocked_username):
            return Response({"error": "Chat room ID and username required"}, status=400)

        try:
            chat_room = ChatRoom.objects.get(id=chat_room_id, participants=user, is_group=False)
            blocked_user = User.objects.get(username=blocked_username, role='resident', apartmentName=user.apartmentName)
            if blocked_user == user:
                return Response({"error": "Cannot block yourself"}, status=400)
            if not chat_room.participants.filter(id=blocked_user.id).exists(): # type: ignore
                return Response({"error": "User not in this chat"}, status=400)
            if BlockedUser.objects.filter(blocker=user, blocked_user=blocked_user, chat_room=chat_room).exists():
                return Response({"error": "User already blocked"}, status=400)
            
            BlockedUser.objects.create(blocker=user, blocked_user=blocked_user, chat_room=chat_room)
            return Response({"message": "User blocked successfully"}, status=200)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat not found"}, status=404)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class unblockUser(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        chat_room_id = request.data.get('chat_room_id')
        blocked_username = request.data.get('blocked_username')

        try:
            chat_room = ChatRoom.objects.get(id=chat_room_id, participants=user, is_group=False)
            blocked_user = User.objects.get(username=blocked_username, role='resident', apartmentName=user.apartmentName)
            try:
                block = BlockedUser.objects.get(blocker=user, blocked_user=blocked_user, chat_room=chat_room)
                block.delete()
                return Response({"message": "User unblocked successfully"}, status=200)
            except BlockedUser.DoesNotExist:
                return Response({"error": "User not blocked"}, status=400)
        except ChatRoom.DoesNotExist:
            return Response({"error": "Chat not found"}, status=404)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class residentList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        residents = User.objects.filter(apartmentName=request.user.apartmentName, role='resident').exclude(id=request.user.id)
        return Response([{"id": r.pk, "username": r.username} for r in residents])
    
    
#for blog sections

@api_view(['GET'])
@permission_classes([AllowAny])
def get_published_blogs(request):
    """Get all published blog posts for public viewing"""
    blogs = BlogPost.objects.filter(is_published=True)
    serializer = BlogPostSerializer(blogs, many=True)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([IsSuperAdmin])
def manage_blogs(request):
    """Superadmin can get all blogs or create new ones"""
    if request.method == 'GET':
        blogs = BlogPost.objects.all()
        serializer = BlogPostSerializer(blogs, many=True)
        return Response(serializer.data)
    
    serializer = BlogPostSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def blog_detail(request, blog_id):
    try:
        blog = BlogPost.objects.get(id=blog_id)
    except BlogPost.DoesNotExist:
        return Response({"error": "Blog post not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not blog.is_published:
            return Response({"error": "Blog post is not published"}, status=status.HTTP_403_FORBIDDEN)
        serializer = BlogPostSerializer(blog)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not request.user or not hasattr(request.user, 'role') or request.user.role != 'superadmin':
        return Response({"error": "You do not have permission to perform this action"}, 
                        status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = BlogPostSerializer(blog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        blog.delete()
        return Response({"message": "Blog post deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
