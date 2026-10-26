"""Validated inventory calculations and stock-balance operations.

Status thresholds are provisional business defaults, not universal agricultural
recommendations. SQLite does not provide PostgreSQL-style row locking; transactions
and database constraints protect integrity, but high-contention deployments should
use a database with effective row-level locking.
"""

from decimal import Decimal, InvalidOperation
from typing import TypeAlias

from django.core.exceptions import ValidationError
from django.db import transaction

from farms.models import FeedInventory


InventoryInput: TypeAlias = FeedInventory | int | str
ZERO = Decimal("0")
HEALTHY_COVERAGE_DAYS = Decimal("14")
LOW_COVERAGE_DAYS = Decimal("7")


class InventoryStatus:
    HEALTHY = "HEALTHY"
    LOW = "LOW"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"


def _as_decimal(value, *, field_name: str) -> Decimal:
    """Accept exact decimal-compatible inputs, rejecting floats and non-finite values."""
    if isinstance(value, float) or isinstance(value, bool):
        raise ValidationError({field_name: "Enter a decimal value, not a float."})
    try:
        result = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError({field_name: "Enter a valid decimal value."}) from None
    if not result.is_finite():
        raise ValidationError({field_name: "Enter a finite decimal value."})
    return result


def _quantity(value, *, field_name: str = "quantity", allow_zero: bool = False) -> Decimal:
    amount = _as_decimal(value, field_name=field_name)
    if amount < ZERO or (amount == ZERO and not allow_zero):
        qualifier = "non-negative" if allow_zero else "greater than zero"
        raise ValidationError({field_name: f"Quantity must be {qualifier}."})
    return amount


def _inventory_id(inventory_or_id: InventoryInput):
    if isinstance(inventory_or_id, FeedInventory):
        if inventory_or_id.pk is None:
            raise ValidationError("Inventory record must be saved before it can be changed.")
        return inventory_or_id.pk
    if isinstance(inventory_or_id, bool):
        raise ValidationError("A saved inventory record or its ID is required.")
    return inventory_or_id


def _locked_inventory(inventory_or_id: InventoryInput) -> FeedInventory:
    return FeedInventory.objects.select_for_update().get(pk=_inventory_id(inventory_or_id))


def _save_locked_inventory(inventory: FeedInventory, *fields: str) -> FeedInventory:
    inventory.full_clean()
    inventory.save(update_fields=(*fields, "updated_at"))
    return inventory


def calculate_projected_stock(inventory: FeedInventory, days) -> Decimal | None:
    """Return projected usable stock, or None when daily consumption is unknown."""
    days_value = _quantity(days, field_name="days", allow_zero=True)
    if inventory.daily_consumption_kg is None:
        return None
    consumption = _as_decimal(
        inventory.daily_consumption_kg,
        field_name="daily_consumption_kg",
    )
    usable_stock = _as_decimal(inventory.usable_stock_kg, field_name="usable_stock_kg")
    return max(ZERO, usable_stock - consumption * days_value)


def get_inventory_status(inventory: FeedInventory) -> str:
    """Classify the inventory using provisional coverage thresholds."""
    coverage = inventory.coverage_days
    if coverage is None:
        return InventoryStatus.UNKNOWN
    if coverage > HEALTHY_COVERAGE_DAYS:
        return InventoryStatus.HEALTHY
    if coverage > LOW_COVERAGE_DAYS:
        return InventoryStatus.LOW
    return InventoryStatus.CRITICAL


def receive_usable_feed(inventory_or_id: InventoryInput, quantity) -> FeedInventory:
    amount = _quantity(quantity)
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        inventory.stock_kg += amount
        return _save_locked_inventory(inventory, "stock_kg")


def record_consumption(inventory_or_id: InventoryInput, quantity) -> FeedInventory:
    amount = _quantity(quantity)
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        if amount > inventory.usable_stock_kg:
            raise ValidationError({"quantity": "Consumption exceeds available usable stock."})
        inventory.stock_kg -= amount
        return _save_locked_inventory(inventory, "stock_kg")


def mark_feed_unusable(inventory_or_id: InventoryInput, quantity) -> FeedInventory:
    amount = _quantity(quantity)
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        if amount > inventory.usable_stock_kg:
            raise ValidationError({"quantity": "Quantity exceeds available usable stock."})
        inventory.unusable_kg += amount
        return _save_locked_inventory(inventory, "unusable_kg")


def remove_unusable_feed(inventory_or_id: InventoryInput, quantity) -> FeedInventory:
    amount = _quantity(quantity)
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        if amount > inventory.unusable_kg:
            raise ValidationError({"quantity": "Quantity exceeds unusable stock."})
        inventory.stock_kg -= amount
        inventory.unusable_kg -= amount
        return _save_locked_inventory(inventory, "stock_kg", "unusable_kg")


def reserve_usable_feed(inventory_or_id: InventoryInput, quantity) -> FeedInventory:
    amount = _quantity(quantity)
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        if amount > inventory.usable_stock_kg:
            raise ValidationError({"quantity": "Reservation exceeds available usable stock."})
        inventory.reserved_kg += amount
        return _save_locked_inventory(inventory, "reserved_kg")


def release_reservation(inventory_or_id: InventoryInput, quantity) -> FeedInventory:
    amount = _quantity(quantity)
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        if amount > inventory.reserved_kg:
            raise ValidationError({"quantity": "Release exceeds the current reservation."})
        inventory.reserved_kg -= amount
        return _save_locked_inventory(inventory, "reserved_kg")


def correct_physical_stock(inventory_or_id: InventoryInput, physical_quantity) -> FeedInventory:
    amount = _quantity(
        physical_quantity,
        field_name="physical_quantity",
        allow_zero=True,
    )
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        committed = inventory.unusable_kg + inventory.reserved_kg
        if amount < committed:
            raise ValidationError({
                "physical_quantity": "Physical stock cannot be below unusable plus reserved stock."
            })
        inventory.stock_kg = amount
        return _save_locked_inventory(inventory, "stock_kg")


def update_daily_consumption(inventory_or_id: InventoryInput, quantity) -> FeedInventory:
    """Set farmer-entered daily use without inferring it from stock movements."""
    amount = _quantity(
        quantity,
        field_name="daily_consumption_kg",
        allow_zero=True,
    )
    with transaction.atomic():
        inventory = _locked_inventory(inventory_or_id)
        inventory.daily_consumption_kg = amount
        return _save_locked_inventory(inventory, "daily_consumption_kg")
