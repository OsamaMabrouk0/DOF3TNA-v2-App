document.addEventListener('DOMContentLoaded', function () {
    const videoPage = document.getElementById('video');
    const offlineContainer = document.getElementById('offline-container-video');
    const videoContent = document.querySelector('.video-container');
    const loadingScreen = document.getElementById('loading-screen-video');
    const videosDropdown = document.getElementById("videos-dropdown");
    const videoFrame = document.getElementById("video-frame");
    const videoPlaceholder = document.getElementById("video-placeholder");
    const progressBarContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");

    let isOnline = navigator.onLine;
    let internetErrorShown = false;
    let currentVideoId = null;
    let playlistsLoaded = false;

    const notyf = new Notyf({
        duration: 3000,
        ripple: true,
        dismissible: true,
        position: { x: 'right', y: 'bottom' },
        types: [
            {
                type: 'error',
                background: '#e63946',
                icon: { className: 'fas fa-exclamation-circle', tagName: 'i' },
                dismissible: true
            },
            {
                type: 'success',
                background: '#2a9d8f',
                icon: { className: 'fas fa-check-circle', tagName: 'i' },
                dismissible: true
            }
        ]
    });

    function updateConnectionStatus() {
        if (navigator.onLine) {
            if (offlineContainer) offlineContainer.style.display = 'none';
            if (videoContent) videoContent.style.display = 'block';
            if (!isOnline) {
                notyf.open({ type: 'success', message: "تم استعادة الاتصال! جارٍ تحميل المحتوى..." });
                isOnline = true;
                internetErrorShown = false;
                if (!playlistsLoaded) {
                    setTimeout(loadPlaylists, 500);
                }
            }
        } else {
            if (offlineContainer) offlineContainer.style.display = 'flex';
            if (videoContent) videoContent.style.display = 'none';
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (!internetErrorShown) {
                notyf.open({ type: 'error', message: "لا يوجد اتصال بالإنترنت! يرجى التحقق من الشبكة." });
                internetErrorShown = true;
            }
            isOnline = false;
        }
    }

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();

    async function loadPlaylists() {
        try {
            const response = await fetch("https://osamamabrouk0.github.io/DOF3TNA-V2-UPDATES/playlists.json?timestamp=" + new Date().getTime());
            const data = await response.json();
            videosDropdown.innerHTML = "";

            if (data.length === 0) {
                videosDropdown.innerHTML = "<option selected>⚠️ لا توجد مواد متاحة حاليا.</option>";
                loadingScreen.classList.add("hidden");
                return;
            }

            const defaultOption = document.createElement("option");
            defaultOption.value = "reset";
            defaultOption.textContent = "اختر المادة";
            defaultOption.selected = true;
            videosDropdown.appendChild(defaultOption);

            data.forEach(item => {
                const option = document.createElement("option");
                option.value = item.videoId;
                option.textContent = item.subject;
                option.dataset.isPlaylist = item.isPlaylist;
                videosDropdown.appendChild(option);
            });

            loadingScreen.classList.add("hidden");
            playlistsLoaded = true;
        } catch (error) {
            loadingScreen.classList.add("hidden");
        }
    }

    videosDropdown.addEventListener("change", (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const videoId = selectedOption.value;

        if (videoId === "reset") {
            resetPage();
        } else {
            const isPlaylist = selectedOption.dataset.isPlaylist === "true";
            currentVideoId = videoId;
            loadVideos(videoId, isPlaylist);
            videosDropdown.options[0].textContent = "إغلاق الكل";
        }
    });

    function loadVideos(videoId, isPlaylist) {
        progressBarContainer.style.display = "block";
        progressBar.style.width = "0%";

        if (!videoId) {
            videoFrame.innerHTML = `
                <div class="video-message-container">
                    <p>لا توجد فيديوهات لهذه المادة حاليا. </br> سوف تتوفر قريباً.</p>
                    <img src="./assets/Images/sorry.svg" alt="لا توجد فيديوهات">
                </div>
            `;
            progressBarContainer.style.display = "none";
            return;
        }
        

        const videoUrl = isPlaylist
            ? `https://www.youtube.com/embed/videoseries?list=${videoId}&autoplay=1`
            : `https://www.youtube.com/embed/${videoId}?autoplay=1`;

        const iframe = document.createElement("iframe");
        iframe.className = "w-full h-full";
        iframe.src = videoUrl;
        iframe.frameBorder = "0";
        iframe.allowFullscreen = true;

        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 90) {
                progress += 10;
                progressBar.style.width = `${progress}%`;
            }
        }, 500);

        iframe.onload = () => {
            clearInterval(interval);
            progressBar.style.width = "100%";
            setTimeout(() => progressBarContainer.style.display = "none", 500);
        };

        videoFrame.innerHTML = "";
        videoFrame.appendChild(iframe);
        videoFrame.appendChild(progressBarContainer);
        videoPlaceholder.style.display = "none";
    }

    function resetPage() {
        videoFrame.innerHTML = `
            <p class="text-center font-semibold">اختر مادة لعرض الفيديوهات الخاصة بها.</p>
            <img id="video-placeholder" src="./assets/Images/video.svg" alt=""
                class="mx-auto mt-4 rounded-lg">
            <div id="progress-container" style="display: none;">
                <div id="progress-bar"></div>
            </div>
        `;

        progressBarContainer.style.display = "none";
        currentVideoId = null;
        videosDropdown.options[0].textContent = "اختر المادة";
        videosDropdown.selectedIndex = 0;
    }

    loadPlaylists();
});
