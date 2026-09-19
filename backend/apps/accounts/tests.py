from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User


class PublicRegistrationAndLoginTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.password = 'StrongPass934!'

    def test_public_registration_creates_normal_user_and_returns_tokens(self):
        response = self.client.post(
            self.register_url,
            {
                'username': 'normaluser',
                'email': 'normal@example.com',
                'first_name': 'Normal',
                'last_name': 'User',
                'phone': '9800000000',
                'password': self.password,
                'password2': self.password,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'user')

        user = User.objects.get(username='normaluser')
        self.assertEqual(user.role, 'user')
        self.assertTrue(user.check_password(self.password))
        self.assertNotEqual(user.password, self.password)

    def test_registration_rejects_mismatched_passwords(self):
        response = self.client.post(
            self.register_url,
            {
                'username': 'mismatchuser',
                'email': 'mismatch@example.com',
                'password': self.password,
                'password2': 'DifferentPass934!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        User.objects.create_user(
            username='existing',
            email='SomeOne@Example.com',
            password=self.password,
            role='user',
        )

        response = self.client.post(
            self.register_url,
            {
                'username': 'another',
                'email': 'someone@example.com',
                'password': self.password,
                'password2': self.password,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_login_accepts_username(self):
        User.objects.create_user(
            username='loginuser',
            email='login@example.com',
            password=self.password,
            role='user',
            is_verified=True,
        )

        response = self.client.post(
            self.login_url,
            {'username': 'loginuser', 'password': self.password},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], 'user')
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_accepts_email(self):
        User.objects.create_user(
            username='emailuser',
            email='email@example.com',
            password=self.password,
            role='user',
            is_verified=True,
        )

        response = self.client.post(
            self.login_url,
            {'username': 'EMAIL@example.com', 'password': self.password},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'emailuser')
