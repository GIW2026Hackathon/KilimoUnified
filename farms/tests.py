
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Farm, FeedInventory, FeedType


class FeedInventoryCoverageTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.user = User.objects.create_user(
            username="test_farmer",
            password="test-password",
        )
        cls.farm = Farm.objects.create(
            owner=cls.user,
            name="Green Valley Dairy",
            location="Nakuru, Kenya",
        )
        cls.hay = FeedType.objects.create(
            name="Hay",
            category=FeedType.Category.HAY,
        )

    def make_inventory(
        self,
        stock="500",
        unusable="0",
        reserved="0",
        daily_use="50",
    ):
        return FeedInventory.objects.create(
            farm=self.farm,
            feed_type=self.hay,
            stock_kg=Decimal(stock),
            unusable_kg=Decimal(unusable),
            reserved_kg=Decimal(reserved),
            daily_consumption_kg=Decimal(daily_use),
        )

    def test_ten_days_of_feed(self):
        inventory = self.make_inventory()

        self.assertEqual(
            inventory.usable_stock_kg,
            Decimal("500"),
        )
        self.assertEqual(
            inventory.coverage_days,
            Decimal("10"),
        )

    def test_excludes_unusable_and_reserved_feed(self):
        inventory = self.make_inventory(
            stock="500",
            unusable="50",
            reserved="50",
            daily_use="40",
        )

        self.assertEqual(
            inventory.usable_stock_kg,
            Decimal("400"),
        )
        self.assertEqual(
            inventory.coverage_days,
            Decimal("10"),
        )

    def test_partial_day_coverage(self):
        inventory = self.make_inventory(
            stock="125",
            daily_use="50",
        )

        self.assertEqual(
            inventory.coverage_days,
            Decimal("2.5"),
        )

    def test_zero_consumption_has_no_finite_estimate(self):
        inventory = self.make_inventory(
            stock="500",
            daily_use="0",
        )

        self.assertIsNone(inventory.coverage_days)

    def test_empty_stock_means_zero_coverage(self):
        inventory = self.make_inventory(
            stock="0",
            daily_use="50",
        )

        self.assertEqual(
            inventory.coverage_days,
            Decimal("0"),
        )

    def test_duplicate_farm_feed_pair_is_rejected(self):
        self.make_inventory()

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.make_inventory()

    def test_negative_stock_is_rejected_by_database(self):
        self.make_inventory()

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                FeedInventory.objects.create(
                    farm=self.farm,
                    feed_type=FeedType.objects.create(
                        name="Silage",
                        category=FeedType.Category.SILAGE,
                    ),
                    stock_kg=Decimal("-1"),
                    unusable_kg=Decimal("0"),
                    reserved_kg=Decimal("0"),
                    daily_consumption_kg=Decimal("10"),
                )

    def test_unusable_and_reserved_stock_cannot_overlap(self):
        inventory = FeedInventory(
            farm=self.farm,
            feed_type=self.hay,
            stock_kg=Decimal("100"),
            unusable_kg=Decimal("60"),
            reserved_kg=Decimal("50"),
            daily_consumption_kg=Decimal("10"),
        )

        with self.assertRaises(ValidationError):
            inventory.full_clean()

    def test_negative_quantities_are_rejected_by_model_validation(self):
        inventory = FeedInventory(
            farm=self.farm,
            feed_type=self.hay,
            stock_kg=Decimal("-1"),
            daily_consumption_kg=Decimal("0"),
        )

        with self.assertRaises(ValidationError):
            inventory.full_clean()
