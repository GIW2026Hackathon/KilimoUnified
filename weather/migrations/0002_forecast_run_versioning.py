from decimal import Decimal

import django.db.models.deletion
import django.core.validators
import django.utils.timezone
from django.db import migrations, models


def migrate_legacy_records(apps, schema_editor):
    WeatherForecastRun = apps.get_model("weather", "WeatherForecastRun")
    WeatherRecord = apps.get_model("weather", "WeatherRecord")
    database = schema_editor.connection.alias

    for record in WeatherRecord.objects.using(database).select_related("farm").iterator():
        farm = record.farm
        run = WeatherForecastRun.objects.using(database).create(
            farm_id=record.farm_id,
            source=record.source,
            fetched_at=record.fetched_at,
            requested_latitude=farm.latitude,
            requested_longitude=farm.longitude,
            status="PARTIAL",
            error_summary=(
                "Migrated historical record; daily minimum and maximum temperatures "
                "were not available in the previous schema."
            ),
            created_at=record.fetched_at,
        )
        WeatherRecord.objects.using(database).filter(pk=record.pk).update(
            forecast_run_id=run.pk,
            created_at=record.fetched_at,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("farms", "0003_farm_coordinates"),
        ("weather", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="WeatherForecastRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source", models.CharField(choices=[("open_meteo", "Open-Meteo")], max_length=100)),
                ("fetched_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("requested_latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("requested_longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("provider_timezone", models.CharField(blank=True, max_length=100, null=True)),
                ("status", models.CharField(choices=[("SUCCESS", "Success"), ("PARTIAL", "Partial"), ("FAILED", "Failed")], max_length=10)),
                ("error_summary", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("farm", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="weather_forecast_runs", to="farms.farm")),
            ],
            options={
                "ordering": ["-fetched_at", "-pk"],
                "indexes": [
                    models.Index(fields=["farm", "-fetched_at"], name="weather_run_farm_time_idx"),
                    models.Index(fields=["farm", "status", "-fetched_at"], name="weather_run_usable_idx"),
                ],
            },
        ),
        migrations.AddField(
            model_name="weatherrecord",
            name="forecast_run",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="records",
                to="weather.weatherforecastrun",
            ),
        ),
        migrations.RenameField(
            model_name="weatherrecord",
            old_name="rainfall_mm",
            new_name="precipitation_mm",
        ),
        migrations.RenameField(
            model_name="weatherrecord",
            old_name="temperature_c",
            new_name="legacy_temperature_c",
        ),
        migrations.AlterField(
            model_name="weatherrecord",
            name="precipitation_mm",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True, validators=[django.core.validators.MinValueValidator(Decimal("0"))]),
        ),
        migrations.AlterField(
            model_name="weatherrecord",
            name="legacy_temperature_c",
            field=models.DecimalField(blank=True, decimal_places=2, editable=False, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name="weatherrecord",
            name="temperature_min_c",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name="weatherrecord",
            name="temperature_max_c",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name="weatherrecord",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.RemoveIndex(
            model_name="weatherrecord",
            name="weather_farm_forecast_idx",
        ),
        migrations.RemoveConstraint(
            model_name="weatherrecord",
            name="unique_weather_farm_date_source",
        ),
        migrations.RunPython(migrate_legacy_records, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="weatherrecord",
            name="forecast_run",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="records",
                to="weather.weatherforecastrun",
            ),
        ),
        migrations.AlterField(
            model_name="weatherrecord",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.RemoveField(model_name="weatherrecord", name="farm"),
        migrations.RemoveField(model_name="weatherrecord", name="source"),
        migrations.RemoveField(model_name="weatherrecord", name="fetched_at"),
        migrations.AlterModelOptions(
            name="weatherrecord",
            options={"ordering": ["forecast_date", "pk"]},
        ),
        migrations.AddConstraint(
            model_name="weatherrecord",
            constraint=models.UniqueConstraint(fields=("forecast_run", "forecast_date"), name="unique_weather_run_forecast_date"),
        ),
        migrations.AddConstraint(
            model_name="weatherrecord",
            constraint=models.CheckConstraint(condition=models.Q(("precipitation_mm__isnull", True), ("precipitation_mm__gte", 0), _connector="OR"), name="weather_precipitation_nonnegative"),
        ),
        migrations.AddConstraint(
            model_name="weatherrecord",
            constraint=models.CheckConstraint(condition=models.Q(("temperature_min_c__isnull", True), ("temperature_max_c__isnull", True), ("temperature_min_c__lte", models.F("temperature_max_c")), _connector="OR"), name="weather_min_temp_lte_max_temp"),
        ),
    ]
