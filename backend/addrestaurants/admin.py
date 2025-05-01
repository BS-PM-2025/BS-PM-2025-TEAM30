from django.contrib import admin
from .models import Restaurant

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'is_promoted', 'latitude', 'longitude', 'created_at')
    list_editable = ('is_promoted', 'latitude', 'longitude')
    search_fields = ('name', 'location')
    list_filter = ('is_promoted', 'location', 'is_open')