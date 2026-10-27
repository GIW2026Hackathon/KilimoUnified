from django import forms

from farms.models import Farm


class FarmQuestionForm(forms.Form):
    farm = forms.ModelChoiceField(queryset=Farm.objects.none(), label="Farm")
    question = forms.CharField(
        max_length=1000,
        strip=True,
        widget=forms.Textarea(attrs={
            "rows": 3,
            "maxlength": 1000,
            "placeholder": "Ask about feed stock, coverage, risk, alerts, or the stored forecast.",
            "class": "textarea w-full",
        }),
    )

    def __init__(self, *args, farms, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["farm"].queryset = farms
        self.fields["farm"].widget.attrs["class"] = "select w-full"
