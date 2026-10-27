import json
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.test import Client

# Create your tests here.
from django.contrib.auth import get_user_model
from django.urls import reverse

from farms.models import Farm
from weather.services.open_meteo import DailyForecast, ForecastPayload, ForecastProviderError


class FarmDashboardTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="dashboard_user", password="test-pass")
        self.other = get_user_model().objects.create_user(username="other_dashboard_user", password="test-pass")
        self.farm = Farm.objects.create(owner=self.user, name="Dairy One", location="Nakuru")
        self.client.force_login(self.user)

    def test_public_home_route_renders_the_expected_template(self):
        client = Client()
        response = client.get(reverse("core:home"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "core/home.html")

    def test_login_get_renders_the_expected_template(self):
        response = Client().get(reverse("accounts:login"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "accounts/login.html")

    def test_dashboard_lists_owned_farms_and_unknown_states(self):
        response = self.client.get(reverse("core:dashboard"))
        self.assertContains(response, "Dairy One")
        self.assertContains(response, "UNKNOWN")
        self.assertContains(response, "No inventory is recorded")
        self.assertContains(response, 'data-farm-assistant')
        self.assertNotContains(response, "other_dashboard_user")

    def test_farm_creation_assigns_owner_and_validates_coordinate_pair(self):
        response = self.client.post(reverse("core:farm_create"), {
            "name": "New Dairy", "location": "Nakuru", "latitude": "-0.30", "longitude": "",
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Farm.objects.filter(name="New Dairy").exists())
        response = self.client.post(reverse("core:farm_create"), {
            "name": "New Dairy", "county": "Nakuru County", "location": "Bahati", "latitude": "-0.30", "longitude": "36.08",
        })
        self.assertEqual(response.status_code, 302)
        farm = Farm.objects.get(name="New Dairy")
        self.assertEqual(farm.owner, self.user)
        self.assertEqual(farm.county, "Nakuru County")
        self.assertEqual(farm.latitude, Decimal("-0.300000"))

    def test_farm_form_offers_browser_location_and_manual_county(self):
        response = self.client.get(reverse("core:farm_create"))
        self.assertContains(response, "County")
        self.assertContains(response, "Use current location")
        self.assertContains(response, "navigator.geolocation")

    def test_farm_specific_pages_hide_other_owners_data(self):
        self.client.force_login(self.other)
        for name, args in (
            ("core:farm_detail", [self.farm.pk]),
            ("core:farm_edit", [self.farm.pk]),
            ("core:inventory_list", [self.farm.pk]),
        ):
            self.assertEqual(self.client.get(reverse(name, args=args)).status_code, 404)

    def test_farm_routes_require_authentication_and_csrf_for_changes(self):
        anonymous = Client()
        self.assertEqual(anonymous.get(reverse("core:farm_list")).status_code, 302)
        csrf_client = Client(enforce_csrf_checks=True)
        csrf_client.force_login(self.user)
        response = csrf_client.post(reverse("core:farm_create"), {
            "name": "Blocked Farm", "county": "Nakuru", "location": "Bahati",
        })
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Farm.objects.filter(name="Blocked Farm").exists())

    def test_owned_farm_and_inventory_pages_render_the_expected_templates(self):
        cases = (
            ("core:farm_list", [], "farms/farm_list.html"),
            ("core:farm_create", [], "farms/farm_form.html"),
            ("core:farm_detail", [self.farm.pk], "farms/farm_detail.html"),
            ("core:farm_edit", [self.farm.pk], "farms/farm_form.html"),
            ("core:inventory_list", [self.farm.pk], "farms/inventory_list.html"),
        )
        for route, args, template in cases:
            with self.subTest(route=route):
                response = self.client.get(reverse(route, args=args))
                self.assertEqual(response.status_code, 200)
                self.assertTemplateUsed(response, template)
                if route in ("core:farm_detail", "core:inventory_list"):
                    self.assertContains(response, 'data-farm-assistant')
                    self.assertContains(response, reverse("assistantAnalytics:ask"))


class JsonApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="dairy_farmer",
            phone_number="+254712345678",
            email="farmer@example.test",
            password="Farm-Password-987!",
        )
        self.farm = Farm.objects.create(
            owner=self.user,
            name="Demo Dairy",
            county="Nakuru",
            location="Nakuru",
            latitude=Decimal("-0.300000"),
            longitude=Decimal("36.080000"),
            herd_size=4,
            average_daily_milk_litres=Decimal("10.00"),
            milk_price_per_litre_kes=Decimal("50.00"),
        )

    def test_login_by_username_and_owner_scoped_farm_response(self):
        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"username": "dairy_farmer", "password": "Farm-Password-987!"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["phone"], "+254712345678")
        farms = self.client.get("/api/farms/")
        self.assertEqual(farms.status_code, 200)
        self.assertEqual([item["id"] for item in farms.json()["farms"]], [self.farm.pk])
        detail = self.client.get(f"/api/farms/{self.farm.pk}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()["farm"]["herd_size"], 4)

    def test_login_requires_username_and_does_not_treat_email_as_username(self):
        missing = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"password": "Farm-Password-987!"}),
            content_type="application/json",
        )
        self.assertEqual(missing.status_code, 400)
        self.assertIn("username", missing.json()["error"]["fields"])
        email = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"username": "farmer@example.test", "password": "Farm-Password-987!"}),
            content_type="application/json",
        )
        self.assertEqual(email.status_code, 400)
        self.assertEqual(email.json()["error"]["code"], "authentication_error")

    def test_csrf_current_user_and_logout_endpoints(self):
        csrf = self.client.get("/api/csrf/")
        self.assertEqual(csrf.status_code, 200)
        self.assertTrue(csrf.json()["csrf_token"])
        self.assertIn("csrftoken", self.client.cookies)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)
        self.client.force_login(self.user)
        current = self.client.get("/api/auth/me/")
        self.assertEqual(current.status_code, 200)
        self.assertEqual(current.json()["user"]["name"], "dairy_farmer")
        signed_out = self.client.post("/api/auth/logout/", data="{}", content_type="application/json")
        self.assertEqual(signed_out.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_register_creates_farmer_and_farm_and_returns_field_errors(self):
        bad = self.client.post(
            "/api/auth/register/",
            data=json.dumps({"full_name": "", "phone": "invalid", "herd_size": -1}),
            content_type="application/json",
        )
        self.assertEqual(bad.status_code, 400)
        self.assertIn("full_name", bad.json()["error"]["fields"])
        self.assertIn("phone", bad.json()["error"]["fields"])
        self.assertIn("herd_size", bad.json()["error"]["fields"])

        payload = {
            "full_name": "Mary Farmer",
            "phone": "0712 999 888",
            "email": "mary@example.test",
            "password": "Farm-Password-321!",
            "farm_name": "Mary's Dairy",
            "county": "Kiambu",
            "herd_size": 5,
            "average_daily_milk_litres": 42,
            "milk_price_per_litre_kes": 52,
            "latitude": -1.25,
            "longitude": 36.8,
        }
        response = self.client.post("/api/auth/register/", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["farm"]["name"], "Mary's Dairy")
        self.assertTrue(self.client.session.get("_auth_user_id"))

    def test_assessment_calculations_units_and_validation(self):
        self.client.force_login(self.user)
        result = self.client.post(
            f"/api/farms/{self.farm.pk}/assessment/",
            data=json.dumps({
                "available_feed_kg": 60,
                "required_feed_kg": 100,
                "feed_price_per_kg_kes": 35,
                "production_reduction_percent": 20,
                "period_days": 7,
            }),
            content_type="application/json",
        )
        self.assertEqual(result.status_code, 200)
        calculation = result.json()["assessment"]["calculation"]
        self.assertEqual(calculation["feed_deficit_kg"], "40")
        self.assertEqual(calculation["extra_feed_cost_kes"], "1400.00")
        self.assertEqual(calculation["baseline_revenue_kes"], "3500.00")
        self.assertEqual(calculation["estimated_revenue_loss_kes"], "700.00")
        self.assertTrue(result.json()["assessment"]["financial_assumptions"])

        for field, value in (("available_feed_kg", -1), ("required_feed_kg", "abc")):
            with self.subTest(field=field):
                invalid = self.client.post(
                    f"/api/farms/{self.farm.pk}/assessment/",
                    data=json.dumps({field: value}),
                    content_type="application/json",
                )
                self.assertEqual(invalid.status_code, 400)
                self.assertIn(field, invalid.json()["error"]["fields"])

    @patch.dict("os.environ", {"MAZIWASHIELD_AI_API_KEY": "", "MAZIWASHIELD_AI_API_URL": "", "MAZIWASHIELD_AI_MODEL": ""})
    def test_assistant_api_uses_selected_owned_farm_data(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/assistant/",
            data=json.dumps({"farm_id": self.farm.pk, "question": "What is my current feed risk?"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        assistant = response.json()["assistant"]
        self.assertEqual(assistant["topic"], "risk")
        self.assertIn("risk is UNKNOWN", assistant["answer"])
        self.assertEqual(assistant["farm_id"], self.farm.pk)
        self.assertEqual(assistant["farm_name"], self.farm.name)
        self.assertEqual(assistant["ai_status"], "NOT_CONFIGURED")
        self.assertIn("evaluated_at", assistant)

    def test_assistant_api_validation_auth_and_farm_ownership(self):
        anonymous = self.client.post("/api/assistant/", data="{}", content_type="application/json")
        self.assertEqual(anonymous.status_code, 401)
        self.client.force_login(self.user)
        invalid = self.client.post(
            "/api/assistant/",
            data=json.dumps({"farm_id": self.farm.pk, "question": " "}),
            content_type="application/json",
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("question", invalid.json()["error"]["fields"])
        other = get_user_model().objects.create_user(username="assistant_foreign", password="password")
        foreign_farm = Farm.objects.create(owner=other, name="Private farm", location="Nakuru")
        forbidden = self.client.post(
            "/api/assistant/",
            data=json.dumps({"farm_id": foreign_farm.pk, "question": "Show my feed"}),
            content_type="application/json",
        )
        self.assertEqual(forbidden.status_code, 404)

    def test_unauthenticated_private_api_and_foreign_farm_are_rejected(self):
        self.assertEqual(self.client.get("/api/farms/").status_code, 401)
        other = get_user_model().objects.create_user(username="other", password="other-password")
        self.client.force_login(other)
        self.assertEqual(self.client.get(f"/api/farms/{self.farm.pk}/").status_code, 404)

    def test_cors_allows_only_the_configured_frontend_origin(self):
        self.client.force_login(self.user)
        allowed = self.client.get("/api/farms/", HTTP_ORIGIN="http://localhost:3000")
        self.assertEqual(allowed["Access-Control-Allow-Origin"], "http://localhost:3000")
        self.assertEqual(allowed["Access-Control-Allow-Credentials"], "true")
        denied = self.client.get("/api/farms/", HTTP_ORIGIN="https://untrusted.example")
        self.assertNotIn("Access-Control-Allow-Origin", denied)

    @patch("weather.services.forecasts.fetch_forecast", side_effect=ForecastProviderError("simulated provider failure"))
    def test_weather_provider_failure_returns_fallback_without_api_500(self, _fetch):
        self.client.force_login(self.user)
        response = self.client.post(f"/api/farms/{self.farm.pk}/weather/refresh/", data="{}", content_type="application/json")
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["weather_refresh"]["status"], "FAILED")
        self.assertIn("unavailable", result["weather_refresh"]["fallback"].lower())
        self.assertEqual(result["farm"]["climate_risk"]["status"], "UNAVAILABLE")

    @patch("weather.services.forecasts.fetch_forecast")
    def test_weather_refresh_success_returns_stored_indicators(self, fetch):
        fetch.return_value = ForecastPayload(
            records=(DailyForecast(date(2026, 10, 27), Decimal("1.25"), Decimal("13.10"), Decimal("24.70")),),
            provider_timezone="Africa/Nairobi",
            is_partial=False,
        )
        self.client.force_login(self.user)
        response = self.client.post(f"/api/farms/{self.farm.pk}/weather/refresh/", data="{}", content_type="application/json")
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["weather_refresh"]["status"], "SUCCESS")
        self.assertEqual(result["farm"]["climate_risk"]["indicators"][0]["precipitation_mm"], "1.25")
