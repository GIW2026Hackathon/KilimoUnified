from django import forms

from farms.models import Farm


class FarmForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs["class"] = "input w-full"

    class Meta:
        model = Farm
        fields = ("name", "county", "location", "latitude", "longitude")

    def clean(self):
        cleaned = super().clean()
        if (cleaned.get("latitude") is None) != (cleaned.get("longitude") is None):
            raise forms.ValidationError("Enter both coordinates or leave both blank.")
        return cleaned
