from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from farms.models import Farm
from .models import WeatherRecord


class WeatherRecordTests(TestCase):
	@classmethod
	def setUpTestData(cls):
		user = get_user_model().objects.create_user(username="weather_farmer")
		cls.farm = Farm.objects.create(
			owner=user,
			name="Weather Farm",
			location="Nakuru",
		)

	def test_weather_measurements_can_be_unknown(self):
		record = WeatherRecord.objects.create(
			farm=self.farm,
			forecast_date=date(2026, 10, 27),
			rainfall_mm=None,
			temperature_c=None,
			source="forecast-provider",
		)

		self.assertIsNone(record.rainfall_mm)
		self.assertIsNone(record.temperature_c)
		self.assertIn("Weather Farm", str(record))

	def test_same_source_cannot_duplicate_a_farm_day(self):
		values = {
			"farm": self.farm,
			"forecast_date": date(2026, 10, 27),
			"source": "forecast-provider",
		}
		WeatherRecord.objects.create(**values)

		with self.assertRaises(IntegrityError):
			with transaction.atomic():
				WeatherRecord.objects.create(**values)
