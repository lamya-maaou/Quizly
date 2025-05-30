from django.conf import settings
from django.db import models

class AdminUser(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_super_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Admin: {self.user.username}"

class AdminLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('CREATE_QUIZ', 'Create Quiz'),
        ('EDIT_QUIZ', 'Edit Quiz'),
        ('DELETE_QUIZ', 'Delete Quiz'),
        ('MANAGE_USER', 'Manage User'),
        ('VIEW_STATS', 'View Statistics'),
    ]

    admin = models.ForeignKey(AdminUser, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    details = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.admin.user.username} - {self.action} - {self.created_at}" 