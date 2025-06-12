from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('restaurant_name', 'user_email', 'rating', 'created_at', 'is_approved')
    list_filter = ('rating', 'is_approved', 'created_at', 'restaurant_name')
    search_fields = ('restaurant_name', 'user_email', 'title', 'content')
    list_editable = ('is_approved',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('פרטי המסעדה', {
            'fields': ('restaurant_name', 'restaurant_lat', 'restaurant_lng')
        }),
        ('פרטי הביקורת', {
            'fields': ('user_email', 'rating', 'title', 'content', 'tags')
        }),
        ('הגדרות', {
            'fields': ('is_approved',)
        }),
        ('מטאדטה', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related()