function showUpdateNotification(updateUrl) {
  Swal.fire({
    title: "تحديث جديد 🎉",
    text: "يتوفر إصدار جديد للتطبيق. انقر على تحديث الآن للحصول عليه.",
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "تحديث الآن",
    cancelButtonText: "لاحقًا",
    customClass: {
      popup: "simple-swal-popup",
      confirmButton: "simple-swal-confirm-button",
      cancelButton: "simple-swal-cancel-button",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = updateUrl;
    }
  });
}

// استدعاء حالة التحديث من الخادم
function fetchUpdateStatus(apiUrl) {
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.updateAvailable) {
        showUpdateNotification(data.updateUrl);
      }
    })
    .catch((error) => {
      console.error("خطأ أثناء جلب حالة التحديث:", error);
    });
}

// تحديد الرابط مع منع التخزين المؤقت
const apiEndpoint =
  "https://osamamabrouk0.github.io/DOF3TNA-V2-UPDATES/update-DOF3TNA-V2.json?timestamp=" +
  new Date().getTime();

// استدعاء الدالة لجلب حالة التحديث
fetchUpdateStatus(apiEndpoint);
