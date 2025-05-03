function toggleDropdown() {
    const dropdown = document.querySelector(".dropdown");
    const overlay = document.getElementById("dropdown-overlay");

    dropdown.classList.toggle("open");
    overlay.style.visibility = dropdown.classList.contains("open") ? "visible" : "hidden";
    overlay.style.opacity = dropdown.classList.contains("open") ? "1" : "0";
}

function showImages(type) {
    const label = document.getElementById("dropdown-label");
    const defaultContent = document.getElementById("default-content");

    // تحديث النص
    if (type === "regular") {
        label.textContent = "جداول انتظام";
    } else if (type === "affiliate") {
        label.textContent = "جداول انتساب";
    } else if (type === "sections") {
        label.textContent = "جداول السكاشن";
    }

    // إخفاء المحتوى الافتراضي
    defaultContent.style.display = "none";

    // إظهار الصور المختارة
    document.getElementById("regular-images").style.display = "none";
    document.getElementById("affiliate-images").style.display = "none";
    document.getElementById("sections-images").style.display = "none";

    const selectedGallery = {
        regular: "regular-images",
        affiliate: "affiliate-images",
        sections: "sections-images",
    }[type];

    if (selectedGallery) {
        document.getElementById(selectedGallery).style.display = "flex";
    }

    document.getElementById("hide-all-option").style.display = "block";
    toggleDropdown();
}

function hideAllImages() {
    const defaultContent = document.getElementById("default-content");
    document.getElementById("dropdown-label").textContent = "اختر نوع الدراسة";

    // إظهار المحتوى الافتراضي
    defaultContent.style.display = "block";

    // إخفاء جميع الصور
    document.getElementById("regular-images").style.display = "none";
    document.getElementById("affiliate-images").style.display = "none";
    document.getElementById("sections-images").style.display = "none";

    document.getElementById("hide-all-option").style.display = "none";
    toggleDropdown();
}


