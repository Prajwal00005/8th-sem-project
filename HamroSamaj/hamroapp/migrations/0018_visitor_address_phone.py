from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hamroapp', '0017_adminsubscriptionpayment_extended_until'),
    ]

    operations = [
        migrations.AddField(
            model_name='visitor',
            name='address',
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='visitor',
            name='phone_number',
            field=models.CharField(max_length=20, null=True, blank=True),
        ),
    ]
