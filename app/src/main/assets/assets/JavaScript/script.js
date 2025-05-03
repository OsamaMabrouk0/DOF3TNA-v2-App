
let loadingScreenHidden = false;

window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        loadingScreenHidden = true;

        initializeMainPageTransitions();
    }, 0);
});

/* *********************************| تأثيرات الصفحة الرئيسية |********************************* */
function initializeMainPageTransitions() {
    const header = document.getElementById('header');
    const mainImageContainer = document.querySelector('.main-image-container');
    const icons = document.querySelectorAll('.icon');
    const mainSectionTitle = document.querySelector('.main-section-title');

    gsap.fromTo(header, { y: -1000, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.fromTo(mainImageContainer, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.2, ease: 'power2.out' });
    gsap.fromTo(icons, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.2, stagger: 0.05, ease: 'power2.out' });
    gsap.fromTo(mainSectionTitle, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.2, ease: 'power2.out' });
}


const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

/* *********************************| التحكم في القائمة الجانبية |********************************* */
menuToggle.addEventListener('change', () => {
    if (menuToggle.checked) {
        sidebar.classList.add('active');
    } else {
        sidebar.classList.remove('active');
    }
});

/* *********************************| إعادة تعيين الأيقونة عند الخروج من صفحة المحاضرات |********************************* */
function resetMenuIcon() {
    menuToggle.checked = false; 
    sidebar.classList.remove('active');
}


window.addEventListener('load', () => {
    resetMenuIcon();
});

window.addEventListener('beforeunload', () => {
    resetMenuIcon();
});


/* *********************************| شريط الاشعارات |********************************* */

const notyf = new Notyf({
    duration: 1500,
    ripple: true,
    dismissible: true, 
    position: { x: 'left', y: 'bottom' },
    types: [
        {
            type: 'info',
            background: '#2a9d8f',
            icon: {
                className: 'fas fa-info-circle',
                tagName: 'i'
            }
        },
        {
            type: 'error',
            background: '#e63946',
            icon: {
                className: 'fas fa-exclamation-triangle',
                tagName: 'i'
            }
        },
        {
            type: 'warning',
            background: '#f4a261',
            icon: {
                className: 'fas fa-exclamation-circle',
                tagName: 'i'
            }
        }
    ]
});

/* *********************************| التنقل إلى الأقسام الداخلية |********************************* */
function showSection(sectionId, sectionName) {
    if (!loadingScreenHidden) return;

    const currentSection = document.querySelector('.internal-section:not(.hidden)');
    if (currentSection && currentSection.id === sectionId) {
        notyf.open({
            type: 'info',
            message: `أنت بالفعل في صفحة "${sectionName}".`
        });
        return;
    }

    if (history.state?.sectionId !== sectionId) {
        history.pushState({ sectionId }, sectionName, `#${sectionId}`);
    }

    const sections = document.querySelectorAll('.internal-section');
    const hamburgerIcon = document.querySelector('.hamburger');

    sections.forEach(section => {
        if (!section.classList.contains('hidden')) {
            gsap.to(section, {
                opacity: 0, duration: 0.1, onComplete: () => {
                    section.classList.add('hidden');
                }
            });
        }
    });

    gsap.to('#main-page', {
        opacity: 0, duration: 0.1, onComplete: () => {
            document.getElementById('main-page').style.display = 'none';

            const section = document.getElementById(sectionId);
            section.classList.remove('hidden');
            document.getElementById('header-title').textContent = sectionName;
            document.getElementById('back-icon').style.display = 'block';

            if (sectionId === 'lectures') {
                hamburgerIcon.classList.add('visible');
            } else {
                hamburgerIcon.classList.remove('visible');
                closeSidebar();
            }

            gsap.fromTo(section, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.1 });
            showBottomNav();
        }
    });
}



/* *********************************| العودة إلى الصفحة الرئيسية |********************************* */
function goBack() {
    if (!loadingScreenHidden) return;

    const sections = document.querySelectorAll('.internal-section');
    const hamburgerIcon = document.querySelector('.hamburger');

    gsap.to(sections, {
        opacity: 0, duration: 0.1, onComplete: () => {
            sections.forEach(section => section.classList.add('hidden'));

            document.getElementById('main-page').style.display = 'block';
            document.getElementById('header-title').textContent = 'دفعتنا';
            document.getElementById('back-icon').style.display = 'none';

            hamburgerIcon.classList.remove('visible');
            closeSidebar();

            gsap.fromTo('#main-page', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.1 });
            hideBottomNav();
        }
    });
}

/* *********************************| إغلاق القائمة الجانبية |********************************* */
function closeSidebar() {
    menuToggle.checked = false;
    sidebar.classList.remove('active');
}

/* *********************************| شريط التنقل السفلي |********************************* */
function showBottomNav() {
    document.getElementById('bottom-nav').classList.add('visible');
}

function hideBottomNav() {
    document.getElementById('bottom-nav').classList.remove('visible');
}

/* *********************************| التعامل مع زر الرجوع |********************************* */
window.addEventListener('popstate', (event) => {

    const isOnMainPage = document.getElementById('main-page').style.display !== 'none';

    if (isOnMainPage) {
        history.replaceState(null, 'الرئيسية', '#');
        return;
    }


    if (event.state && event.state.sectionId) {
        goBack();
        history.replaceState(null, 'الرئيسية', '#');
    } else {
        goBack();
        history.replaceState(null, 'الرئيسية', '#');
    }
});


    window.addEventListener("scroll", function () {
        const header = document.querySelector("header.navbar");
        if (window.scrollY > 50) {
            header.classList.add("active");
        } else {
            header.classList.remove("active");
        }
    });