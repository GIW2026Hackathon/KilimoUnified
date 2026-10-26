
from decimal import Decimal
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from .models import Farm, FeedInventory, FeedType
from .services.inventory import (
    InventoryStatus,
    calculate_projected_stock,
    correct_physical_stock,
    get_inventory_status,
    mark_feed_unusable,
    receive_usable_feed,
    record_consumption,
    release_reservation,
    remove_unusable_feed,
    reserve_usable_feed,
    update_daily_consumption,
)


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
            latitude=Decimal("-0.303099"),
            longitude=Decimal("36.080025"),
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

    def test_projection_clamps_at_zero_and_does_not_save(self):
        inventory = self.make_inventory(stock="100", daily_use="20")

        self.assertEqual(
            calculate_projected_stock(inventory, Decimal("3")),
            Decimal("40"),
        )
        self.assertEqual(
            calculate_projected_stock(inventory, Decimal("8")),
            Decimal("0"),
        )
        inventory.refresh_from_db()
        self.assertEqual(inventory.stock_kg, Decimal("100.00"))

    def test_unknown_daily_consumption_has_unknown_projection_and_status(self):
        inventory = self.make_inventory()
        inventory.daily_consumption_kg = None

        self.assertIsNone(calculate_projected_stock(inventory, Decimal("2")))
        self.assertIsNone(inventory.coverage_days)
        self.assertEqual(get_inventory_status(inventory), InventoryStatus.UNKNOWN)

    def test_status_threshold_boundaries(self):
        exactly_seven = self.make_inventory(stock="70", daily_use="10")
        self.assertEqual(get_inventory_status(exactly_seven), InventoryStatus.CRITICAL)

        exactly_fourteen = FeedInventory(
            farm=self.farm,
            feed_type=FeedType.objects.create(name="Silage"),
            stock_kg=Decimal("140"),
            unusable_kg=Decimal("0"),
            reserved_kg=Decimal("0"),
            daily_consumption_kg=Decimal("10"),
        )
        self.assertEqual(get_inventory_status(exactly_fourteen), InventoryStatus.LOW)

    def test_status_above_fourteen_days_is_healthy(self):
        inventory = self.make_inventory(stock="150", daily_use="10")

        self.assertEqual(get_inventory_status(inventory), InventoryStatus.HEALTHY)

    def test_receive_consumption_and_mark_remove_unusable(self):
        inventory = self.make_inventory(
            stock="100",
            unusable="10",
            reserved="10",
            daily_use="5",
        )

        inventory = receive_usable_feed(inventory, Decimal("20"))
        self.assertEqual(inventory.stock_kg, Decimal("120.00"))
        self.assertEqual(inventory.unusable_kg, Decimal("10.00"))
        self.assertEqual(inventory.reserved_kg, Decimal("10.00"))

        inventory = record_consumption(inventory.pk, Decimal("15"))
        self.assertEqual(inventory.stock_kg, Decimal("105.00"))
        self.assertEqual(inventory.usable_stock_kg, Decimal("85.00"))

        inventory = mark_feed_unusable(inventory, Decimal("5"))
        self.assertEqual(inventory.stock_kg, Decimal("105.00"))
        self.assertEqual(inventory.unusable_kg, Decimal("15.00"))

        inventory = remove_unusable_feed(inventory.pk, Decimal("5"))
        self.assertEqual(inventory.stock_kg, Decimal("100.00"))
        self.assertEqual(inventory.unusable_kg, Decimal("10.00"))

    def test_reserve_release_and_daily_consumption_update(self):
        inventory = self.make_inventory(stock="100", daily_use="10")

        inventory = reserve_usable_feed(inventory, Decimal("30"))
        self.assertEqual(inventory.usable_stock_kg, Decimal("70.00"))
        inventory = release_reservation(inventory.pk, Decimal("10"))
        self.assertEqual(inventory.usable_stock_kg, Decimal("80.00"))

        inventory = update_daily_consumption(inventory, Decimal("20"))
        self.assertEqual(inventory.daily_consumption_kg, Decimal("20.00"))
        self.assertEqual(inventory.stock_kg, Decimal("100.00"))
        self.assertEqual(inventory.coverage_days, Decimal("4"))

    def test_invalid_operations_leave_inventory_unchanged(self):
        inventory = self.make_inventory(
            stock="100",
            unusable="10",
            reserved="20",
            daily_use="5",
        )
        original_values = (inventory.stock_kg, inventory.unusable_kg, inventory.reserved_kg)

        invalid_operations = (
            (record_consumption, Decimal("71")),
            (mark_feed_unusable, Decimal("71")),
            (reserve_usable_feed, Decimal("71")),
            (release_reservation, Decimal("21")),
            (remove_unusable_feed, Decimal("11")),
            (receive_usable_feed, Decimal("0")),
            (record_consumption, Decimal("-1")),
        )
        for operation, quantity in invalid_operations:
            with self.subTest(operation=operation.__name__, quantity=quantity):
                with self.assertRaises(ValidationError):
                    operation(inventory.pk, quantity)

        inventory.refresh_from_db()
        self.assertEqual(
            (inventory.stock_kg, inventory.unusable_kg, inventory.reserved_kg),
            original_values,
        )

    def test_physical_count_correction_preserves_committed_stock(self):
        inventory = self.make_inventory(stock="100", unusable="10", reserved="20")

        inventory = correct_physical_stock(inventory, Decimal("30"))
        self.assertEqual(inventory.stock_kg, Decimal("30.00"))
        self.assertEqual(inventory.usable_stock_kg, Decimal("0.00"))

        with self.assertRaises(ValidationError):
            correct_physical_stock(inventory.pk, Decimal("29.99"))
        with self.assertRaises(ValidationError):
            correct_physical_stock(inventory.pk, Decimal("-1"))

    def test_successful_operation_updates_timestamp(self):
        inventory = self.make_inventory()
        earlier = timezone.now() - timedelta(days=1)
        FeedInventory.objects.filter(pk=inventory.pk).update(updated_at=earlier)

        updated = receive_usable_feed(inventory.pk, Decimal("1"))

        self.assertGreater(updated.updated_at, earlier)
