from django.core.management.base import BaseCommand, CommandError

from monitoring.models import RiskEvaluation
from monitoring.services.explanations import explain_evaluation


class Command(BaseCommand):
    help = "Generate or retrieve an optional explanation for one saved risk evaluation."

    def add_arguments(self, parser):
        parser.add_argument("evaluation_id", type=int)
        parser.add_argument("--refresh", action="store_true")

    def handle(self, *args, **options):
        try:
            evaluation = RiskEvaluation.objects.get(pk=options["evaluation_id"])
        except RiskEvaluation.DoesNotExist:
            raise CommandError("Risk evaluation not found.") from None
        result = explain_evaluation(evaluation, force=options["refresh"])
        self.stdout.write(f"Source: {result['source']}\n{result['text']}")
