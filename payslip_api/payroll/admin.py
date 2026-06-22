from django.contrib import admin
from django.utils.html import format_html
from .models import CompanyProfile, Payslip


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ("company_name", "address", "logo_preview", "updated_at")
    readonly_fields = ("logo_preview",)

    fieldsets = (
        ("Company Details", {"fields": ("company_name", "address", "email", "phone", "website")}),
        ("Logo", {"fields": ("logo", "logo_preview")}),
    )

    def logo_preview(self, obj):
        if obj and obj.logo:
            return format_html(
                '<img src="{}" style="height:80px;width:80px;object-fit:contain;background:#fff;border:1px solid #ddd;padding:4px;" />',
                obj.logo.url,
            )
        return "No logo uploaded"

    logo_preview.short_description = "Logo Preview"

    def has_add_permission(self, request):
        # Allow only one company profile. Edit the existing profile to change logo.
        return not CompanyProfile.objects.exists()


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ("employee_name", "employee_id", "pay_period", "pay_date", "net_pay", "created_by")
    search_fields = ("employee_name", "employee_id", "pay_period")
    list_filter = ("pay_period", "pay_date", "created_at")
