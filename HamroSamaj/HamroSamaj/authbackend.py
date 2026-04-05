from django.contrib.auth import get_user_model

class FlexibleAuthBackend:
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        User = get_user_model()
        

        users_by_username = User.objects.filter(username=username)
        users_by_email = User.objects.filter(email=username) if '@' in username else User.objects.none()
        
        # Combine users from both queries
        users = (users_by_username | users_by_email).distinct()
        
        if not users.exists():
            return None

        # If multiple users exist, require apartmentName to disambiguate
        if users.count() > 1:
            if 'apartmentName' not in kwargs:
                return None  # Defer to apartment selection in view
            try:
                user = users.get(apartmentName=kwargs['apartmentName'])
            except User.DoesNotExist:
                return None
        else:
            user = users.first()

        if user is not None and user.check_password(password):
            return user
        return None

    def get_user(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None