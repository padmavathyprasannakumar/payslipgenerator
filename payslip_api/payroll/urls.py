from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CompanyProfileView, LoginView, LogoutView, PayslipViewSet, RegisterView, UserProfileView

router = DefaultRouter()
router.register(r"payslips", PayslipViewSet, basename="payslip")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/user/", UserProfileView.as_view(), name="user-profile"),
    path("company/", CompanyProfileView.as_view(), name="company-profile"),
    path("", include(router.urls)),
]
