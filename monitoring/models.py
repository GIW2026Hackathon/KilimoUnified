from django.db import models
from django.utils.translation import gettext_lazy as _


class RiskAlert(models.Model):
	class RiskLevel(models.TextChoices):
		LOW = "LOW", _("Low")
		MEDIUM = "MEDIUM", _("Medium")
		HIGH = "HIGH", _("High")
		UNKNOWN = "UNKNOWN", _("Unknown")

	class Status(models.TextChoices):
		ACTIVE = "ACTIVE", _("Active")
		ACKNOWLEDGED = "ACKNOWLEDGED", _("Acknowledged")
		RESOLVED = "RESOLVED", _("Resolved")

	farm = models.ForeignKey(
		"farms.Farm",
		on_delete=models.CASCADE,
		related_name="risk_alerts",
	)
	risk_level = models.CharField(max_length=10, choices=RiskLevel.choices)
	message = models.TextField()
	recommended_action = models.TextField()
	status = models.CharField(
		max_length=15,
		choices=Status.choices,
		default=Status.ACTIVE,
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	evaluation = models.ForeignKey(
		"monitoring.RiskEvaluation", null=True, blank=True,
		on_delete=models.SET_NULL, related_name="alerts",
	)

	class Meta:
		ordering = ["-created_at"]
		indexes = [
			models.Index(
				fields=["farm", "status", "-created_at"],
				name="alert_farm_status_recent_idx",
			),
			models.Index(
				fields=["status", "-created_at"],
				name="alert_status_recent_idx",
			),
			models.Index(
				fields=["-created_at"],
				name="alert_created_recent_idx",
			),
		]

	def __str__(self):
		return f"{self.get_risk_level_display()} risk at {self.farm.name}"


class RiskEvaluation(models.Model):
	"""Immutable snapshot of one deterministic farm risk assessment."""
	farm = models.ForeignKey("farms.Farm", on_delete=models.CASCADE, related_name="risk_evaluations")
	evaluated_at = models.DateTimeField(auto_now_add=True)
	risk_level = models.CharField(max_length=10, choices=[("LOW", "Low"), ("MEDIUM", "Medium"), ("HIGH", "High"), ("UNKNOWN", "Unknown")])
	inventory_risk_level = models.CharField(max_length=10, choices=[("LOW", "Low"), ("MEDIUM", "Medium"), ("HIGH", "High"), ("UNKNOWN", "Unknown")])
	evidence = models.JSONField(default=dict)
	explanation = models.TextField()
	recommended_action = models.TextField()
	ai_explanation = models.TextField(blank=True)
	ai_generated_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ["-evaluated_at", "-pk"]
		indexes = [models.Index(fields=["farm", "-evaluated_at"], name="risk_eval_farm_time_idx")]

	def __str__(self):
		return f"{self.risk_level} evaluation for {self.farm.name} at {self.evaluated_at}"
