#!/usr/bin/env python3
"""Generate localized thank-you-payment pages from the English template."""
import os, re

BASE = "/var/www/psdepot.com/thank-you-payment.html"
OUTDIR = "/var/www/psdepot.com"

with open(BASE, "r", encoding="utf-8") as f:
    template = f.read()

# Translation dictionaries: key = English source string, value = translated.
# Each language: {lang, dir, locale, title, translations...}
LANGS = {
    "spanish": {
        "lang": "es", "dir": "ltr", "locale": "es-US",
        "title": "Gracias por su Pago | Performance Supply Depot",
        "map": {
            "Payment Received": "Pago Recibido",
            "Thank You!": "¡Gracias!",
            "Your payment has been successfully processed": "Su pago se ha procesado correctamente",
            "Payment Confirmed": "Pago Confirmado",
            "We Truly Appreciate Your Business!": "¡Realmente Apreciamos su Negocio!",
            "Dear Valued Customer,": "Estimado Cliente Valioso,",
            "Dear <strong>": "Estimado <strong>",
            "On behalf of <strong>Performance Supply Depot</strong>, \n                    we want to express our sincere gratitude for your recent payment. \n                    Your trust and partnership mean the world to us.":
                "En nombre de <strong>Performance Supply Depot</strong>, queremos expresar nuestra sincera gratitud por su reciente pago. Su confianza y asociación significan mucho para nosotros.",
            "Together, we're building something great.": "Juntos, estamos construyendo algo grandioso.",
            "Transaction Summary": "Resumen de la Transacción",
            "Payment Date:": "Fecha de Pago:",
            "Reference Number:": "Número de Referencia:",
            "Amount Paid:": "Monto Pagado:",
            "Payment Method:": "Método de Pago:",
            "Account Status:": "Estado de la Cuenta:",
            "Current": "Al Corriente",
            "What We Provide for Your Business": "Lo que Ofrecemos para su Negocio",
            "Thermal Paper": "Papel Térmico",
            "Bond Paper": "Papel Bond",
            "Printer Ribbons": "Cintas para Impresora",
            "Questions? We're Here to Help!": "¿Preguntas? ¡Estamos Aquí para Ayudar!",
            "Our team is always ready to assist you with any questions \n                    about your account or our products.":
                "Nuestro equipo siempre está listo para ayudarle con cualquier pregunta sobre su cuenta o nuestros productos.",
            "Call Us Today": "Llámenos Hoy",
            "Empowering American Businesses": "Impulsando Empresas Estadounidenses",
            "Your Success is Our Priority": "Su Éxito es Nuestra Prioridad",
            "en-US": "es-US",
        },
    },
    "urdu": {
        "lang": "ur", "dir": "rtl", "locale": "ur-PK",
        "title": "آپ کی ادائیگی کا شکریہ | Performance Supply Depot",
        "map": {
            "Payment Received": "ادائیگی موصول ہوئی",
            "Thank You!": "شکریہ!",
            "Your payment has been successfully processed": "آپ کی ادائیگی کامیابی سے مکمل ہو گئی ہے",
            "Payment Confirmed": "ادائیگی کی تصدیق",
            "We Truly Appreciate Your Business!": "ہم آپ کے کاروبار کی دل سے قدر کرتے ہیں!",
            "Dear Valued Customer,": "محترم قابلِ قدر صارف،",
            "Dear <strong>": "محترم <strong>",
            "On behalf of <strong>Performance Supply Depot</strong>, \n                    we want to express our sincere gratitude for your recent payment. \n                    Your trust and partnership mean the world to us.":
                "<strong>Performance Supply Depot</strong> کی جانب سے، ہم آپ کی حالیہ ادائیگی پر اپنی مخلصانہ تشکر کا اظہار کرنا چاہتے ہیں۔ آپ کا اعتماد اور شراکت ہمارے لیے بہت اہم ہے۔",
            "Together, we're building something great.": "مل کر، ہم کچھ عظیم بنا رہے ہیں۔",
            "Transaction Summary": "لین دین کا خلاصہ",
            "Payment Date:": "ادائیگی کی تاریخ:",
            "Reference Number:": "حوالہ نمبر:",
            "Amount Paid:": "ادا کی گئی رقم:",
            "Payment Method:": "ادائیگی کا طریقہ:",
            "Account Status:": "اکاؤنٹ کی حالت:",
            "Current": "موجودہ",
            "What We Provide for Your Business": "ہم آپ کے کاروبار کے لیے کیا فراہم کرتے ہیں",
            "Thermal Paper": "تھرمل کاغذ",
            "Bond Paper": "بانڈ کاغذ",
            "Printer Ribbons": "پرنٹر ربن",
            "Questions? We're Here to Help!": "سوالات؟ ہم مدد کے لیے حاضر ہیں!",
            "Our team is always ready to assist you with any questions \n                    about your account or our products.":
                "ہماری ٹیم آپ کے اکاؤنٹ یا مصنوعات کے بارے میں کسی بھی سوال میں آپ کی مدد کے لیے ہمیشہ تیار ہے۔",
            "Call Us Today": "آج ہی کال کریں",
            "Empowering American Businesses": "امریکی کاروباروں کو بااختیار بنانا",
            "Your Success is Our Priority": "آپ کی کامیابی ہماری ترجیح ہے",
            "en-US": "ur-PK",
        },
    },
    "tagalog": {
        "lang": "tl", "dir": "ltr", "locale": "tl-PH",
        "title": "Salamat sa Iyong Pagbabayad | Performance Supply Depot",
        "map": {
            "Payment Received": "Natanggap ang Bayad",
            "Thank You!": "Salamat!",
            "Your payment has been successfully processed": "Matagumpay na naproseso ang iyong pagbabayad",
            "Payment Confirmed": "Kumpirmado ang Bayad",
            "We Truly Appreciate Your Business!": "Lubos Naming Pinahahalagahan ang Iyong Negosyo!",
            "Dear Valued Customer,": "Mahal na Pinahahalagahang Customer,",
            "Dear <strong>": "Mahal na <strong>",
            "On behalf of <strong>Performance Supply Depot</strong>, \n                    we want to express our sincere gratitude for your recent payment. \n                    Your trust and partnership mean the world to us.":
                "Sa pangalan ng <strong>Performance Supply Depot</strong>, nais naming ipahayag ang aming taos-pusong pasasalamat sa iyong kamakailang pagbabayad. Ang iyong tiwala at pakikipagtulungan ay napakahalaga sa amin.",
            "Together, we're building something great.": "Sama-sama, bumubuo tayo ng isang bagay na dakila.",
            "Transaction Summary": "Buod ng Transaksyon",
            "Payment Date:": "Petsa ng Pagbabayad:",
            "Reference Number:": "Numero ng Sanggunian:",
            "Amount Paid:": "Halagang Binayaran:",
            "Payment Method:": "Paraan ng Pagbabayad:",
            "Account Status:": "Katayuan ng Account:",
            "Current": "Kasalukuyan",
            "What We Provide for Your Business": "Ang Aming Iniaalok para sa Iyong Negosyo",
            "Thermal Paper": "Thermal Paper",
            "Bond Paper": "Bond Paper",
            "Printer Ribbons": "Printer Ribbons",
            "Questions? We're Here to Help!": "May Tanong? Nandito Kami para Tumulong!",
            "Our team is always ready to assist you with any questions \n                    about your account or our products.":
                "Laging handa ang aming koponan na tulungan ka sa anumang tanong tungkol sa iyong account o sa aming mga produkto.",
            "Call Us Today": "Tawagan Kami Ngayon",
            "Empowering American Businesses": "Pinapalakas ang mga Negosyong Amerikano",
            "Your Success is Our Priority": "Ang Iyong Tagumpay ay Aming Priyoridad",
            "en-US": "tl-PH",
        },
    },
    "hindi": {
        "lang": "hi", "dir": "ltr", "locale": "hi-IN",
        "title": "आपके भुगतान के लिए धन्यवाद | Performance Supply Depot",
        "map": {
            "Payment Received": "भुगतान प्राप्त हुआ",
            "Thank You!": "धन्यवाद!",
            "Your payment has been successfully processed": "आपका भुगतान सफलतापूर्वक संसाधित हो गया है",
            "Payment Confirmed": "भुगतान की पुष्टि",
            "We Truly Appreciate Your Business!": "हम आपके व्यवसाय की सच्चे दिल से सराहना करते हैं!",
            "Dear Valued Customer,": "प्रिय मूल्यवान ग्राहक,",
            "Dear <strong>": "प्रिय <strong>",
            "On behalf of <strong>Performance Supply Depot</strong>, \n                    we want to express our sincere gratitude for your recent payment. \n                    Your trust and partnership mean the world to us.":
                "<strong>Performance Supply Depot</strong> की ओर से, हम आपके हालिया भुगतान के लिए अपनी हार्दिक कृतज्ञता व्यक्त करना चाहते हैं। आपका भरोसा और साझेदारी हमारे लिए बहुत मायने रखती है।",
            "Together, we're building something great.": "साथ मिलकर, हम कुछ महान बना रहे हैं।",
            "Transaction Summary": "लेन-देन सारांश",
            "Payment Date:": "भुगतान तिथि:",
            "Reference Number:": "संदर्भ संख्या:",
            "Amount Paid:": "भुगतान की गई राशि:",
            "Payment Method:": "भुगतान विधि:",
            "Account Status:": "खाता स्थिति:",
            "Current": "वर्तमान",
            "What We Provide for Your Business": "हम आपके व्यवसाय के लिए क्या प्रदान करते हैं",
            "Thermal Paper": "थर्मल पेपर",
            "Bond Paper": "बॉन्ड पेपर",
            "Printer Ribbons": "प्रिंटर रिबन",
            "Questions? We're Here to Help!": "प्रश्न? हम मदद के लिए यहाँ हैं!",
            "Our team is always ready to assist you with any questions \n                    about your account or our products.":
                "हमारी टीम आपके खाते या हमारे उत्पादों के बारे में किसी भी प्रश्न में आपकी सहायता के लिए हमेशा तैयार है।",
            "Call Us Today": "आज ही कॉल करें",
            "Empowering American Businesses": "अमेरिकी व्यवसायों को सशक्त बनाना",
            "Your Success is Our Priority": "आपकी सफलता हमारी प्राथमिकता है",
            "en-US": "hi-IN",
        },
    },
    "russian": {
        "lang": "ru", "dir": "ltr", "locale": "ru-RU",
        "title": "Спасибо за ваш платеж | Performance Supply Depot",
        "map": {
            "Payment Received": "Платеж получен",
            "Thank You!": "Спасибо!",
            "Your payment has been successfully processed": "Ваш платеж успешно обработан",
            "Payment Confirmed": "Платеж подтвержден",
            "We Truly Appreciate Your Business!": "Мы искренне ценим ваш бизнес!",
            "Dear Valued Customer,": "Уважаемый клиент,",
            "Dear <strong>": "Уважаемый <strong>",
            "On behalf of <strong>Performance Supply Depot</strong>, \n                    we want to express our sincere gratitude for your recent payment. \n                    Your trust and partnership mean the world to us.":
                "От имени <strong>Performance Supply Depot</strong> мы хотим выразить искреннюю благодарность за ваш недавний платеж. Ваше доверие и партнерство значат для нас очень много.",
            "Together, we're building something great.": "Вместе мы создаем нечто великое.",
            "Transaction Summary": "Сводка транзакции",
            "Payment Date:": "Дата платежа:",
            "Reference Number:": "Номер ссылки:",
            "Amount Paid:": "Уплаченная сумма:",
            "Payment Method:": "Способ оплаты:",
            "Account Status:": "Статус счета:",
            "Current": "Текущий",
            "What We Provide for Your Business": "Что мы предлагаем для вашего бизнеса",
            "Thermal Paper": "Термобумага",
            "Bond Paper": "Бумага Bond",
            "Printer Ribbons": "Ленты для принтера",
            "Questions? We're Here to Help!": "Вопросы? Мы готовы помочь!",
            "Our team is always ready to assist you with any questions \n                    about your account or our products.":
                "Наша команда всегда готова помочь вам с любыми вопросами о вашем счете или наших продуктах.",
            "Call Us Today": "Позвоните нам сегодня",
            "Empowering American Businesses": "Расширяем возможности американского бизнеса",
            "Your Success is Our Priority": "Ваш успех — наш приоритет",
            "en-US": "ru-RU",
        },
    },
    "vietnamese": {
        "lang": "vi", "dir": "ltr", "locale": "vi-VN",
        "title": "Cảm ơn khoản thanh toán của bạn | Performance Supply Depot",
        "map": {
            "Payment Received": "Đã nhận thanh toán",
            "Thank You!": "Cảm ơn!",
            "Your payment has been successfully processed": "Khoản thanh toán của bạn đã được xử lý thành công",
            "Payment Confirmed": "Thanh toán đã xác nhận",
            "We Truly Appreciate Your Business!": "Chúng tôi thực sự trân trọng công việc của bạn!",
            "Dear Valued Customer,": "Kính gửi Quý Khách Hàng,",
            "Dear <strong>": "Kính gửi <strong>",
            "On behalf of <strong>Performance Supply Depot</strong>, \n                    we want to express our sincere gratitude for your recent payment. \n                    Your trust and partnership mean the world to us.":
                "Thay mặt <strong>Performance Supply Depot</strong>, chúng tôi xin bày tỏ lòng biết ơn chân thành về khoản thanh toán gần đây của bạn. Sự tin tưởng và hợp tác của bạn có ý nghĩa rất lớn đối với chúng tôi.",
            "Together, we're building something great.": "Cùng nhau, chúng ta đang xây dựng điều gì đó tuyệt vời.",
            "Transaction Summary": "Tóm tắt giao dịch",
            "Payment Date:": "Ngày thanh toán:",
            "Reference Number:": "Số tham chiếu:",
            "Amount Paid:": "Số tiền đã thanh toán:",
            "Payment Method:": "Phương thức thanh toán:",
            "Account Status:": "Trạng thái tài khoản:",
            "Current": "Hiện tại",
            "What We Provide for Your Business": "Những gì chúng tôi cung cấp cho doanh nghiệp của bạn",
            "Thermal Paper": "Giấy nhiệt",
            "Bond Paper": "Giấy Bond",
            "Printer Ribbons": "Ruy băng máy in",
            "Questions? We're Here to Help!": "Có câu hỏi? Chúng tôi sẵn sàng hỗ trợ!",
            "Our team is always ready to assist you with any questions \n                    about your account or our products.":
                "Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn với mọi câu hỏi về tài khoản hoặc sản phẩm của chúng tôi.",
            "Call Us Today": "Gọi cho chúng tôi ngay hôm nay",
            "Empowering American Businesses": "Trao quyền cho các doanh nghiệp Hoa Kỳ",
            "Your Success is Our Priority": "Thành công của bạn là ưu tiên của chúng tôi",
            "en-US": "vi-VN",
        },
    },
    "chinese": {
        "lang": "zh", "dir": "ltr", "locale": "zh-CN",
        "title": "感谢您的付款 | Performance Supply Depot",
        "map": {
            "Payment Received": "已收到付款",
            "Thank You!": "谢谢！",
            "Your payment has been successfully processed": "您的付款已成功处理",
            "Payment Confirmed": "付款已确认",
            "We Truly Appreciate Your Business!": "我们衷心感谢您的惠顾！",
            "Dear Valued Customer,": "尊敬的客户，",
            "Dear <strong>": "尊敬的<strong>",
            "On behalf of <strong>Performance Supply Depot</strong>, \n                    we want to express our sincere gratitude for your recent payment. \n                    Your trust and partnership mean the world to us.":
                "谨代表 <strong>Performance Supply Depot</strong>，我们对您近期的付款表示诚挚的感谢。您的信任与合作对我们意义重大。",
            "Together, we're building something great.": "让我们携手共创美好未来。",
            "Transaction Summary": "交易摘要",
            "Payment Date:": "付款日期：",
            "Reference Number:": "参考编号：",
            "Amount Paid:": "已付金额：",
            "Payment Method:": "付款方式：",
            "Account Status:": "账户状态：",
            "Current": "正常",
            "What We Provide for Your Business": "我们为您的企业提供什么",
            "Thermal Paper": "热敏纸",
            "Bond Paper": "票据纸",
            "Printer Ribbons": "打印机色带",
            "Questions? We're Here to Help!": "有问题？我们随时为您服务！",
            "Our team is always ready to assist you with any questions \n                    about your account or our products.":
                "我们的团队随时准备协助您解决有关账户或产品的任何问题。",
            "Call Us Today": "立即致电我们",
            "Empowering American Businesses": "赋能美国企业",
            "Your Success is Our Priority": "您的成功是我们的首要任务",
            "en-US": "zh-CN",
        },
    },
}

def apply_translations(html, tmap):
    out = html
    for src, dst in tmap.items():
        out = out.replace(src, dst)
    return out

for slug, cfg in LANGS.items():
    out = apply_translations(template, cfg["map"])
    # lang + dir on <html>
    out = out.replace('<html lang="en">', f'<html lang="{cfg["lang"]}" dir="{cfg["dir"]}">')
    # title
    out = out.replace(
        "<title>Thank You for Your Payment | Performance Supply Depot</title>",
        f"<title>{cfg['title']}</title>"
    )
    # locale in JS (toLocaleDateString / toLocaleString)
    out = out.replace("toLocaleDateString('en-US'", f"toLocaleDateString('{cfg['locale']}'")
    out = out.replace("toLocaleString('en-US'", f"toLocaleString('{cfg['locale']}'")
    # RTL font tweak for Urdu
    if cfg["dir"] == "rtl":
        out = out.replace(
            "font-family: 'Georgia', 'Times New Roman', serif;",
            "font-family: 'Noto Nastaliq Urdu', 'Georgia', serif;"
        )
    dest = os.path.join(OUTDIR, f"thank-you-payment-{slug}.html")
    with open(dest, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"WROTE {dest}")

print("DONE")
