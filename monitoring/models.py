from django.db import models
from django.utils.translation import gettext_lazy as _


class RiskAlert(models.Model):
	class RiskLevel(models.TextChoices):
		LOW = "LOW", _("Low")
		MEDIUM = "MEDIUM", _("Medium")
		HIGH = "HIGH", _("High")

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
