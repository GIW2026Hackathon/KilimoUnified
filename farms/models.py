
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class Farm(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="farms",
    )
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.location})"


class FeedType(models.Model):
    class Category(models.TextChoices):
        HAY = "hay", "Hay"
        SILAGE = "silage", "Silage"
        PASTURE = "pasture", "Pasture"
        CONCENTRATE = "concentrate", "Concentrate"
        OTHER = "other", "Other"

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class FeedInventory(models.Model):
    farm = models.ForeignKey(
        Farm,
        on_delete=models.CASCADE,
        related_name="inventory",
    )
    feed_type = models.ForeignKey(
        FeedType,
        on_delete=models.PROTECT,
        related_name="inventory_records",
    )

    stock_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    unusable_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    reserved_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    daily_consumption_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Recorded daily consumption for this feed type.",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["farm__name", "feed_type__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "feed_type"],
                name="unique_farm_feed_inventory",
            ),
            models.CheckConstraint(
                condition=Q(stock_kg__gte=0),
                name="inventory_stock_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(unusable_kg__gte=0),
                name="inventory_unusable_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(reserved_kg__gte=0),
                name="inventory_reserved_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(daily_consumption_kg__gte=0),
                name="inventory_consumption_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(unusable_kg__lte=models.F("stock_kg")),
                name="inventory_unusable_not_above_stock",
            ),
            models.CheckConstraint(
                condition=Q(reserved_kg__lte=models.F("stock_kg")),
                name="inventory_reserved_not_above_stock",
            ),
            models.CheckConstraint(
                condition=Q(
                    unusable_kg__lte=(
                        models.F("stock_kg") - models.F("reserved_kg")
                    )
                ),
                name="inventory_usable_stock_nonnegative",
            ),
        ]

    @property
    def usable_stock_kg(self):
        return (
            self.stock_kg
            - self.unusable_kg
            - self.reserved_kg
        )

    @property
    def coverage_days(self):
        """Return estimated coverage, or None if consumption is zero."""
        if self.daily_consumption_kg is None or self.daily_consumption_kg <= 0:
            return None

        return self.usable_stock_kg / self.daily_consumption_kg

    def __str__(self):
        return f"{self.farm.name}: {self.feed_type.name}"
