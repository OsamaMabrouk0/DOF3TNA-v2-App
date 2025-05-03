document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const sidebarItems = document.querySelectorAll("#sidebar li");
    const courseContent = document.getElementById("course-content");
    const menuToggle = document.getElementById("menu-toggle");

    if (!sidebarItems || !courseContent || !menuToggle || !sidebar) return;

    function hideOtherContent() {
        courseContent.innerHTML = "";
    }

    function updateActiveState(activeItem) {
        sidebarItems.forEach(item => item.classList.remove("active"));
        activeItem.classList.add("active");
    }

    function closeSidebar() {
        menuToggle.checked = false;
        sidebar.classList.remove("active");
    }

    sidebarItems.forEach(item => {
        item.addEventListener("click", function () {
            updateActiveState(item);
            const courseName = item.id === "new-added-option" ? "new" : item.textContent;
            updateCourseContent(courseName);
            closeSidebar();
        });
    });
});


/* *********************************| Overlay |********************************* */
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const menuToggle = document.getElementById("menu-toggle");

    if (!sidebar || !sidebarOverlay || !menuToggle) return;

    function toggleSidebar(isActive) {
        if (isActive) {
            sidebar.classList.add("active");
            sidebarOverlay.classList.add("active");
        } else {
            sidebar.classList.remove("active");
            sidebarOverlay.classList.remove("active");
        }
    }

    menuToggle.addEventListener("change", () => {
        toggleSidebar(menuToggle.checked);
    });

    sidebarOverlay.addEventListener("click", () => {
        toggleSidebar(false);
        menuToggle.checked = false;
    });
});


/* *********************************| دالة استدعاء المحاضرات  |********************************* */
// ذاكرة مؤقتة لتخزين المواد والملفات
let cachedSubjects = [];
let subjectFilesCache = {}; // تخزين الملفات لكل مادة

// دي مش ثغرة يعم الهاكر 😂
// انا اللي سايب المغاتيح بمزاجي 
// عشان لو في حد عاوز يستخدمه في مشروع مفيش فيه اي معلومات سرية يعني 🤍
const GOOGLE_DRIVE_API_KEY = "AIzaSyB7vGBBmmybGA_EvGsvdmhLz8qangORK0I";
const mainFolderId = "1HR4eNb0yAdus0aOtJYRs8LotClUoNFMG";

// دالة لجلب المجلدات (المواد) من Google Drive
async function fetchFolders(parentId) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name)&orderBy=name`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const data = await response.json();
        return data.files || [];
    } catch {
        // التعامل مع الأخطاء بصمت
        return [];
    }
}

// دالة لجلب الملفات من Google Drive
async function fetchFiles(parentId) {
    const url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType!='application/vnd.google-apps.folder'&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name)&orderBy=name`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const data = await response.json();
        return data.files || [];
    } catch {

        return [];
    }
}


async function preloadSubjectsAndFiles() {
    try {
        // جلب المواد (المجلدات)
        const subjects = await fetchFolders(mainFolderId);
        cachedSubjects = subjects;

        // جلب الملفات لكل مادة بشكل متزامن لتحسين الأداء
        const filePromises = subjects.map((subject) =>
            fetchFiles(subject.id).then((files) => {
                subjectFilesCache[subject.id] = files;
            })
        );

        await Promise.all(filePromises);
    } catch (error) {
        console.error("Error preloading subjects and files:", error);
    }
}

// دالة لتحميل المواد إلى القائمة الجانبية
function loadSubjectsToSidebar() {
    const sidebarList = document.querySelector("#sidebar ul");
    sidebarList.innerHTML = "";

    if (cachedSubjects.length === 0) {
        sidebarList.innerHTML = "<li>لا توجد مواد متاحة حاليًا. </br> سوف يتوفر قريباً.</li>";
    } else {
        cachedSubjects.forEach((subject) => {
            const li = document.createElement("li");
            li.textContent = subject.name;
            li.dataset.folderId = subject.id;


            li.addEventListener("click", () => {
                displayFolderContent(subject.id, subject.name);
                closeSidebar();
            });

            sidebarList.appendChild(li);
        });
    }
}


