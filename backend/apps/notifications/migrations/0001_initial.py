from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0003_normal_user_role'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(
                    choices=[
                        ('new_referral', 'New Referral'),
                        ('new_patient_request', 'New Patient Request'),
                        ('referral_incoming', 'Incoming Referral'),
                        ('patient_request_incoming', 'Incoming Patient Request'),
                        ('new_service_added', 'New Service Added'),
                        ('referral_status', 'Referral Status Update'),
                        ('patient_request_status', 'Patient Request Status Update'),
                        ('info', 'Information'),
                    ],
                    max_length=40,
                    verbose_name='Type',
                )),
                ('title', models.CharField(max_length=255, verbose_name='Title')),
                ('message', models.TextField(verbose_name='Message')),
                ('is_read', models.BooleanField(default=False, verbose_name='Is Read')),
                ('link_url', models.CharField(blank=True, default='', max_length=300, verbose_name='Link URL')),
                ('metadata', models.JSONField(blank=True, default=dict, verbose_name='Metadata')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('recipient', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to='accounts.user',
                    verbose_name='Recipient',
                )),
            ],
            options={
                'verbose_name': 'Notification',
                'verbose_name_plural': 'Notifications',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', '-created_at'], name='notif_recipient_created_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['recipient', 'is_read'], name='notif_recipient_read_idx'),
        ),
    ]
