from django.test import TestCase

# Create your tests here.
from django.contrib.auth import get_user_model
from django.urls import reverse

from farms.models import Farm


class FarmDashboardTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="dashboard_user", password="test-pass")
        self.other = get_user_model().objects.create_user(username="other_dashboard_user", password="test-pass")
        self.farm = Farm.objects.create(owner=self.user, name="Dairy One", location="Nakuru")
        self.client.force_login(self.user)

    def test_dashboard_lists_owned_farms_and_unknown_states(self):
        response = self.client.get(reverse("core:dashboard"))
        self.assertContains(response, "Dairy One")
        self.assertContains(response, "UNKNOWN")
        self.assertContains(response, "No inventory is recorded")
        self.assertNotContains(response, "other_dashboard_user")

    def test_farm_creation_assigns_owner_and_validates_coordinate_pair(self):
        response = self.client.post(reverse("core:farm_create"), {
            "name": "New Dairy", "location": "Nakuru", "latitude": "-0.30", "longitude": "",
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Farm.objects.filter(name="New Dairy").exists())
        response = self.client.post(reverse("core:farm_create"), {
            "name": "New Dairy", "location": "Nakuru", "latitude": "-0.30", "longitude": "36.08",
        })
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Farm.objects.get(name="New Dairy").owner, self.user)

    def test_farm_specific_pages_hide_other_owners_data(self):
        self.client.force_login(self.other)
        for name, args in (("core:farm_detail", [self.farm.pk]), ("core:inventory_list", [self.farm.pk]),):
            self.assertEqual(self.client.get(reverse(name, args=args)).status_code, 404)
