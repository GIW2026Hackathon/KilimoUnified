import logging
from time import monotonic

from django.core.management import BaseCommand, CommandError

from farms.models import Farm
from weather.services.forecasts import refresh_farm_forecast

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Refresh Open-Meteo forecasts for farms with configured coordinates."

    def add_arguments(self, parser):
        parser.add_argument(
            "--farm-id",
            type=int,
            help="Refresh only the specified farm (for targeted administration/testing).",
        )

    def handle(self, *args, **options):
        started = monotonic()
        farm_id = options.get("farm_id")
        farms = Farm.objects.all().order_by("pk")
        if farm_id is not None:
            farm = farms.filter(pk=farm_id).first()
            if farm is None:
                raise CommandError(f"Farm {farm_id} does not exist.")
            farms = farms.filter(pk=farm_id)

        counts = {"SUCCESS": 0, "PARTIAL": 0, "FAILED": 0, "SKIPPED": 0}
        for farm in farms.iterator():
            try:
                result = refresh_farm_forecast(farm)
                counts[result["status"]] += 1
                if result["status"] == "SKIPPED":
                    self.stdout.write(f"Skipped farm {farm.pk}: missing coordinates.")
                else:
                    self.stdout.write(f"Farm {farm.pk}: {result['status'].lower()}.")
            except Exception:
                logger.exception("Unexpected weather refresh error for farm_id=%s", farm.pk)
                counts["FAILED"] += 1
                self.stderr.write(f"Farm {farm.pk}: failed; see server logs.")

        elapsed = monotonic() - started
        summary = (
            "Weather refresh summary: "
            f"success={counts['SUCCESS']}, partial={counts['PARTIAL']}, "
            f"failed={counts['FAILED']}, skipped={counts['SKIPPED']}, "
            f"elapsed={elapsed:.2f}s"
        )
        self.stdout.write(self.style.SUCCESS(summary))
