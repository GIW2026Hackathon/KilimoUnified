from decimal import Decimal

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("farms", "0002_alter_feedtype_description"),
    ]

    operations = [
        migrations.AddField(
            model_name="farm",
            name="latitude",
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=9,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(Decimal("-90")),
                    django.core.validators.MaxValueValidator(Decimal("90")),
                ],
            ),
        ),
        migrations.AddField(
            model_name="farm",
            name="longitude",
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=9,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(Decimal("-180")),
                    django.core.validators.MaxValueValidator(Decimal("180")),
                ],
            ),
        ),
        migrations.AddConstraint(
            model_name="farm",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(latitude__isnull=True, longitude__isnull=True)
                    | models.Q(latitude__isnull=False, longitude__isnull=False)
                ),
                name="farm_coordinates_both_or_neither",
            ),
        ),
        migrations.AddConstraint(
            model_name="farm",
            constraint=models.CheckConstraint(
                condition=models.Q(latitude__isnull=True)
                | models.Q(latitude__gte=Decimal("-90"), latitude__lte=Decimal("90")),
                name="farm_latitude_in_range",
            ),
        ),
        migrations.AddConstraint(
            model_name="farm",
            constraint=models.CheckConstraint(
                condition=models.Q(longitude__isnull=True)
                | models.Q(longitude__gte=Decimal("-180"), longitude__lte=Decimal("180")),
                name="farm_longitude_in_range",
            ),
        ),
    ]
