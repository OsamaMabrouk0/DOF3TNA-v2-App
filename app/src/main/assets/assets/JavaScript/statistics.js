// دالة لتخزين البيانات في localStorage مع وقت انتهاء
function setCachedData(key, value, ttl = 600) {
    const expiration = Date.now() + ttl * 1000; // الوقت بالمللي ثانية
    localStorage.setItem(key, JSON.stringify({ value, expiration }));
}

// دالة لجلب البيانات من localStorage إذا كانت صالحة
function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (cached) {
        const { value, expiration } = JSON.parse(cached);
        if (Date.now() < expiration) return value;
    }
    return null;
}

// جلب البيانات من Google Drive API
async function fetchFromGoogleDrive(endpoint) {
    const cachedData = getCachedData(endpoint);
    if (cachedData) return cachedData;

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch data from API");

    const data = await response.json();
    setCachedData(endpoint, data);
    return data;
}

// جلب المواد (المجلدات) من Google Drive
async function fetchFolders() {
    const url = `https://www.googleapis.com/drive/v3/files?q='${mainFolderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name)`;
    const data = await fetchFromGoogleDrive(url);
    return data.files || [];
}

// جلب الملفات من Google Drive
async function fetchFiles(parentId) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType!='application/vnd.google-apps.folder'&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name)`;
    const data = await fetchFromGoogleDrive(url);
    return data.files || [];
}

// تحديث الإحصائيات
async function updateStatistics() {
    const folderOpenCounts = JSON.parse(localStorage.getItem("folderOpenCounts")) || {};
    const accessTimestamps = JSON.parse(localStorage.getItem("folderAccessTimestamps")) || {};
    let totalViews = Object.values(folderOpenCounts).reduce((sum, count) => sum + count, 0); // حساب إجمالي المشاهدات

    try {
        const folders = await fetchFolders();
        const folderNames = {};
        let totalFiles = 0;
        const subjectDetails = [];

        for (const folder of folders) {
            folderNames[folder.id] = folder.name;
            const files = await fetchFiles(folder.id);
            totalFiles += files.length;

            // إعداد تفاصيل المادة
            subjectDetails.push({
                name: folder.name,
                views: folderOpenCounts[folder.id] || 0,
                filesCount: files.length,
            });
        }

        // حفظ البيانات في localStorage
        localStorage.setItem("folders", JSON.stringify(folders));
        localStorage.setItem("folderNames", JSON.stringify(folderNames));
        localStorage.setItem("subjectDetails", JSON.stringify(subjectDetails));
        localStorage.setItem("totalFiles", totalFiles);

        // تحديث الإحصائيات في الصفحة
        document.getElementById("total-subjects").textContent = folders.length;
        document.getElementById("total-files").textContent = totalFiles;

        const mostViewedFolderId = Object.keys(folderOpenCounts).reduce((a, b) =>
            folderOpenCounts[a] > folderOpenCounts[b] ? a : b, null);
        document.getElementById("most-viewed").textContent = folderNames[mostViewedFolderId] || "-";
        document.getElementById("total-views").textContent = totalViews; // تحديث عدد المشاهدات الإجمالي

        const subjectsDetailsElement = document.getElementById("subjects-details");
        subjectsDetailsElement.innerHTML = subjectDetails.map(detail => `
            <tr>
                <td>${detail.name}</td>
                <td>${detail.views}</td>
                <td>${detail.filesCount}</td>
            </tr>
        `).join("");

        // رسم الرسم البياني الخاص بعدد الملفات في كل مادة
        const filesChartCtx = document.getElementById("filesChart").getContext("2d");
        new Chart(filesChartCtx, {
            type: "bar",
            data: {
                labels: subjectDetails.map(detail => detail.name),
                datasets: [{
                    label: "عدد الملفات",
                    data: subjectDetails.map(detail => detail.filesCount),
                    backgroundColor: "rgba(153, 102, 255, 0.2)",
                    borderColor: "rgba(153, 102, 255, 1)",
                    borderWidth: 1
                }]
            }
        });

        // رسم الرسم البياني الخاص بعدد المشاهدات في كل مادة
        const viewsChartCtx = document.getElementById("viewsChart").getContext("2d");
        new Chart(viewsChartCtx, {
            type: "bar",
            data: {
                labels: subjectDetails.map(detail => detail.name),
                datasets: [{
                    label: "عدد المشاهدات",
                    data: subjectDetails.map(detail => detail.views),
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            }
        });

    } catch (error) {
        console.error("Error loading statistics:", error);
        loadFromLocalStorage();
    }
}

// تحديث البيانات عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", async () => {
    if (navigator.onLine) {
        await updateStatistics();
    } else {
        loadFromLocalStorage();
    }
});

// إضافة العنصر لعرض عدد المشاهدات الإجمالي في HTML
// HTML: تأكد من وجود هذا العنصر في الصفحة:


// دالة لتحميل البيانات من localStorage في حالة عدم وجود اتصال
function loadFromLocalStorage() {
    const folders = JSON.parse(localStorage.getItem("folders")) || [];
    const folderNames = JSON.parse(localStorage.getItem("folderNames")) || {};
    const subjectDetails = JSON.parse(localStorage.getItem("subjectDetails")) || [];
    const totalFiles = parseInt(localStorage.getItem("totalFiles")) || 0;
    const downloadsCount = parseInt(localStorage.getItem("downloadsCount")) || 0;

    document.getElementById("total-subjects").textContent = folders.length;
    document.getElementById("total-files").textContent = totalFiles;
    document.getElementById("downloads-count").textContent = downloadsCount;

    const subjectsDetailsElement = document.getElementById("subjects-details");

    function applyNightDayMode() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        subjectsDetailsElement.innerHTML = subjectDetails.map(detail => `
        <tr class="${isDarkMode ? 'dark-mode-row' : ''}">
            <td>${detail.name}</td>
            <td>${detail.views}</td>
            <td>${detail.filesCount}</td>
        </tr>
    `).join("");
    }

    // تطبيق الوضع عند تحميل الصفحة أو عند التبديل بين الأوضاع
    applyNightDayMode();


    // رسم الرسم البياني الخاص بعدد الملفات في كل مادة
    const filesChartCtx = document.getElementById("filesChart").getContext("2d");
    new Chart(filesChartCtx, {
        type: "bar",
        data: {
            labels: subjectDetails.map(detail => detail.name),
            datasets: [{
                label: "عدد الملفات",
                data: subjectDetails.map(detail => detail.filesCount),
                backgroundColor: "rgba(153, 102, 255, 0.2)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1
            }]
        }
    });

    // رسم الرسم البياني الخاص بعدد المشاهدات في كل مادة
    const viewsChartCtx = document.getElementById("viewsChart").getContext("2d");
    new Chart(viewsChartCtx, {
        type: "bar",
        data: {
            labels: subjectDetails.map(detail => detail.name),
            datasets: [{
                label: "عدد المشاهدات",
                data: subjectDetails.map(detail => detail.views),
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        }
    });
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", async () => {
    // أول تحديث للإحصائيات عند تحميل الصفحة
    if (navigator.onLine) {
        await updateStatistics();
    } else {
        loadFromLocalStorage();
    }

    // تحديث الإحصائيات كل ثانية إذا كان الاتصال متاحًا
    setInterval(async () => {
        if (navigator.onLine) {
            await updateStatistics();
        }
    }, 1000);
});

// تحديث البيانات عند التركيز على الصفحة
window.addEventListener("focus", async () => {
    const currentPath = window.location.pathname;

    if (currentPath === "/") {
        if (navigator.onLine) {
            await updateStatistics();
        } else {
            loadFromLocalStorage();
        }
    }
});

document.getElementById("exportExcelBtn").addEventListener("click", () => {
    Swal.fire({
        title: 'تصدير إلى Excel',
        html: `
            <div style="background: linear-gradient(135deg, #c8e6c9, #a5d6a7); padding: 20px; border-radius: 10px;">
                <img src="./assets/Images/microsoft-excel-2019.png" alt="Excel Icon" style="width: 80px; margin-bottom: 15px;">
                <p style="font-size: 1.3rem; color: #2e7d32;">هل تريد بالتأكيد تصدير البيانات إلى <b>Excel</b>؟</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check-circle"></i> نعم، تصدير',
        cancelButtonText: '<i class="fas fa-times-circle"></i> إلغاء',
        customClass: {
            confirmButton: 'btn btn-primary btn-lg mx-2',
            cancelButton: 'btn btn-secondary btn-lg mx-2',
        },
        buttonsStyling: false,
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                // استدعاء دالة التصدير
                const table = document.getElementById("subjects-details");
                const rows = Array.from(table.rows);
                const data = rows.map(row => Array.from(row.cells).map(cell => cell.textContent));

                // إضافة رؤوس الأعمدة إلى البيانات
                data.unshift(["اسم المادة", "عدد المشاهدات", "عدد الملفات"]);

                // إنشاء ملف Excel
                const ws = XLSX.utils.aoa_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Subjects");

                // تحويل الملف إلى صيغة Base64
                const excelBinary = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
                const base64Data = btoa(excelBinary);

                // تمرير اسم الملف والمحتوى إلى Android
                if (window.AndroidInterface) {
                    window.AndroidInterface.saveFile("subjects_data.xlsx", base64Data);
                } else {
                    console.error("AndroidInterface غير مدعوم.");
                }
            } catch (error) {
                Swal.fire({
                    html: `
                        <div style="background: linear-gradient(135deg, #ffcdd2, #ef9a9a); padding: 20px; border-radius: 10px;">
                            <p style="font-size: 1.3rem; color: #d32f2f;">حدثت مشكلة أثناء تصدير <b>Excel</b>.</p>
                        </div>
                    `,
                    confirmButtonText: 'حسنًا',
                    customClass: {
                        confirmButton: 'btn btn-danger btn-lg',
                    },
                    buttonsStyling: false,
                });
            }
        }
    });
});

