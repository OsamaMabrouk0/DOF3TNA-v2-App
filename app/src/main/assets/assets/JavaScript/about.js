const aboutMenuButton = document.getElementById('aboutMenuButton');
const aboutSideMenu = document.getElementById('aboutSideMenu');
const aboutCheckbox = document.getElementById('aboutCheckbox');
const mainPageSection = document.getElementById('main-page');

// إنشاء الـ Intersection Observer لمراقبة القسم الذي يحمل id="main-page"
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.target === mainPageSection) {
            // إذا كان القسم #main-page في العرض، إظهار الأيقونة
            if (entry.isIntersecting) {
                aboutMenuButton.style.display = 'block';
            } else {
                // إذا لم يكن #main-page في العرض، إخفاء الأيقونة وإغلاق القائمة
                aboutMenuButton.style.display = 'none';
                aboutSideMenu.classList.remove('open');
                aboutCheckbox.checked = false; // إلغاء تفعيل الـ checkbox عند إخفاء القائمة
            }
        }
    });
}, { threshold: 0.1 }); // إذا كان 10% من العنصر في العرض، سيبدأ الـ observer في العمل

// مراقبة قسم #main-page
observer.observe(mainPageSection);

// عند النقر على الأيقونة، افتح/أغلق القائمة
aboutMenuButton.addEventListener('click', () => {
    aboutCheckbox.checked = !aboutCheckbox.checked;
    aboutSideMenu.classList.toggle('open');
    aboutMenuButton.classList.add('ripple');
    setTimeout(() => {
        aboutMenuButton.classList.remove('ripple');
    }, 300);
});

// عند تغيير حالة الـ checkbox، افتح/أغلق القائمة
aboutCheckbox.addEventListener('change', () => {
    if (aboutCheckbox.checked) {
        aboutSideMenu.classList.add('open');
    } else {
        aboutSideMenu.classList.remove('open');
    }
});



// دالة لنسخ الرابط إلى الحافظة
function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        notyf.success("تم نسخ الرابط بنجاح!");
    }).catch(() => {
        notyf.error("حدث خطأ أثناء النسخ!");
    });
}

// دالة لمشاركة التطبيق
function shareApp() {
    const appLink = "https://DOF3TNA.great-site.net";

    if (navigator.share) {
        navigator.share({
            title: "تطبيق دفعتنا",
            text: "قم بتحميل تطبيق دفعتنا ومشاركته مع أصدقائك!",
            url: appLink
        })
        .then(() => notyf.success("تمت مشاركة التطبيق بنجاح!"))
        .catch(() => notyf.error("حدث خطأ أثناء المشاركة!"));
    } else {
        copyToClipboard(appLink);
        notyf.info("تم نسخ رابط التطبيق إلى الحافظة.");
    }
}
