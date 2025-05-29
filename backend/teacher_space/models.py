from django.db import models
from auth_app.models import CustomUser


# Create your models here.
class Module(models.Model):
    name = models.CharField(max_length=100)  # Version normalisée (minuscules)
    display_name = models.CharField(max_length=255)  # Version originale
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_name

    def save(self, *args, **kwargs):
        if not self.pk:  # Seulement à la création
            self.display_name = self.display_name.strip()
            self.name = self.display_name.lower()
        super().save(*args, **kwargs)


class PDF(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="pdfs")
    titre = models.CharField(max_length=100)
    fichier = models.FileField(upload_to="pdfs/")
    date_upload = models.DateTimeField(auto_now_add=True)

import uuid
from django.utils import timezone
class Quiz(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="quizzes")
    titre = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    is_generated = models.BooleanField(default=False)

    # Nouveaux champs pour le partage
    share_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    last_shared = models.DateTimeField(null=True, blank=True)
    
    # Restrictions d'accès
    access_restricted = models.BooleanField(default=False)
    expiry_date = models.DateTimeField(null=True, blank=True)
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    current_participants = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return self.titre
############## Added
    @property
    def shareable_link(self):
        return f"https://localhost:8000/quiz/{self.id}/access/{self.share_token}/"
    
    def is_accessible(self):
        if not self.access_restricted:
            return True
        
        now = timezone.now()
        if self.expiry_date and now > self.expiry_date:
            return False
        
        if (self.max_participants is not None and 
            self.current_participants >= self.max_participants):
            return False
            
        return True
    
    class Meta:
        verbose_name_plural = "Quizzes"
import qrcode
from io import BytesIO
from django.core.files import File

def generate_qr_code(self):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(self.shareable_link)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer)
    filename = f'qr_code_{self.id}.png'
    
    self.qr_code.save(filename, File(buffer), save=False)
    self.last_shared = timezone.now()
    self.save()
    return self.qr_code
    
class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    enonce = models.TextField()
    bonnes_reponses = models.ManyToManyField("Choix", related_name="questions_ou_je_suis_bonne_reponse")


# Choix de la reponse
class Choix(models.Model):
    question = models.ForeignKey("Question", on_delete=models.CASCADE, related_name="choix")
    texte = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.texte