from django.test import TestCase
from django.test import Client

# Create your tests here.
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse

from farms.models import Farm


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
