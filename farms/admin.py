from django.contrib import admin
from .models import Farm, FeedType, FeedInventory


# Register your models here.

admin.site.register(Farm)
admin.site.register(FeedType)
admin.site.register(FeedInventory)