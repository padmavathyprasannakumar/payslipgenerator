from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import CompanyProfile, Payslip


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs.get("username"), password=attrs.get("password"))
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class CompanyProfileSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = CompanyProfile
        fields = ["id", "company_name", "address", "email", "phone", "website", "logo", "logo_url", "updated_at"]
        read_only_fields = ["updated_at"]

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if obj.logo:
            url = obj.logo.url
            return request.build_absolute_uri(url) if request else url
        return ""


class PayslipSerializer(serializers.ModelSerializer):
    total_earnings = serializers.ReadOnlyField()
    total_deductions = serializers.ReadOnlyField()
    net_pay = serializers.ReadOnlyField()
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Payslip
        fields = "__all__"
        read_only_fields = ["created_by", "created_at"]
