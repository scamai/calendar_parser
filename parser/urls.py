from django.urls import path
from . import views

urlpatterns = [
    path('parse/', views.parse_event, name='parse_event'),
]