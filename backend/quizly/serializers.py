from rest_framework import serializers
from .models import AdminUser, AdminLog

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = ['id', 'user', 'is_super_admin', 'created_at', 'last_login']

class AdminLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin.user.username', read_only=True)

    class Meta:
        model = AdminLog
        fields = ['id', 'admin', 'admin_username', 'action', 'details', 'ip_address', 'created_at'] 