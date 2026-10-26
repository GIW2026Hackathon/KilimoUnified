from django.contrib.auth import get_user_model
from django.test import TestCase

from farms.models import Farm
from .models import RiskAlert


class RiskAlertTests(TestCase):
	@classmethod
	def setUpTestData(cls):
		user = get_user_model().objects.create_user(username="alert_farmer")
		cls.farm = Farm.objects.create(
			owner=user,
			name="Alert Farm",
			location="Nakuru",
		)

	def test_alert_defaults_to_active_and_accepts_fixed_choices(self):
		alert = RiskAlert.objects.create(
			farm=self.farm,
			risk_level=RiskAlert.RiskLevel.HIGH,
			message="Feed stock is low.",
			recommended_action="Restock hay.",
		)

		self.assertEqual(alert.status, RiskAlert.Status.ACTIVE)
		self.assertIn("High", str(alert))