// تعريف الرسوم البيانية كمتغيرات عامة
let filesChart = null;
let viewsChart = null;

// تحديث الإحصائيات
async function updateStatistics() {
    const folderOpenCounts = JSON.parse(localStorage.getItem("folderOpenCounts")) || {};
    let totalViews = Object.values(folderOpenCounts).reduce((sum, count) => sum + count, 0); // حساب إجمالي المشاهدات

    try {
        const folders = await fetchFolders();
        const folderNames = {};
        let totalFiles = 0;
        const subjectDetails = [];

        for (const folder of folders) {
            folderNames[folder.id] = folder.name;
            const files = await fetchFiles(folder.id);
            totalFiles += files.length;

            // إعداد تفاصيل المادة
            subjectDetails.push({
                name: folder.name,
                views: folderOpenCounts[folder.id] || 0,
                filesCount: files.length,
            });
        }

        // حفظ البيانات في localStorage
        localStorage.setItem("folders", JSON.stringify(folders));
        localStorage.setItem("folderNames", JSON.stringify(folderNames));
        localStorage.setItem("subjectDetails", JSON.stringify(subjectDetails));
        localStorage.setItem("totalFiles", totalFiles);

        // تحديث الكروت
        document.getElementById("total-subjects").textContent = folders.length;
        document.getElementById("total-files").textContent = totalFiles;
        document.getElementById("total-views").textContent = totalViews;

        const mostViewedFolderId = Object.keys(folderOpenCounts).reduce((a, b) =>
            folderOpenCounts[a] > folderOpenCounts[b] ? a : b, null);
        document.getElementById("most-viewed").textContent = folderNames[mostViewedFolderId] || "لايوجد";

        // تحديث الجدول
        const subjectsDetailsElement = document.getElementById("subjects-details");
        subjectsDetailsElement.innerHTML = subjectDetails.map(detail => `
            <tr>
                <td>${detail.name}</td>
                <td>${detail.views}</td>
                <td>${detail.filesCount}</td>
            </tr>
        `).join("");

        // تحديث الرسوم البيانية
        if (filesChart) {
            filesChart.data.labels = subjectDetails.map(detail => detail.name);
            filesChart.data.datasets[0].data = subjectDetails.map(detail => detail.filesCount);
            filesChart.update(); // تحديث الرسم البياني
        }

        if (viewsChart) {
            viewsChart.data.labels = subjectDetails.map(detail => detail.name);
            viewsChart.data.datasets[0].data = subjectDetails.map(detail => detail.views);
            viewsChart.update(); // تحديث الرسم البياني
        }

    } catch (error) {
        console.error("Error loading statistics:", error);
        loadFromLocalStorage();
    }
}

