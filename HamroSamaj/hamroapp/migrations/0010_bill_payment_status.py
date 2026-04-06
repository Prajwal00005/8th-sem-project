from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hamroapp", "0009_complaint_custom_sentiment_complaint_sentiment"),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="payment_status",
            field=models.CharField(
                max_length=20,
                choices=[("unpaid", "Unpaid"), ("paid", "Paid")],
                default="unpaid",
            ),
        ),
    ]
