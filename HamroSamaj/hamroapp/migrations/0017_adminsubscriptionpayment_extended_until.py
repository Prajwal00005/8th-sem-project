from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hamroapp', '0016_remove_chatroom_left_by_blockeduser'),
    ]

    operations = [
        migrations.AddField(
            model_name='adminsubscriptionpayment',
            name='extended_until',
            field=models.DateField(blank=True, null=True),
        ),
    ]
