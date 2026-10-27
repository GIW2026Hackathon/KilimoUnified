from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from farms.models import Farm, FeedInventory, FeedType
from monitoring.models import RiskAlert, RiskEvaluation
from monitoring.services.risk import evaluate_farm_risk


DEMO_FARMS = (
    {
        "name": "MaziwaShield Demo - Nakuru",
        "county": "Nakuru",
        "location": "Nakuru County",
        "latitude": Decimal("-0.303099"),
        "longitude": Decimal("36.080025"),
        "feed": "Demo Hay",
        "category": FeedType.Category.HAY,
        "stock": Decimal("350.00"),
        "unusable": Decimal("30.00"),
        "reserved": Decimal("40.00"),
        "daily_use": Decimal("40.00"),
        "coverage": "7 days (HIGH)",
    },
    {
        "name": "MaziwaShield Demo - Kiambu",
        "county": "Kiambu",
        "location": "Kiambu County",
        "latitude": Decimal("-1.171400"),
        "longitude": Decimal("36.835600"),
        "feed": "Demo Silage",
        "category": FeedType.Category.SILAGE,
        "stock": Decimal("470.00"),
        "unusable": Decimal("30.00"),
        "reserved": Decimal("40.00"),
        "daily_use": Decimal("40.00"),
        "coverage": "10 days (MEDIUM)",
    },
    {
        "name": "MaziwaShield Demo - Uasin Gishu",
        "county": "Uasin Gishu",
        "location": "Eldoret area",
        "latitude": Decimal("0.514300"),
        "longitude": Decimal("35.269800"),
        "feed": "Demo Concentrate",
        "category": FeedType.Category.CONCENTRATE,
        "stock": Decimal("1000.00"),
        "unusable": Decimal("50.00"),
        "reserved": Decimal("50.00"),
        "daily_use": Decimal("45.00"),
        "coverage": "20 days (LOW)",
    },
    {
        "name": "MaziwaShield Demo - Nyandarua",
        "county": "Nyandarua",
        "location": "Ol Kalou area",
        "latitude": Decimal("-0.270900"),
        "longitude": Decimal("36.379200"),
        "feed": None,
        "category": None,
        "stock": None,
        "unusable": None,
        "reserved": None,
        "daily_use": None,
        "coverage": "unknown (no inventory)",
    },
)


class Command(BaseCommand):
    help = "Create repeatable, clearly labeled demo farms and inventory for an existing user."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True, help="Existing user who will own demo farms.")
        parser.add_argument(
            "--reevaluate",
            action="store_true",
            help="Create a fresh saved risk assessment for each demo farm.",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            owner = User.objects.get(**{User.USERNAME_FIELD: options["username"]})
        except User.DoesNotExist as exc:
            raise CommandError("That user does not exist. Create/sign in with an account first.") from exc

        created_farms = 0
        created_inventory = 0
        evaluated = 0
        for row in DEMO_FARMS:
            with transaction.atomic():
                farm, farm_created = Farm.objects.get_or_create(
                    owner=owner,
                    name=row["name"],
                    defaults={
                        "county": row["county"],
                        "location": row["location"],
                        "latitude": row["latitude"],
                        "longitude": row["longitude"],
                    },
                )
                created_farms += int(farm_created)
                inventory_created = False
                if row["feed"]:
                    feed_type, _ = FeedType.objects.get_or_create(
                        name=row["feed"],
                        defaults={"category": row["category"], "description": "MaziwaShield demo data."},
                    )
                    _, inventory_created = FeedInventory.objects.get_or_create(
                        farm=farm,
                        feed_type=feed_type,
                        defaults={
                            "stock_kg": row["stock"],
                            "unusable_kg": row["unusable"],
                            "reserved_kg": row["reserved"],
                            "daily_consumption_kg": row["daily_use"],
                        },
                    )
                    created_inventory += int(inventory_created)

                has_evaluation = RiskEvaluation.objects.filter(farm=farm).exists()
                if options["reevaluate"] or farm_created or inventory_created or not has_evaluation:
                    evaluate_farm_risk(farm)
                    evaluated += 1
                elif not RiskAlert.objects.filter(
                    farm=farm,
                    status__in=[RiskAlert.Status.ACTIVE, RiskAlert.Status.ACKNOWLEDGED],
                ).exists():
                    # Don't silently recreate a resolved alert during an ordinary seed rerun.
                    self.stdout.write(f"Kept existing resolved alert state for {farm.name}.")

        self.stdout.write(self.style.SUCCESS(
            f"Demo data ready for {owner.get_username()}: "
            f"{created_farms} farms and {created_inventory} inventory rows created; "
            f"{evaluated} risk assessments saved. Existing records were preserved."
        ))
        self.stdout.write("Forecasts are not fabricated; refresh Open-Meteo separately when desired.")
        for row in DEMO_FARMS:
            self.stdout.write(f"- {row['name']}: {row['coverage']}")
