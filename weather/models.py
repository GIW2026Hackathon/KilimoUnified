from django.db import models


class WeatherRecord(models.Model):
    """Store forecast measurements expected for forecast_date."""

    farm = models.ForeignKey(
        "farms.Farm",
        on_delete=models.CASCADE,
        related_name="weather_records",
    )
    forecast_date = models.DateField()
    rainfall_mm = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )
    temperature_c = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    source = models.CharField(max_length=100)
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-forecast_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "forecast_date", "source"],
                name="unique_weather_farm_date_source",
            ),
        ]
        indexes = [
            models.Index(
                fields=["farm", "forecast_date"],
                name="weather_farm_forecast_idx",
            ),
        ]

    def __str__(self):
        return f"{self.farm.name} forecast for {self.forecast_date} ({self.source})"