// دالة لتحميل البيانات عند عدم وجود اتصال
function loadFromLocalStorage() {
    const folders = JSON.parse(localStorage.getItem("folders")) || [];
    const subjectDetails = JSON.parse(localStorage.getItem("subjectDetails")) || [];
    const totalFiles = parseInt(localStorage.getItem("totalFiles")) || 0;
    const totalViews = Object.values(JSON.parse(localStorage.getItem("folderOpenCounts")) || {}).reduce((sum, count) => sum + count, 0);

    // تحديث الكروت
    document.getElementById("total-subjects").textContent = folders.length;
    document.getElementById("total-files").textContent = totalFiles;
    document.getElementById("total-views").textContent = totalViews;

    const subjectsDetailsElement = document.getElementById("subjects-details");
    subjectsDetailsElement.innerHTML = subjectDetails.map(detail => `
        <tr>
            <td>${detail.name}</td>
            <td>${detail.views}</td>
            <td>${detail.filesCount}</td>
        </tr>
    `).join("");

    // تحديث الرسوم البيانية
    if (filesChart) {
        filesChart.data.labels = subjectDetails.map(detail => detail.name);
        filesChart.data.datasets[0].data = subjectDetails.map(detail => detail.filesCount);
        filesChart.update();
    }

    if (viewsChart) {
        viewsChart.data.labels = subjectDetails.map(detail => detail.name);
        viewsChart.data.datasets[0].data = subjectDetails.map(detail => detail.views);
        viewsChart.update();
    }
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", async () => {
    // إعداد الرسوم البيانية عند التحميل لأول مرة
    const filesChartCtx = document.getElementById("filesChart").getContext("2d");
    filesChart = new Chart(filesChartCtx, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "عدد الملفات",
                data: [],
                backgroundColor: "rgba(153, 102, 255, 0.2)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1
            }]
        }
    });

    const viewsChartCtx = document.getElementById("viewsChart").getContext("2d");
    viewsChart = new Chart(viewsChartCtx, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "عدد المشاهدات",
                data: [],
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        }
    });

    if (navigator.onLine) {
        await updateStatistics();
    } else {
        loadFromLocalStorage();
    }

    // تحديث الإحصائيات كل ثانية إذا كان الاتصال متاحًا
    setInterval(async () => {
        if (navigator.onLine) {
            await updateStatistics();
        }
    }, 1000);
});


