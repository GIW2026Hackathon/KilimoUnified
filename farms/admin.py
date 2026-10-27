
from django.contrib import admin

from .models import Farm, FeedInventory, FeedType


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ("name", "county", "owner", "latitude", "longitude", "created_at")
    search_fields = ("name", "county", "location", "owner__username")
    list_filter = ("created_at",)
    fields = ("owner", "name", "county", "location", "latitude", "longitude")


@admin.register(FeedType)
class FeedTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    search_fields = ("name",)
    list_filter = ("category",)


@admin.register(FeedInventory)
class FeedInventoryAdmin(admin.ModelAdmin):
    list_display = (
        "farm",
        "feed_type",
        "stock_kg",
        "unusable_kg",
        "reserved_kg",
        "daily_consumption_kg",
        "coverage_days",
    )
    list_filter = ("feed_type__category",)
    search_fields = ("farm__name", "feed_type__name")
    readonly_fields = ("updated_at",)
