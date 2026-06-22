from django.conf import settings
from django.db import models
from django.utils import timezone


class CompanyProfile(models.Model):
    company_name = models.CharField(max_length=150, default="Vetri Technology Solutions")
    address = models.CharField(max_length=255, default="No2, Surandai, Tenkasi - 546678")
    logo = models.ImageField(upload_to="company_logos/", null=True, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Company Profile"
        verbose_name_plural = "Company Profile"

    def __str__(self):
        return self.company_name

    @classmethod
    def get_profile(cls):
        profile, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "company_name": "Vetri Technology Solutions",
                "address": "No2, Surandai, Tenkasi - 546678",
            },
        )
        return profile

    def save(self, *args, **kwargs):
        # Keep only one company profile row, so the frontend always uses the same logo.
        self.pk = 1
        super().save(*args, **kwargs)


class Payslip(models.Model):
    employee_name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=20)
    pay_period = models.CharField(max_length=50)
    pay_date = models.DateField(default=timezone.now)
    basic_salary = models.FloatField()
    hra = models.FloatField()
    income_tax = models.FloatField()
    provident_fund = models.FloatField()
    leave_days = models.FloatField(default=0)
    # Existing field kept for old database compatibility. New logo should be uploaded in Company Profile.
    company_logo = models.ImageField(upload_to="logos/", null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payslips",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.employee_name} - {self.pay_period}"

    @property
    def total_earnings(self):
        return float(self.basic_salary or 0) + float(self.hra or 0)

    @property
    def leave_deduction(self):
        # One day leave deduction is calculated from monthly salary / 30 days.
        daily_salary = float(self.basic_salary or 0) / 30
        return float(self.leave_days or 0) * daily_salary

    @property
    def total_deductions(self):
        return float(self.income_tax or 0) + float(self.provident_fund or 0) + self.leave_deduction

    @property
    def net_pay(self):
        return self.total_earnings - self.total_deductions
