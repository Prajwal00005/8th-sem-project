from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from .models import User, Visitor, Payment, Complaint, Room, BlogPost
import stripe
from django.core.files.uploadedfile import SimpleUploadedFile


User = get_user_model()

class APITestSetup(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users with different roles
        self.superadmin = User.objects.create_user(
            username='superadmin', email='superadmin@example.com', 
            password='superadmin123', role='superadmin', apartmentName='Apartment1'
        )
        self.admin = User.objects.create_user(
            username='admin', email='admin@example.com', 
            password='admin123', role='admin', apartmentName='Apartment1',
            subscription_price=100.0, created_by=self.superadmin
        )
        self.resident = User.objects.create_user(
            username='resident', email='resident@example.com', 
            password='resident123', role='resident', apartmentName='Apartment1',
            created_by=self.admin
        )
        self.security = User.objects.create_user(
            username='security', email='security@example.com', 
            password='security123', role='security', apartmentName='Apartment1',
            created_by=self.admin, salary=5000.0
        )
        
        # Create a room for the resident
        self.room = Room.objects.create(
            room_number='101', monthly_rent=1000.0, 
            apartment=self.admin, resident=self.resident
        )
        
        # Tokens for authentication
        self.superadmin_token = Token.objects.create(user=self.superadmin)
        self.admin_token = Token.objects.create(user=self.admin)
        self.resident_token = Token.objects.create(user=self.resident)
        self.security_token = Token.objects.create(user=self.security)

    def authenticate(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}') # type: ignore

class UserAuthenticationTests(APITestSetup):
    def test_login_user_success(self):
        """Test successful login for a superadmin"""
        url = reverse('loginUser')
        data = {'username': 'superadmin', 'password': 'superadmin123'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data) # type: ignore
        self.assertEqual(response.data['username'], 'superadmin') # type: ignore
        self.assertEqual(response.data['role'], 'superadmin') # type: ignore

    def test_login_user_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse('loginUser')
        data = {'username': 'superadmin', 'password': 'wrongpassword'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data) # type: ignore

class UserManagementTests(APITestSetup):
    def test_add_admin_by_superadmin(self):
        """Test superadmin adding a new admin"""
        self.authenticate(self.superadmin_token)
        url = reverse('addAdmin')
        data = {
            'username': 'newadmin',
            'email': 'newadmin@example.com',
            'password': 'newadmin123',
            'apartmentName': 'Apartment2',  # Unique apartment name
            'subscription_price': 100.0,
            'first_name': 'New',  # Added as a precaution
            'last_name': 'Admin'  # Added as a precaution
        }
        response = self.client.post(url, data, format='json')
        print("Response data:", response.data)  #  type: ignore
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username='newadmin').count(), 1)

    def test_add_user_by_admin(self):
        """Test admin adding a new resident"""
        self.authenticate(self.admin_token)
        url = reverse('addUser')
        data = {
            'username': 'newresident',
            'email': 'newresident@example.com',
            'password': 'newresident123',
            'role': 'resident',
            'apartmentName': 'Apartment1',
            'room_number': '102',  # Required for residents
            'monthly_rent': 1000.0  # Required for residents
        }
        response = self.client.post(url, data, format='json')
        print("Response data:", response.data)  #  # type: ignore
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username='newresident').count(), 1)

    def test_delete_user_by_admin(self):
        """Test admin deleting a resident"""
        self.authenticate(self.admin_token)
        url = reverse('deleteUser', args=[self.resident.id]) # type: ignore
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.resident.id).exists()) # type: ignore
        
