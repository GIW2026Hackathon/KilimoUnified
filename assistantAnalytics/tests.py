from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch
from unittest import skipUnless
import json
import os

from django.contrib.auth import get_user_model

from farms.models import Farm, FeedInventory, FeedType
from assistantAnalytics.services.farm_assistant import answer_farm_question


class FarmAssistantTests(TestCase):
	@classmethod
	def setUpTestData(cls):
		cls.user = get_user_model().objects.create_user(username="assistant_farmer", password="safe-password")
		cls.other = get_user_model().objects.create_user(username="assistant_other", password="safe-password")
		cls.farm = Farm.objects.create(owner=cls.user, name="Assistant Farm", location="Nakuru")
		cls.other_farm = Farm.objects.create(owner=cls.other, name="Private Farm", location="Nyeri")
		cls.feed = FeedType.objects.create(name="Hay")
		FeedInventory.objects.create(
			farm=cls.farm, feed_type=cls.feed, stock_kg="100", unusable_kg="10",
			reserved_kg="0", daily_consumption_kg="10",
		)

	@patch.dict("os.environ", {"MAZIWASHIELD_AI_API_KEY": "", "MAZIWASHIELD_AI_API_URL": "", "MAZIWASHIELD_AI_MODEL": ""})
	def test_owned_farmer_get_and_stock_question_use_verified_data(self):
		self.client.force_login(self.user)
		page = self.client.get(reverse("assistantAnalytics:ask"))
		self.assertEqual(page.status_code, 200)
		self.assertTemplateUsed(page, "assistantAnalytics/assistant.html")
		self.assertContains(page, "Farm assistant")
		self.assertContains(page, 'data-assistant-question="How many days will my recorded feed last?"')
		self.assertContains(page, 'data-assistant-question="What is my current feed shortage risk?"')
		response = self.client.post(reverse("assistantAnalytics:ask"), {
			"farm": self.farm.pk, "question": "How much usable stock do I have?",
		})
		self.assertEqual(response.status_code, 200)
		self.assertContains(response, "90.00 kg usable")
		self.assertContains(response, "9 days")
		self.assertContains(response, "AI provider is not configured")

	def test_unauthenticated_and_cross_farm_requests_are_rejected(self):
		self.assertEqual(self.client.get(reverse("assistantAnalytics:ask")).status_code, 302)
		self.client.force_login(self.user)
		response = self.client.post(reverse("assistantAnalytics:ask"), {
			"farm": self.other_farm.pk, "question": "Show inventory",
		})
		self.assertEqual(response.status_code, 200)
		self.assertContains(response, "Select a valid choice")
		self.assertNotContains(response, "Private Farm")

	@patch.dict("os.environ", {"MAZIWASHIELD_AI_API_KEY": "", "MAZIWASHIELD_AI_API_URL": "", "MAZIWASHIELD_AI_MODEL": ""})
	def test_missing_data_and_unsupported_procurement_are_answered_without_guessing(self):
		response = answer_farm_question(self.farm, "Which supplier has the lowest price?")
		self.assertEqual(response["topic"], "procurement")
		self.assertIn("not recorded", response["answer"])
		self.assertEqual(response["ai_status"], "NOT_APPLICABLE")
		no_stock_farm = Farm.objects.create(owner=self.user, name="Empty", location="Kenya")
		coverage = answer_farm_question(no_stock_farm, "How long will my feed last?")
		self.assertIn("No feed inventory is recorded", coverage["answer"])

	@patch.dict("os.environ", {
		"MAZIWASHIELD_AI_API_KEY": "test-key",
		"MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions",
		"MAZIWASHIELD_AI_MODEL": "test-model",
	})
	def test_provider_receives_only_selected_farm_evidence_and_verified_answer(self):
		response = patch("assistantAnalytics.services.farm_assistant.urlopen").start()
		self.addCleanup(patch.stopall)
		response.return_value.__enter__.return_value.read.return_value = json.dumps({
			"choices": [{"message": {"content": "The recorded feed balance and estimated coverage are shown in the verified answer."}}]
		}).encode()
		result = answer_farm_question(self.farm, "How much usable stock do I have?")
		self.assertEqual(result["ai_status"], "AI")
		self.assertEqual(result["evidence"]["risk_level"], "MEDIUM")
		request_payload = json.loads(response.call_args.args[0].data.decode())
		request_text = request_payload["messages"][1]["content"]
		self.assertIn("90.00", request_text)
		self.assertIn("How much usable stock", request_text)
		self.assertNotIn("Private Farm", request_text)
		self.assertEqual(
			result["answer"],
			"Hay: 90.00 kg usable from 100.00 kg stock (10.00 kg unusable, 0.00 kg reserved); "
			"daily use 10.00 kg, estimated coverage 9 days, inventory risk MEDIUM.",
		)

	@patch.dict("os.environ", {"MAZIWASHIELD_AI_API_KEY": "", "MAZIWASHIELD_AI_API_URL": "", "MAZIWASHIELD_AI_MODEL": ""})
	def test_inventory_and_coverage_answers_include_usable_stock_and_daily_use(self):
		inventory = answer_farm_question(self.farm, "Show my feed inventory")
		self.assertEqual(inventory["topic"], "inventory")
		self.assertIn("90.00 kg usable", inventory["answer"])
		self.assertIn("daily use 10.00 kg", inventory["answer"])
		self.assertIn("9 days", inventory["answer"])
		self.assertIn("inventory risk MEDIUM", inventory["answer"])

		coverage = answer_farm_question(self.farm, "Which feed has the lowest coverage?")
		self.assertEqual(coverage["topic"], "coverage")
		self.assertIn("estimated coverage 9 days", coverage["answer"])

	@patch.dict("os.environ", {
		"MAZIWASHIELD_AI_API_KEY": "test-key",
		"MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions",
		"MAZIWASHIELD_AI_MODEL": "test-model",
	})
	def test_general_farm_question_uses_ai_with_selected_farm_context(self):
		provider = patch("assistantAnalytics.services.farm_assistant.urlopen").start()
		self.addCleanup(patch.stopall)
		provider.return_value.__enter__.return_value.read.return_value = json.dumps({
			"choices": [{"message": {"content": "I can explain what the selected farm's recorded information means."}}]
		}).encode()

		result = answer_farm_question(self.farm, "Can you help me understand my farm?")

		self.assertEqual(result["topic"], "other")
		self.assertEqual(result["ai_status"], "AI")
		self.assertIn("I can explain", result["ai_explanation"])
		self.assertIn("This farm's recorded risk is MEDIUM", result["answer"])
		payload = json.loads(provider.call_args.args[0].data.decode())
		context = payload["messages"][1]["content"]
		self.assertIn("90.00", context)
		self.assertIn("MEDIUM", context)
		self.assertNotIn("Private Farm", context)

	@patch.dict("os.environ", {
		"MAZIWASHIELD_AI_API_KEY": "test-key",
		"MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions",
		"MAZIWASHIELD_AI_MODEL": "test-model",
	})
	def test_provider_timeout_and_unverified_numeric_output_fall_back(self):
		with patch("assistantAnalytics.services.farm_assistant.urlopen", side_effect=TimeoutError()):
			failed = answer_farm_question(self.farm, "What is my current risk?")
		self.assertEqual(failed["ai_status"], "UNAVAILABLE")
		invalid = patch("assistantAnalytics.services.farm_assistant.urlopen").start()
		self.addCleanup(patch.stopall)
		invalid.return_value.__enter__.return_value.read.return_value = json.dumps({
			"choices": [{"message": {"content": "You have enough feed for twenty days, so you are safe."}}]
		}).encode()
		result = answer_farm_question(self.farm, "What is my current risk?")
		self.assertEqual(result["ai_status"], "INVALID_RESPONSE")
		self.assertEqual(result["evidence"]["risk_level"], "MEDIUM")

	@patch.dict("os.environ", {
		"MAZIWASHIELD_AI_API_KEY": "test-key",
		"MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions",
		"MAZIWASHIELD_AI_MODEL": "test-model",
	})
	def test_weather_question_can_use_ai_for_grounded_explanation(self):
		provider = patch("assistantAnalytics.services.farm_assistant.urlopen").start()
		self.addCleanup(patch.stopall)
		provider.return_value.__enter__.return_value.read.return_value = json.dumps({
			"choices": [{"message": {"content": "The stored forecast provides rainfall and temperature indicators; treat them as context, not proof of field conditions."}}]
		}).encode()

		result = answer_farm_question(self.farm, "What does the weather forecast say?")

		self.assertEqual(result["topic"], "weather")
		self.assertEqual(result["ai_status"], "AI")
		self.assertIn("No usable dated forecast indicators", result["answer"])
		self.assertIn("rainfall and temperature", result["ai_explanation"])
		payload = json.loads(provider.call_args.args[0].data.decode())
		context = payload["messages"][1]["content"]
		self.assertIn("weather_context_note", context)
		self.assertNotIn("Private Farm", context)

	@patch.dict("os.environ", {
		"MAZIWASHIELD_AI_API_KEY": "test-key",
		"MAZIWASHIELD_AI_API_URL": "https://provider.invalid/chat/completions",
		"MAZIWASHIELD_AI_MODEL": "test-model",
	})
	def test_weather_ai_rejects_unsupported_advice(self):
		provider = patch("assistantAnalytics.services.farm_assistant.urlopen").start()
		self.addCleanup(patch.stopall)
		provider.return_value.__enter__.return_value.read.return_value = json.dumps({
			"choices": [{"message": {"content": "The weather is safe for planting and will be dry soon."}}]
		}).encode()

		result = answer_farm_question(self.farm, "Explain my stored weather forecast")

		self.assertEqual(result["ai_status"], "INVALID_RESPONSE")
		self.assertIsNone(result["ai_explanation"])

	@skipUnless(os.environ.get("MAZIWASHIELD_RUN_AI_SIMULATION_TEST"), "opt-in local provider simulation")
	def test_provider_adapter_against_local_postman_simulation(self):
		result = answer_farm_question(self.farm, "How much usable stock do I have?")
		self.assertEqual(result["ai_status"], "AI")
		self.assertEqual(result["evidence"]["risk_level"], "MEDIUM")
		self.assertIn("90.00 kg usable", result["answer"])
		self.assertIn("verified farm data", result["ai_explanation"])

# Create your tests here.
