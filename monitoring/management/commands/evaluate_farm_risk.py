from django.core.management.base import BaseCommand

from farms.models import Farm
from monitoring.services.risk import evaluate_farm_risk


class Command(BaseCommand):
    help = "Evaluate deterministic feed shortage risk for one farm or all farms."

    def add_arguments(self, parser):
        parser.add_argument("--farm-id", type=int)

    def handle(self, *args, **options):
        farms = Farm.objects.filter(pk=options["farm_id"]) if options["farm_id"] else Farm.objects.all()
        for farm in farms.order_by("pk"):
            try:
                result = evaluate_farm_risk(farm)
                self.stdout.write(f"{farm.pk}: {result['risk_level']} ({result['evaluation'].pk})")
            except Exception:
                self.stderr.write(f"{farm.pk}: evaluation failed")