class ProfileTests(APITestSetup):
    def test_update_profile_with_image(self):
        """Test updating user profile with image"""
        self.authenticate(self.resident_token)
        url = reverse('updateProfile')
        image = SimpleUploadedFile("test_image.jpg", b"file_content", content_type="image/jpeg")
        data = {
            'first_name': 'Updated', 'last_name': 'Resident',
            'profileImage': image
        }
        response = self.client.put(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.resident.refresh_from_db()
        self.assertEqual(self.resident.first_name, 'Updated')
        self.assertTrue(self.resident.profileImage) # type: ignore

    def test_update_password(self):
        """Test updating user password"""
        self.authenticate(self.resident_token)
        url = reverse('updatePassword')
        data = {'password': 'newpassword123', 'confirm_password': 'newpassword123'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.resident.refresh_from_db()
        self.assertTrue(self.resident.check_password('newpassword123'))

class VisitorTests(APITestSetup):
    def test_register_visitor_by_resident(self):
        """Test resident registering a visitor"""
        self.authenticate(self.resident_token)
        url = reverse('registerVisitor')
        data = {
            'name': 'John Doe', 'purpose': 'Guest',
            'date': '2025-04-24', 'expected_time': '10:00:00'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Visitor.objects.count(), 1)
        visitor = Visitor.objects.first()
        self.assertEqual(visitor.name, 'John Doe') # type: ignore
        self.assertEqual(visitor.resident, self.resident) # type: ignore

    def test_update_visitor_status_by_security(self):
        """Test security updating visitor status"""
        visitor = Visitor.objects.create(
            name='John Doe', purpose='Guest', date='2025-04-24',
            expected_time='10:00:00', resident=self.resident,
            status='pending', unit='Apartment1'
        )
        self.authenticate(self.security_token)
        url = reverse('updateVisitorStatus', args=[visitor.id]) # type: ignore
        data = {'status': 'checked-in'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        visitor.refresh_from_db()
        self.assertEqual(visitor.status, 'checked-in')

class PaymentTests(APITestSetup):
       def setUp(self):
           super().setUp()
           stripe.api_key = 'sk_test_123'
           self.admin.stripe_account_id = 'acct_123' # type: ignore
           self.admin.stripe_account_active = True # type: ignore
           self.admin.save()

       def test_create_payment_intent(self):
           """Test creating a payment intent for resident"""
           self.authenticate(self.resident_token)
           url = reverse('createPaymentIntent')
           data = {
               'period_from': '2025-04-01',
               'period_to': '2025-04-30'
           }
           stripe.PaymentIntent.create = lambda **kwargs: type('obj', (), {'id': 'pi_123', 'client_secret': 'secret_123'}) # type: ignore
           response = self.client.post(url, data, format='json')
           print("Response data:", response.data) # type: ignore
           self.assertEqual(response.status_code, status.HTTP_201_CREATED)
           self.assertIn('clientSecret', response.data) # type: ignore
           self.assertEqual(Payment.objects.count(), 1)

       def test_check_payment_due(self):
           """Test checking payment due for resident"""
           self.authenticate(self.resident_token)
           url = reverse('check-payment-due')
           response = self.client.get(url)
           print("Response data:", response.data) # type: ignore
           self.assertEqual(response.status_code, status.HTTP_200_OK)
           self.assertIn('reminder', response.data) # type: ignore
           self.assertIn('monthly_rent', response.data) # type: ignore
           

class ComplaintTests(APITestSetup):
    def test_submit_complaint_by_resident(self):
        """Test resident submitting a complaint"""
        self.authenticate(self.resident_token)
        url = reverse('submitComplaint')
        data = {
            'description': 'Leaky faucet',
            'room_number': '101',
            'complaint_type': 'resident',
            'subject': 'Faucet Issue', 
            'status': 'pending'         
        }
        response = self.client.post(url, data, format='json')
        print("Response data:", response.data)   # type: ignore
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Complaint.objects.count(), 1)
        complaint = Complaint.objects.first()
        self.assertEqual(complaint.description, 'Leaky faucet') # type: ignore
        self.assertEqual(complaint.user, self.resident) # type: ignore

    def test_respond_complaint_by_admin(self):
        """Test admin responding to a complaint"""
        complaint = Complaint.objects.create(
            user=self.resident,
            description='Leaky faucet',
            room_number='101',
            complaint_type='resident',
            subject='Faucet Issue',
            status='pending'
        )
        self.authenticate(self.admin_token)
        url = reverse('respondComplaint', args=[complaint.id]) # type: ignore
        data = {'response': 'Will fix tomorrow', 'status': 'in_progress'}
        response = self.client.post(url, data, format='json')
        print("Response data:", response.data)  # type: ignore
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.response, 'Will fix tomorrow')
        self.assertEqual(complaint.status, 'in_progress')
        

class BlogTests(APITestSetup):
    def test_create_blog_by_superadmin(self):
        """Test superadmin creating a blog post"""
        self.authenticate(self.superadmin_token)
        url = reverse('manage_blogs')
        data = {
            'title': 'New Blog',
            'content': 'Blog content',
            'is_published': True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BlogPost.objects.count(), 1)
        blog = BlogPost.objects.first()
        self.assertEqual(blog.title, 'New Blog') # type: ignore
        self.assertTrue(blog.is_published) # type: ignore