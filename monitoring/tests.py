from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.test import override_settings
from django.urls import reverse
from unittest.mock import patch

from farms.models import Farm
from .models import RiskAlert, RiskEvaluation
from .services.risk import evaluate_farm_risk
from .services.explanations import explain_evaluation
from farms.models import FeedInventory, FeedType
from weather.models import WeatherForecastRun, WeatherRecord
from django.utils import timezone
from datetime import timedelta
from urllib.error import HTTPError
import json
from zoneinfo import ZoneInfo


class RiskAlertTests(TestCase):
	@classmethod
	def setUpTestData(cls):
		user = get_user_model().objects.create_user(username="alert_farmer")
		cls.farm = Farm.objects.create(
			owner=user,
			name="Alert Farm",
			latitude=Decimal("-0.303099"),
			longitude=Decimal("36.080025"),
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

	def make_inventory(self, coverage_days, consumption="10"):
		feed = FeedType.objects.create(name=f"Feed {FeedType.objects.count()}")
		return FeedInventory.objects.create(
			farm=self.farm, feed_type=feed,
			stock_kg=Decimal(str(coverage_days)) * Decimal(consumption),
			unusable_kg=Decimal("0"), reserved_kg=Decimal("0"),
			daily_consumption_kg=Decimal(consumption),
		)

	def test_threshold_boundaries_and_adjacent_values(self):
		cases = [("7", "HIGH"), ("7.01", "MEDIUM"), ("14", "MEDIUM"), ("14.01", "LOW")]
		for coverage, expected in cases:
			with self.subTest(coverage=coverage):
				FeedInventory.objects.all().delete()
				self.make_inventory(coverage)
				self.assertEqual(evaluate_farm_risk(self.farm, persist=False)["risk_level"], expected)

	def test_usable_stock_excludes_reserved_and_unusable_and_zero_stock_is_high(self):
		item = self.make_inventory("10")
		item.stock_kg = Decimal("100")
		item.unusable_kg = Decimal("20")
		item.reserved_kg = Decimal("10")
		item.save()
		before = item.stock_kg
		result = evaluate_farm_risk(self.farm, persist=False)
		self.assertEqual(result["inventory"][0]["usable_stock_kg"], "70.00")
		self.assertEqual(result["inventory"][0]["coverage_days"], "7")
		item.refresh_from_db()
		self.assertEqual(item.stock_kg, before)
		item.stock_kg = Decimal("30")
		item.unusable_kg = Decimal("20")
		item.reserved_kg = Decimal("10")
		item.save()
		self.assertEqual(evaluate_farm_risk(self.farm, persist=False)["risk_level"], "HIGH")

	def test_missing_consumption_and_missing_inventory_are_unknown(self):
		self.make_inventory("100", consumption="0")
		result = evaluate_farm_risk(self.farm, persist=False)
		self.assertEqual(result["risk_level"], "UNKNOWN")
		self.assertIn("COVERAGE_UNAVAILABLE", result["rule_ids"])
		FeedInventory.objects.all().delete()
		self.assertEqual(evaluate_farm_risk(self.farm, persist=False)["risk_level"], "UNKNOWN")

	@override_settings(RISK_HIGH_COVERAGE_DAYS="invalid", RISK_MEDIUM_COVERAGE_DAYS="5")
	def test_invalid_or_inverted_threshold_configuration_uses_documented_defaults(self):
		self.make_inventory("7")
		result = evaluate_farm_risk(self.farm, persist=False)
		self.assertEqual(result["risk_level"], "HIGH")
		self.assertEqual(result["thresholds_days"], {"high_max": "7", "medium_max": "14"})

	def test_weather_missing_is_context_and_does_not_lower_or_raise_risk(self):
		self.make_inventory("7")
		self.farm.latitude = None
		self.farm.longitude = None
		self.farm.save()
		result = evaluate_farm_risk(self.farm, persist=False)
		self.assertEqual(result["risk_level"], "HIGH")
		self.assertFalse(result["weather"]["influences_risk"])
		self.assertEqual(result["weather"]["status"], "MISSING_COORDINATES")
		self.assertEqual(result["weather"]["indicators"], [])

	def test_stale_and_partial_weather_remain_context_only(self):
		self.make_inventory("20")
		self.farm.latitude = Decimal("-0.3")
		self.farm.longitude = Decimal("36.0")
		self.farm.save()
		run = WeatherForecastRun.objects.create(
			farm=self.farm, source=WeatherForecastRun.Source.OPEN_METEO,
			status=WeatherForecastRun.Status.PARTIAL,
			fetched_at=timezone.now() - timedelta(hours=30),
		)
		farm_today = timezone.now().astimezone(ZoneInfo("Africa/Nairobi")).date()
		WeatherRecord.objects.create(forecast_run=run, forecast_date=farm_today, precipitation_mm=None, temperature_min_c=Decimal("12"), temperature_max_c=None)
		result = evaluate_farm_risk(self.farm, persist=False)
		self.assertEqual(result["risk_level"], "LOW")
		self.assertEqual(result["weather"]["status"], "STALE")
		self.assertEqual(result["weather"]["indicators"][0]["freshness"], "STALE")
		self.assertIsNone(result["weather"]["indicators"][0]["precipitation_mm"])
		self.assertFalse(result["weather"]["influences_risk"])

	def test_persistence_updates_one_active_alert_and_keeps_evaluation_history(self):
		self.make_inventory("6")
		first = evaluate_farm_risk(self.farm)
		second = evaluate_farm_risk(self.farm)
		self.assertEqual(RiskEvaluation.objects.filter(farm=self.farm).count(), 2)
		self.assertEqual(RiskAlert.objects.filter(farm=self.farm).count(), 1)
		self.assertEqual(first["alert"].pk, second["alert"].pk)
		self.assertEqual(second["alert"].evaluation_id, second["evaluation"].pk)
		item = FeedInventory.objects.get(farm=self.farm)
		item.stock_kg = Decimal("200")
		item.save()
		updated = evaluate_farm_risk(self.farm)
		self.assertEqual(updated["alert"].risk_level, "LOW")
		self.assertEqual(RiskAlert.objects.filter(farm=self.farm).count(), 1)
		item.daily_consumption_kg = Decimal("0")
		item.save()
		unknown = evaluate_farm_risk(self.farm)
		self.assertEqual(unknown["alert"].risk_level, "UNKNOWN")
		self.assertEqual(RiskAlert.objects.filter(farm=self.farm).count(), 1)

	def test_farm_pages_are_owner_scoped_and_alert_actions_are_post_only(self):
		other = get_user_model().objects.create_user(username="other_farmer")
		self.client.force_login(other)
		self.assertEqual(self.client.get(reverse("core:farm_detail", args=[self.farm.pk])).status_code, 404)
		alert = RiskAlert.objects.create(farm=self.farm, risk_level="HIGH", message="Risk", recommended_action="Check.")
		self.assertEqual(self.client.post(reverse("core:alert_action", args=[alert.pk, "resolve"])).status_code, 404)
		self.client.force_login(self.farm.owner)
		self.assertEqual(self.client.get(reverse("core:alert_action", args=[alert.pk, "resolve"])).status_code, 405)
		self.assertEqual(self.client.post(reverse("core:alert_action", args=[alert.pk, "resolve"])).status_code, 302)
		alert.refresh_from_db()
		self.assertEqual(alert.status, RiskAlert.Status.RESOLVED)

	def test_alert_list_and_detail_render_the_expected_templates(self):
		alert = RiskAlert.objects.create(
			farm=self.farm, risk_level=RiskAlert.RiskLevel.HIGH,
			message="Check recorded stock.", recommended_action="Review this feed.",
		)
		self.client.force_login(self.farm.owner)
		listing = self.client.get(reverse("core:alerts"))
		self.assertEqual(listing.status_code, 200)
		self.assertTemplateUsed(listing, "monitoring/alerts.html")
		detail = self.client.get(reverse("core:alert_detail", args=[alert.pk]))
		self.assertEqual(detail.status_code, 200)
		self.assertTemplateUsed(detail, "monitoring/alert_detail.html")
		self.assertContains(detail, 'data-farm-assistant')
		self.assertContains(detail, "Why was this alert raised?")

	@patch("monitoring.services.explanations.explain_evaluation", return_value={
		"source": "RULES", "status": "AUTHORIZATION_ERROR", "http_status": 403,
		"text": "Rule-based fallback explanation.",
	})
	def test_explain_action_displays_provider_rejection_message(self, mock_explain):
		self.make_inventory("7")
		result = evaluate_farm_risk(self.farm)
		self.client.force_login(self.farm.owner)

		response = self.client.post(
			reverse("core:alert_action", args=[result["alert"].pk, "explain"]),
			follow=True,
		)

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, "AI provider rejected the request")
		self.assertContains(response, "rule-based explanation is still shown")
		mock_explain.assert_called_once_with(result["evaluation"], force=True)

	def test_alert_state_change_requires_csrf(self):
		alert = RiskAlert.objects.create(
			farm=self.farm, risk_level=RiskAlert.RiskLevel.HIGH,
			message="Check recorded stock.", recommended_action="Review this feed.",
		)
		client = Client(enforce_csrf_checks=True)
		client.force_login(self.farm.owner)
		response = client.post(reverse("core:alert_action", args=[alert.pk, "acknowledge"]))
		self.assertEqual(response.status_code, 403)
		alert.refresh_from_db()
		self.assertEqual(alert.status, RiskAlert.Status.ACTIVE)

	@override_settings(MAZIWASHIELD_AI_API_KEY="", MAZIWASHIELD_AI_API_URL="", MAZIWASHIELD_AI_MODEL="")
	def test_ai_unconfigured_returns_fallback_and_does_not_change_risk(self):
		self.make_inventory("7")
		evaluation = evaluate_farm_risk(self.farm)["evaluation"]
		result = explain_evaluation(evaluation)
		self.assertEqual(result["source"], "RULES")
		self.assertIn("7 days", result["text"])
		self.assertEqual(evaluation.risk_level, "HIGH")

	@patch.dict("os.environ", {"MAZIWASHIELD_AI_API_KEY": "test-key", "MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions", "MAZIWASHIELD_AI_MODEL": "example"})
	def test_ai_receives_verified_context_and_caches_valid_number_free_text(self):
		self.make_inventory("7")
		evaluation = evaluate_farm_risk(self.farm)["evaluation"]
		response = patch("monitoring.services.explanations.urlopen").start()
		self.addCleanup(patch.stopall)
		response.return_value.__enter__.return_value.read.return_value = json.dumps({"choices": [{"message": {"content": "Your HIGH assessment comes from the recorded feed information. Keep quantities and daily use current as recommended."}}]}).encode()
		result = explain_evaluation(evaluation)
		self.assertEqual(result["source"], "AI")
		request_payload = json.loads(response.call_args.args[0].data.decode())
		self.assertIn('"usable_stock_kg": "70.00"', request_payload["messages"][0]["content"])
		self.assertNotIn('"farm_id"', request_payload["messages"][0]["content"])
		self.assertEqual(evaluation.risk_level, "HIGH")
		self.assertEqual(explain_evaluation(evaluation)["text"], result["text"])
		self.assertEqual(response.call_count, 1)

	@patch.dict("os.environ", {"MAZIWASHIELD_AI_API_KEY": "test-key", "MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions", "MAZIWASHIELD_AI_MODEL": "example"})
	def test_ai_failure_and_unsupported_figures_use_deterministic_fallback(self):
		self.make_inventory("7")
		evaluation = evaluate_farm_risk(self.farm)["evaluation"]
		with patch("monitoring.services.explanations.urlopen", side_effect=TimeoutError()):
			self.assertEqual(explain_evaluation(evaluation)["source"], "RULES")
		with patch.dict("os.environ", {"MAZIWASHIELD_AI_API_KEY": "test-key", "MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions", "MAZIWASHIELD_AI_MODEL": "example"}):
			with patch("monitoring.services.explanations.urlopen", side_effect=HTTPError("https://provider.invalid", 403, "Forbidden", {}, None)):
				denied = explain_evaluation(evaluation, force=True)
		self.assertEqual(denied["source"], "RULES")
		self.assertEqual(denied["status"], "AUTHORIZATION_ERROR")
		self.assertEqual(denied["http_status"], 403)
		response = patch("monitoring.services.explanations.urlopen").start()
		self.addCleanup(patch.stopall)
		response.return_value.__enter__.return_value.read.return_value = json.dumps({"choices": [{"message": {"content": "Your HIGH assessment means reorder seven hundred bags today, with guaranteed success."}}]}).encode()
		self.assertEqual(explain_evaluation(evaluation, force=True)["source"], "RULES")
		self.assertEqual(evaluation.risk_level, "HIGH")