// تحديث الإحصائيات
async function updateStatistics() {
    const folderOpenCounts = JSON.parse(localStorage.getItem("folderOpenCounts")) || {};
    let totalViews = Object.values(folderOpenCounts).reduce((sum, count) => sum + count, 0); // حساب إجمالي المشاهدات

    try {
        const folders = await fetchFolders();
        const folderNames = {};
        let totalFiles = 0;
        const subjectDetails = [];

        for (const folder of folders) {
            folderNames[folder.id] = folder.name;
            const files = await fetchFiles(folder.id);
            totalFiles += files.length;

            // إعداد تفاصيل المادة
            subjectDetails.push({
                name: folder.name,
                views: folderOpenCounts[folder.id] || 0,
                filesCount: files.length,
            });
        }

        // حساب المجلد الأكثر مشاهدة
        const mostViewedFolderId = Object.keys(folderOpenCounts).reduce((a, b) =>
            folderOpenCounts[a] > folderOpenCounts[b] ? a : b, null);
        const mostViewedFolderName = folderNames[mostViewedFolderId] || "لايوجد";

        // حفظ البيانات في localStorage
        localStorage.setItem("folders", JSON.stringify(folders));
        localStorage.setItem("folderNames", JSON.stringify(folderNames));
        localStorage.setItem("subjectDetails", JSON.stringify(subjectDetails));
        localStorage.setItem("totalFiles", totalFiles);
        localStorage.setItem("totalViews", totalViews);
        localStorage.setItem("mostViewedFolder", mostViewedFolderName);

        // تحديث الكروت
        document.getElementById("total-subjects").textContent = folders.length;
        document.getElementById("total-files").textContent = totalFiles;
        document.getElementById("total-views").textContent = totalViews;
        document.getElementById("most-viewed").textContent = mostViewedFolderName;

        // تحديث الجدول
        const subjectsDetailsElement = document.getElementById("subjects-details");
        subjectsDetailsElement.innerHTML = subjectDetails.map(detail => `
            <tr>
                <td>${detail.name}</td>
                <td>${detail.views}</td>
                <td>${detail.filesCount}</td>
            </tr>
        `).join("");

        // تحديث الرسوم البيانية
        if (filesChart) {
            filesChart.data.labels = subjectDetails.map(detail => detail.name);
            filesChart.data.datasets[0].data = subjectDetails.map(detail => detail.filesCount);
            filesChart.update();
        }

        if (viewsChart) {
            viewsChart.data.labels = subjectDetails.map(detail => detail.name);
            viewsChart.data.datasets[0].data = subjectDetails.map(detail => detail.views);
            viewsChart.update();
        }

    } catch (error) {
        console.error("Error loading statistics:", error);
        loadFromLocalStorage();
    }
}

