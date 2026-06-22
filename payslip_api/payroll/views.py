from io import BytesIO

from django.conf import settings
from django.http import HttpResponse
from pathlib import Path
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image as RLImage, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import CompanyProfile, Payslip
from .serializers import CompanyProfileSerializer, LoginSerializer, PayslipSerializer, RegisterSerializer, UserSerializer


RUPEE_SYMBOL = "₹"


def register_pdf_unicode_fonts():
    """Register a Unicode font so the Indian rupee symbol prints correctly in PDFs.

    ReportLab's default Helvetica font cannot display ₹, so the PDF shows a black box.
    This function uses fonts that normally already exist on Windows or Linux. No font file
    is bundled in the project; the code only loads an installed system font.
    """
    font_pairs = [
        # Windows fonts
        ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf"),
        ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
        ("C:/Windows/Fonts/Nirmala.ttf", "C:/Windows/Fonts/NirmalaB.ttf"),
        # Common Linux / Render fonts
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf", "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"),
    ]

    for regular_path, bold_path in font_pairs:
        regular = Path(regular_path)
        bold = Path(bold_path)
        if regular.exists():
            try:
                pdfmetrics.registerFont(TTFont("PayslipUnicode", str(regular)))
                if bold.exists():
                    pdfmetrics.registerFont(TTFont("PayslipUnicode-Bold", str(bold)))
                    return "PayslipUnicode", "PayslipUnicode-Bold"
                return "PayslipUnicode", "PayslipUnicode"
            except Exception:
                continue

    # Fallback. If no Unicode font is available, the rest of the PDF still downloads.
    return "Helvetica", "Helvetica-Bold"


def rupee(value):
    return f"{RUPEE_SYMBOL}{float(value or 0):.2f}"


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "message": "Signup successful.",
                "token": token.key,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "message": "Login successful.",
                "token": token.key,
                "user": UserSerializer(user).data,
            }
        )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Logout successful."})


class CompanyProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        profile = CompanyProfile.get_profile()
        serializer = CompanyProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)


class PayslipViewSet(viewsets.ModelViewSet):
    serializer_class = PayslipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payslip.objects.filter(created_by=self.request.user).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        payslip = self.get_object()
        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="payslip_{payslip.id}.pdf"'

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=22 * mm,
            leftMargin=22 * mm,
            topMargin=25 * mm,
            bottomMargin=20 * mm,
        )

        pdf_regular_font, pdf_bold_font = register_pdf_unicode_fonts()

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CompanyTitle",
            parent=styles["Title"],
            fontName=pdf_bold_font,
            fontSize=18,
            leading=22,
            alignment=1,
            spaceAfter=2,
        )
        address_style = ParagraphStyle(
            "Address",
            parent=styles["Normal"],
            fontName=pdf_regular_font,
            fontSize=11,
            alignment=1,
            spaceAfter=16,
        )
        payslip_title = ParagraphStyle(
            "PayslipTitle",
            parent=styles["Title"],
            fontName=pdf_bold_font,
            fontSize=17,
            leading=22,
            alignment=1,
            spaceAfter=18,
        )
        normal = ParagraphStyle("PayslipNormal", parent=styles["Normal"], fontName=pdf_regular_font, fontSize=11, leading=15)

        profile = CompanyProfile.get_profile()
        elements = []

        if profile.logo:
            logo_path = Path(profile.logo.path)
            if logo_path.exists():
                logo = RLImage(str(logo_path), width=25 * mm, height=25 * mm)
                logo.hAlign = "CENTER"
                elements.append(logo)
                elements.append(Spacer(1, 5))

        elements.extend(
            [
                Paragraph(profile.company_name, title_style),
                Paragraph(profile.address, address_style),
                Paragraph("PAYSLIP", payslip_title),
            ]
        )

        employee_html = (
            f"<b>Employee:</b> {payslip.employee_name}<br/>"
            f"<b>ID:</b> {payslip.employee_id}<br/>"
            f"<b>Period:</b> {payslip.pay_period}<br/>"
            f"<b>Pay Date:</b> {payslip.pay_date.strftime('%d/%m/%Y')}"
        )
        employee_table = Table([[Paragraph(employee_html, normal)]], colWidths=[170 * mm])
        employee_table.setStyle(
            TableStyle(
                [
                    ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elements.append(employee_table)
        elements.append(Spacer(1, 12))

        header_blue = colors.HexColor("#0d3ddf")

        earnings_data = [
            ["PAYMENTS", ""],
            ["Basic:", rupee(payslip.basic_salary)],
            ["HRA:", rupee(payslip.hra)],
            ["Total:", rupee(payslip.total_earnings)],
        ]
        earnings_table = Table(earnings_data, colWidths=[115 * mm, 55 * mm])
        earnings_table.setStyle(
            TableStyle(
                [
                    ("SPAN", (0, 0), (-1, 0)),
                    ("BACKGROUND", (0, 0), (-1, 0), header_blue),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, -1), pdf_regular_font),
                    ("FONTNAME", (0, 0), (-1, 0), pdf_bold_font),
                    ("FONTNAME", (0, -1), (-1, -1), pdf_bold_font),
                    ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                    ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                    ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.black),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elements.append(earnings_table)
        elements.append(Spacer(1, 12))

        deductions_data = [
            ["DEDUCTIONS", ""],
            ["Tax:", rupee(payslip.income_tax)],
            ["PF:", rupee(payslip.provident_fund)],
            [f"Leave ({payslip.leave_days:g} days):", rupee(payslip.leave_deduction)],
            ["Total Deduction:", rupee(payslip.total_deductions)],
        ]
        deductions_table = Table(deductions_data, colWidths=[115 * mm, 55 * mm])
        deductions_table.setStyle(
            TableStyle(
                [
                    ("SPAN", (0, 0), (-1, 0)),
                    ("BACKGROUND", (0, 0), (-1, 0), header_blue),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, -1), pdf_regular_font),
                    ("FONTNAME", (0, 0), (-1, 0), pdf_bold_font),
                    ("FONTNAME", (0, -1), (-1, -1), pdf_bold_font),
                    ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                    ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                    ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.black),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elements.append(deductions_table)
        elements.append(Spacer(1, 14))

        net_table = Table([[f"NET PAY: {rupee(payslip.net_pay)}"]], colWidths=[170 * mm])
        net_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0f1f2e")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                    ("FONTNAME", (0, 0), (-1, -1), pdf_bold_font),
                    ("FONTSIZE", (0, 0), (-1, -1), 13),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        elements.append(net_table)

        def draw_pdf_footer(canvas, document):
            canvas.saveState()
            footer_y = 11 * mm
            logo_size = 11 * mm
            left_x = document.leftMargin

            if profile.logo:
                logo_file = Path(profile.logo.path)
                if logo_file.exists():
                    try:
                        canvas.drawImage(
                            str(logo_file),
                            left_x,
                            footer_y - 2 * mm,
                            width=logo_size,
                            height=logo_size,
                            preserveAspectRatio=True,
                            mask="auto",
                        )
                    except Exception:
                        pass

            canvas.setFont(pdf_bold_font, 8)
            canvas.drawString(left_x + 14 * mm, footer_y + 4 * mm, profile.company_name)
            canvas.setFont(pdf_regular_font, 8)
            canvas.drawString(left_x + 14 * mm, footer_y, profile.address)
            canvas.drawRightString(A4[0] - document.rightMargin, footer_y, f"Page {document.page}")
            canvas.restoreState()

        doc.build(elements, onFirstPage=draw_pdf_footer, onLaterPages=draw_pdf_footer)
        response.write(buffer.getvalue())
        buffer.close()
        return response
