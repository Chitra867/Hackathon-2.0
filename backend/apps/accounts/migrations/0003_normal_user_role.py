from django.db import migrations, models


def patient_to_user(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='patient').update(role='user')


def user_to_patient(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='user').update(role='patient')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(patient_to_user, user_to_patient),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('user', 'User'),
                    ('health_worker', 'Health Worker'),
                    ('hospital_staff', 'Hospital Staff'),
                    ('hospital_admin', 'Hospital Admin'),
                    ('system_admin', 'System Admin'),
                ],
                default='user',
                max_length=20,
                verbose_name='Role',
            ),
        ),
    ]