// دالة لتحميل البيانات عند عدم وجود اتصال
function loadFromLocalStorage() {
    const folders = JSON.parse(localStorage.getItem("folders")) || [];
    const subjectDetails = JSON.parse(localStorage.getItem("subjectDetails")) || [];
    const totalFiles = parseInt(localStorage.getItem("totalFiles")) || 0;
    const totalViews = parseInt(localStorage.getItem("totalViews")) || 0;
    const mostViewedFolder = localStorage.getItem("mostViewedFolder") || "لايوجد";

    // تحديث الكروت
    document.getElementById("total-subjects").textContent = folders.length;
    document.getElementById("total-files").textContent = totalFiles;
    document.getElementById("total-views").textContent = totalViews;
    document.getElementById("most-viewed").textContent = mostViewedFolder;

    const subjectsDetailsElement = document.getElementById("subjects-details");
    subjectsDetailsElement.innerHTML = subjectDetails.map(detail => `
        <tr>
            <td>${detail.name}</td>
            <td>${detail.views}</td>
            <td>${detail.filesCount}</td>
        </tr>
    `).join("");

    // تحديث الرسوم البيانية
    if (filesChart) {
        filesChart.data.labels = subjectDetails.map(detail => detail.name);
        filesChart.data.datasets[0].data = subjectDetails.map(detail => detail.filesCount);
        filesChart.update();
    }

    if (viewsChart) {
        viewsChart.data.labels = subjectDetails.map(detail => detail.name);
        viewsChart.data.datasets[0].data = subjectDetails.map(detail => detail.views);
        viewsChart.update();
    }
}

//------------------------------------------------------------------------------


async function fetchStatisticsFromAPI() {
    async function updateStatistics() {
        const dataKey = "statisticsData";
        let data;

        if (navigator.onLine) {
            try {
                data = await fetchStatisticsFromAPI(); // تأكد أن اسم الدالة صحيح
                setCachedData(dataKey, data);
            } catch (error) {
                console.error("Error fetching data from API:", error);
            }
        } else {
            data = getCachedData(dataKey);
            if (!data) {
                console.warn("No cached data available.");
                return;
            }
        }

        // تحديث العرض بناءً على البيانات
        renderStatistics(data);
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch data from API. Status: ${response.status}`);
    }
    return await response.json();
}

// دالة لتخزين البيانات في localStorage مع وقت انتهاء، تعمل فقط على قسم الإحصائيات
function setCachedData(key, value, ttl = 600) {
    const statisticsSection = document.getElementById("statistics"); // التحقق من وجود قسم الإحصائيات
    if (!statisticsSection || statisticsSection.classList.contains("hidden")) return; // التأكد أن القسم موجود ومرئي

    const expiration = Date.now() + ttl * 1000; // حساب وقت الانتهاء بالمللي ثانية
    localStorage.setItem(key, JSON.stringify({ value, expiration }));
}
// دالة لجلب البيانات من localStorage إذا كانت صالحة، تعمل فقط على قسم الإحصائيات
function getCachedData(key) {
    const statisticsSection = document.getElementById("statistics"); // التحقق من وجود قسم الإحصائيات
    if (!statisticsSection || statisticsSection.classList.contains("hidden")) return null; // التأكد أن القسم موجود ومرئي

    const cached = localStorage.getItem(key);
    if (cached) {
        const { value, expiration } = JSON.parse(cached);
        if (Date.now() < expiration) return value; // إذا كانت البيانات صالحة يتم إرجاعها
    }
    return null; // إذا لم تكن صالحة أو غير موجودة يتم إرجاع null
}
