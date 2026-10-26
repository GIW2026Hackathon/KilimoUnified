from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User

class CustomUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", strip=False, widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirm password", strip=False, widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('username', 'email')

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password1')
        password_confirmation = cleaned_data.get('password2')
        if password and password_confirmation and password != password_confirmation:
            self.add_error('password2', 'The two password fields did not match.')
        if password:
            user = User(
                username=cleaned_data.get('username', ''),
                email=cleaned_data.get('email', ''),
            )
            try:
                validate_password(password, user)
            except ValidationError as error:
                self.add_error('password1', error)
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
            self.save_m2m()
        return user

class CustomAuthenticationForm(AuthenticationForm):
  """
  Login form
  """
  username = forms.CharField(widget=forms.TextInput(attrs={
      'class': 'input w-full',
      'placeholder': 'Username',
      'autocomplete': 'username',
  }))
  password = forms.CharField(widget=forms.PasswordInput(attrs={
      'class': 'input w-full',
      'placeholder': 'Password',
      'autocomplete': 'current-password',
  }))