function showSidebarLoadingMessage() {
    const sidebarList = document.querySelector("#sidebar ul");
    sidebarList.innerHTML = `
        <div class="loading-sidebar">
            <div class="spinner"></div>
            <p>جارٍ تحميل المواد...</p>
        </div>
    `;
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menu-toggle");

    if (sidebar && menuToggle) {
        sidebar.classList.remove("active");
        menuToggle.checked = false;
    }
}

function updateFolderOpenCount(folderId) {
    const openCounts = JSON.parse(localStorage.getItem("folderOpenCounts")) || {};
    openCounts[folderId] = (openCounts[folderId] || 0) + 1;
    localStorage.setItem("folderOpenCounts", JSON.stringify(openCounts));
}


function displayFolderContent(folderId, folderName) {
    const courseContent = document.getElementById("course-content");
    const header = document.getElementById("subject-header");

    updateFolderOpenCount(folderId);

    header.textContent = `المادة: ${folderName}`;

    courseContent.innerHTML = `
        <div class="loading">جارٍ عرض الملفات...</div>
    `;

    const files = subjectFilesCache[folderId] || [];

    if (files.length === 0) {
        courseContent.innerHTML = "<p>لا توجد ملفات متاحة لهذه المادة الان. </br> سوف تتوفر قريباً.</p>";
    } else {
        const filesHtml = files
            .map(
                (file) =>
                    `<div class="lecture-item">
                        <i class="fas fa-file-pdf"></i>
                        <span>${file.name}</span>
                        <a href="https://drive.google.com/uc?export=download&id=${file.id}" class="download-btn" download>
                            <i class="fas fa-download"></i>
                        </a>
                    </div>`
            )
            .join("");

        courseContent.innerHTML = `<div class="lectures-content">${filesHtml}</div>`;
    }
}

function displayWelcomeMessage() {
    const header = document.getElementById("subject-header");
    header.textContent = "";
    const courseContent = document.getElementById("course-content");
    courseContent.innerHTML = `
        <div class="welcome-message">
            <p>افتح القائمة الجانبية لاختيار المادة.</p>
            <img src="./assets/Images/open-menu.svg" alt="" class="welcome-image">
        </div>
    `;
}


document.addEventListener("DOMContentLoaded", async () => {
    displayWelcomeMessage();

    showSidebarLoadingMessage();

    await preloadSubjectsAndFiles();

    loadSubjectsToSidebar();
});


/* *********************************| صفحة عدم توفر انترنت للمحاضرات  |********************************* */
document.addEventListener('DOMContentLoaded', function () {
    const lecturesPage = document.getElementById('lectures');
    const offlineContainer = document.getElementById('offline-container-lec');
    const subjectHeader = document.getElementById('subject-header');
    const courseContent = document.getElementById('course-content');

    function updateConnectionStatus() {
        if (navigator.onLine) {
            offlineContainer.style.display = 'none';
            subjectHeader.style.display = 'block';
            courseContent.style.display = 'block';
        } else {
            offlineContainer.style.display = 'flex';
            subjectHeader.style.display = 'none';
            courseContent.style.display = 'none';
        }
    }

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    updateConnectionStatus();
});


/* *********************************| صفحة عدم توفر انترنت للقائمة الجانبية  |********************************* */

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarList = sidebar.querySelector('ul');
    const offlineSidebar = document.getElementById('offline-sidebar');

    function updateSidebarConnectionStatus() {
        if (navigator.onLine) {
            sidebarList.style.display = 'block';
            offlineSidebar.style.display = 'none';
        } else {
            sidebarList.style.display = 'none';
            offlineSidebar.style.display = 'flex';
        }
    }

    window.addEventListener('online', updateSidebarConnectionStatus);
    window.addEventListener('offline', updateSidebarConnectionStatus);

    updateSidebarConnectionStatus();
});
