from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class WeatherForecastRun(models.Model):
    class Source(models.TextChoices):
        OPEN_METEO = "open_meteo", "Open-Meteo"

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        PARTIAL = "PARTIAL", "Partial"
        FAILED = "FAILED", "Failed"

    farm = models.ForeignKey(
        "farms.Farm",
        on_delete=models.CASCADE,
        related_name="weather_forecast_runs",
    )
    source = models.CharField(max_length=100, choices=Source.choices)
    fetched_at = models.DateTimeField(default=timezone.now)
    requested_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    requested_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    provider_timezone = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices)
    error_summary = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fetched_at", "-pk"]
        indexes = [
            models.Index(fields=["farm", "-fetched_at"], name="weather_run_farm_time_idx"),
            models.Index(
                fields=["farm", "status", "-fetched_at"],
                name="weather_run_usable_idx",
            ),
        ]

    def __str__(self):
        return f"{self.farm.name} {self.source} {self.status} at {self.fetched_at}"


class WeatherRecord(models.Model):
    forecast_run = models.ForeignKey(
        WeatherForecastRun,
        on_delete=models.CASCADE,
        related_name="records",
    )
    forecast_date = models.DateField()
    precipitation_mm = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    temperature_min_c = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    temperature_max_c = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    # Preserves measurements from the pre-versioned WeatherRecord schema.
    legacy_temperature_c = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        editable=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["forecast_date", "pk"]
        constraints = [
            models.UniqueConstraint(
                fields=["forecast_run", "forecast_date"],
                name="unique_weather_run_forecast_date",
            ),
            models.CheckConstraint(
                condition=Q(precipitation_mm__isnull=True) | Q(precipitation_mm__gte=0),
                name="weather_precipitation_nonnegative",
            ),
            models.CheckConstraint(
                condition=(
                    Q(temperature_min_c__isnull=True)
                    | Q(temperature_max_c__isnull=True)
                    | Q(temperature_min_c__lte=models.F("temperature_max_c"))
                ),
                name="weather_min_temp_lte_max_temp",
            ),
        ]

    def clean(self):
        super().clean()
        if (
            self.temperature_min_c is not None
            and self.temperature_max_c is not None
            and self.temperature_min_c > self.temperature_max_c
        ):
            raise ValidationError({"temperature_min_c": "Minimum temperature must not exceed maximum."})

    def __str__(self):
        return f"{self.forecast_run.farm.name} forecast for {self.forecast_date}"
