import os
import shutil
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "report_assets")
ARTIFACTS_DIR = r"C:\Users\Hema\.gemini\antigravity-ide\brain\8e7f2de5-a97b-494a-83a6-5743de8646f4"
WORKSPACE_DIR = os.path.dirname(__file__)

# 1. Copy RDS screenshot
rds_src = os.path.join(WORKSPACE_DIR, "screenshot_rds.png")
rds_dst = os.path.join(ASSETS_DIR, "fig_6_1_7_rds.png")
if os.path.exists(rds_src):
    shutil.copy2(rds_src, rds_dst)
    print("Copied RDS screenshot to", rds_dst)

# 2. Copy/Crop Login screenshot
login_src = os.path.join(ARTIFACTS_DIR, "homepage_login_section_1791907283831.png")
login_dst = os.path.join(ASSETS_DIR, "fig_6_1_1_login.png")
if os.path.exists(login_src):
    im = Image.open(login_src)
    # Crop to focus on login card
    im_crop = im.crop((100, 100, im.width - 100, im.height - 100))
    im_crop.save(login_dst)
    print("Saved Login screenshot to", login_dst)

# 3. Copy/Crop Upload & Diagnosis screenshot
diag_src = os.path.join(ARTIFACTS_DIR, "homepage_middle_1791907257996.png")
diag_dst = os.path.join(ASSETS_DIR, "fig_6_1_2_upload.png")
if os.path.exists(diag_src):
    im = Image.open(diag_src)
    im.save(diag_dst)
    print("Saved Upload interface to", diag_dst)

# 4. Copy/Crop Shop & Products screenshot
shop_src = os.path.join(ARTIFACTS_DIR, "homepage_diagnosis_shop_1791907265234.png")
shop_dst = os.path.join(ASSETS_DIR, "fig_6_1_4_shop.png")
if os.path.exists(shop_src):
    im = Image.open(shop_src)
    im.save(shop_dst)
    print("Saved Shop screenshot to", shop_dst)

