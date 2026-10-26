from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class SignInWorkflowTests(TestCase):
	def setUp(self):
		self.user = get_user_model().objects.create_user(
			username="farmer",
			password="Safe-test-password-123",
		)

	def test_sign_in_redirects_to_dashboard(self):
		response = self.client.post(
			reverse("accounts:login"),
			{"username": "farmer", "password": "Safe-test-password-123"},
		)

		self.assertRedirects(response, reverse("core:dashboard"))
		dashboard = self.client.get(reverse("core:dashboard"))
		self.assertContains(dashboard, "Welcome, farmer!")

	def test_invalid_credentials_show_error(self):
		response = self.client.post(
			reverse("accounts:login"),
			{"username": "farmer", "password": "incorrect"},
		)

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, "Please enter a correct username and password")

	def test_sign_out_returns_to_home(self):
		self.client.force_login(self.user)

		response = self.client.post(reverse("accounts:logout"))

		self.assertRedirects(response, reverse("core:home"))
		self.assertFalse(response.wsgi_request.user.is_authenticated)
