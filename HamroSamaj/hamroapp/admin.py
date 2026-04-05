from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):

    list_display = ('username', 'email', 'role', 'apartmentName', 'is_active', 'is_staff')
    

    list_filter = ('role', 'is_active', 'is_staff')
    

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'apartmentName')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Role', {'fields': ('role',)}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    

    search_fields = ('username', 'email')
    

    filter_horizontal = ('groups', 'user_permissions')


admin.site.register(User, CustomUserAdmin)