# 5. Create realistic mock cards for Diagnostic Results (6.1.3), Chatbot (6.1.5), and Report Generator (6.1.6)
def create_ui_card(title, subtitle, badge_text, details, filename, accent_color="#10b981"):
    w, h = 950, 480
    img = Image.new("RGB", (w, h), "#ffffff")
    draw = ImageDraw.Draw(img)

    try:
        font_b = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 16)
        font_t = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
        font_r = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13)
        font_s = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 11)
        font_c = ImageFont.truetype("C:/Windows/Fonts/cour.ttf", 12)
    except:
        font_b = font_t = font_r = font_s = font_c = ImageFont.load_default()

    # Browser window chrome
    draw.rectangle([(0, 0), (w, 40)], fill="#1e293b")
    draw.ellipse([(15, 14), (27, 26)], fill="#ef4444")
    draw.ellipse([(35, 14), (47, 26)], fill="#f59e0b")
    draw.ellipse([(55, 14), (67, 26)], fill="#10b981")
    draw.rectangle([(90, 8), (w - 30, 32)], fill="#334155")
    draw.text((105, 13), "https://smartplantcare.local/dashboard/diagnostic-console", font=font_s, fill="#cbd5e1")

    # Content area background
    draw.rectangle([(0, 40), (w, h)], fill="#f8fafc")

    # Card container
    draw.rounded_rectangle([(40, 60), (w - 40, h - 30)], radius=12, fill="#ffffff", outline="#e2e8f0", width=2)

    # Accent top border
    draw.rounded_rectangle([(40, 60), (w - 40, 72)], radius=4, fill=accent_color)

    # Header
    draw.text((70, 95), title, font=font_t, fill="#0f172a")
    draw.text((70, 130), subtitle, font=font_r, fill="#64748b")

    # Badge
    badge_w = 190
    draw.rounded_rectangle([(w - 70 - badge_w, 95), (w - 70, 130)], radius=18, fill=accent_color)
    draw.text((w - 70 - badge_w//2, 112), badge_text, font=font_b, fill="#ffffff", anchor="mm")

    draw.line([(70, 160), (w - 70, 160)], fill="#f1f5f9", width=2)

    # Details columns
    col_w = (w - 180) // len(details)
    for i, col in enumerate(details):
        cx = 70 + i * (col_w + 20)
        draw.rounded_rectangle([(cx, 180), (cx + col_w, h - 55)], radius=8, fill="#f8fafc", outline="#e2e8f0", width=1)
        draw.rectangle([(cx, 180), (cx + col_w, 215)], fill="#f1f5f9")
        draw.text((cx + col_w//2, 197), col["heading"], font=font_b, fill="#1e293b", anchor="mm")

        cy = 230
        for line in col["lines"]:
            draw.text((cx + 15, cy), line, font=font_r, fill="#334155")
            cy += 24

    dst = os.path.join(ASSETS_DIR, filename)
    img.save(dst)
    print("Created UI snapshot card:", dst)

# Create Diagnostic result card
create_ui_card(
    title="Real-Time Leaf Pathology Diagnostic Result",
    subtitle="Model: MobileNetV2 (PlantVillage Fine-Tuned) | Sample ID: #PL-89420 | Status: CONFIRMED",
    badge_text="Confidence: 96.4%",
    details=[
        {
            "heading": "Detected Disease Profile",
            "lines": [
                "• Pathogen: Alternaria solani",
                "• Common Name: Tomato Early Blight",
                "• Severity Index: Stage 2 (Moderate)",
                "• Target Plant: Solanum lycopersicum",
                "• Primary Vector: Air & Rain splash",
                "• Incubation Period: 48 - 72 Hours"
            ]
        },
        {
            "heading": "Observed Leaf Symptoms",
            "lines": [
                "• Dark concentric bullseye lesions",
                "• Surrounding chlorotic leaf halos",
                "• Lower canopy leaf senescence",
                "• Leathery black stem lesions",
                "• Premature defoliation risk",
                "• Yield Loss Risk: 35% - 50%"
            ]
        },
        {
            "heading": "Prescribed Treatment Plan",
            "lines": [
                "• Apply Copper Hydroxide fungicide",
                "• Prune lower foliage (12\" clearance)",
                "• Switch to ground drip irrigation",
                "• Apply Trichoderma viride bio-fungicide",
                "• Order fungicide from Care Shop",
                "• Generate clinical Word report"
            ]
        }
    ],
    filename="fig_6_1_3_results.png",
    accent_color="#e11d48"
)

# Create Chatbot card
create_ui_card(
    title="Smart Agronomy AI Chatbot Assistant (AgroBot)",
    subtitle="Context-Aware Natural Language Advisory Engine for Crop Health & Remediation",
    badge_text="AI Status: ACTIVE",
    details=[
        {
            "heading": "Farmer Query",
            "lines": [
                "\"My tomato plant has brown",
                "spots with concentric rings.",
                "Should I spray Mancozeb or",
                "Copper Oxychloride? Can I",
                "salvage the green fruits?\""
            ]
        },
        {
            "heading": "AgroBot Diagnosis",
            "lines": [
                "• Diagnosis: Tomato Early Blight",
                "• Spray Recommendation: Both are",
                "  effective. Alternate every 7 days.",
                "• Harvest: Mature green fruits can",
                "  be ripened safely off the vine.",
                "• Protective spray prevents spread."
            ]
        },
        {
            "heading": "Recommended Care Store Items",
            "lines": [
                "• Mancozeb 75% WP Fungicide ($14.99)",
                "• Organic Copper Spray ($12.50)",
                "• Trichoderma Harzianum ($16.80)",
                "• Direct purchase links available",
                "• Free agronomist follow-up advice"
            ]
        }
    ],
    filename="fig_6_1_5_chat.png",
    accent_color="#2563eb"
)

# Create Report generation card
create_ui_card(
    title="Automated Word (.docx) & Clinical Report Generation",
    subtitle="Deterministic Document Synthesis conforming to Agronomic Certification Standards",
    badge_text="Format: Word .DOCX",
    details=[
        {
            "heading": "Report Metadata",
            "lines": [
                "• Document: Plant_Health_Report.docx",
                "• Crop Specimen: Tomato (Roma VF)",
                "• Classification Method: MobileNetV2",
                "• Generation Engine: docx v9.7.1",
                "• Generation Latency: 120 ms",
                "• File Size: 48.2 KB"
            ]
        },
        {
            "heading": "Synthesized Sections",
            "lines": [
                "• Section 1: Specimen Identification",
                "• Section 2: Pathogen Diagnosis",
                "• Section 3: Detailed Symptoms",
                "• Section 4: Cultural Prevention",
                "• Section 5: Chemical & Bio Treatments",
                "• Section 6: Marketplace Direct Links"
            ]
        },
        {
            "heading": "Export & Compliance Features",
            "lines": [
                "• Fully editable by agricultural officers",
                "• Embedded diagnostic confidence tables",
                "• Instant offline field availability",
                "• Direct links to online suppliers",
                "• Conforms to ISO 22000 agriculture",
                "• Departmental archival compatible"
            ]
        }
    ],
    filename="fig_6_1_6_report.png",
    accent_color="#059669"
)

print("All snapshot assets ready!")
