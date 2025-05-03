document.addEventListener('DOMContentLoaded', function () {
    const summariesPage = document.getElementById('summaries');
    const offlineContainer = document.getElementById('offline-container-summaries');
    const summariesContent = document.querySelector('.summaries-container');
    const loadingScreen = document.getElementById('loading-screen-summaries');

    // Function to handle connection status
    function updateConnectionStatus() {
        if (navigator.onLine) {
            // User is online
            if (offlineContainer) offlineContainer.style.display = 'none';
            if (summariesContent) summariesContent.style.display = 'block';
        } else {
            // User is offline
            if (offlineContainer) offlineContainer.style.display = 'flex';
            if (summariesContent) summariesContent.style.display = 'none';
            if (loadingScreen) loadingScreen.style.display = 'none';
        }
    }

    // Listen for online and offline events
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    // Initial check
    updateConnectionStatus();


    if (!summariesPage || !offlineContainer || !summariesContent || !loadingScreen) {
        console.error('Some elements are missing in the DOM. Please check the HTML structure.');
        return;
    }

    // Function to display error messages
    function displayErrorMessage(message) {
        const errorContainer = document.createElement('div');
        errorContainer.style.color = '#FF3D00';
        errorContainer.style.fontSize = '16px';
        errorContainer.style.marginTop = '20px';
        errorContainer.style.textAlign = 'center';
        errorContainer.style.padding = '10px';
        errorContainer.style.backgroundColor = '#f8d7da';
        errorContainer.style.borderRadius = '5px';
        errorContainer.innerText = message;

        summariesPage.prepend(errorContainer);
    }


    const SummariesPage = {
        // دي مش ثغرة يعم الهاكر 😂
        // انا اللي سايب المغاتيح بمزاجي 
        // عشان لو في حد عاوز يستخدمه في مشروع مفيش فيه اي معلومات سرية يعني 🤍
        GOOGLE_DRIVE_API_KEY: "AIzaSyB7vGBBmmybGA_EvGsvdmhLz8qangORK0I",
        summariesFolderId: "1rMmhGxnRc--DBBzjqkVvZsQBafFws3ba",
        topicFilesCache: {},

        // Fetch folders from Google Drive
        async fetchFolders(parentId) {
            const url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${this.GOOGLE_DRIVE_API_KEY}&fields=files(id,name)&orderBy=name`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch folders");
                const data = await response.json();
                return data.files || [];
            } catch (error) {
                console.error("Error fetching folders:", error);
                handleApiError(error);
                return [];
            }
        },

        // Fetch files from Google Drive
        async fetchFiles(parentId) {
            if (this.topicFilesCache[parentId]) {
                return this.topicFilesCache[parentId];
            }

            const url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType!='application/vnd.google-apps.folder'&key=${this.GOOGLE_DRIVE_API_KEY}&fields=files(id,name)&orderBy=name`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch files");
                const data = await response.json();
                this.topicFilesCache[parentId] = data.files || [];
                return this.topicFilesCache[parentId];
            } catch (error) {
                console.error("Error fetching files:", error);
                handleApiError(error);
                return [];
            }
        },

        // Load summaries and display them
        async loadSummaries() {
            const summariesContainer = document.querySelector("#summaries .summaries");
            if (!summariesContainer) {
                console.error("Summaries container not found.");
                return;
            }

            summariesContainer.innerHTML = "";

            try {
                const topics = await this.fetchFolders(this.summariesFolderId);

                if (!Array.isArray(topics) || topics.length === 0) {
                    summariesContainer.innerHTML = "<p>لا توجد ملخصات متاحة حالياً. </br> سوف تتوفر قريباً.</p>";
                    return;
                }

                const topicsWithFiles = await Promise.all(
                    topics.map(async (topic) => {
                        const files = await this.fetchFiles(topic.id);
                        return { ...topic, files: Array.isArray(files) ? files : [] };
                    })
                );

                topicsWithFiles.forEach((topic) => {
                    const topicElement = document.createElement("div");
                    topicElement.classList.add("summaries");

                    const topicHeader = document.createElement("div");
                    topicHeader.classList.add("summaries-header");
                    topicHeader.innerHTML = `
                        <span class="summaries-folder-icon"><i class="fas fa-folder"></i></span>
                        <span class="summaries-name">${topic.name}</span>
                        <span class="arrow-icon"><i class="fas fa-chevron-down"></i></span>
                    `;

                    const summariesContent = document.createElement("div");
                    summariesContent.classList.add("summaries-content");

                    if (topic.files.length > 0) {
                        topic.files.forEach((file) => {
                            const fileElement = document.createElement("div");
                            fileElement.classList.add("summaries-files");
                            fileElement.innerHTML = `
                                <span class="file-name">${file.name}</span>
                                <span class="download-icon">
                                    <a href="https://drive.google.com/uc?export=download&id=${file.id}" download>
                                        <i class="fas fa-download"></i>
                                    </a>
                                </span>
                            `;
                            summariesContent.appendChild(fileElement);
                        });
                    } else {
                        summariesContent.innerHTML = "<p>لا توجد ملخصات متاحة لهذه المادة الان. </br> سوف تتوفر قريباً.</p>";
                    }

                    topicHeader.addEventListener("click", () => {
                        const isOpen = summariesContent.classList.contains("open");

                        this.closeAllSummaries();

                        if (!isOpen) {
                            summariesContent.style.maxHeight = `${summariesContent.scrollHeight}px`;
                            summariesContent.classList.add("open");
                            topicHeader.classList.add("open");
                        }
                    });

                    topicElement.appendChild(topicHeader);
                    topicElement.appendChild(summariesContent);
                    summariesContainer.appendChild(topicElement);
                });
            } catch (error) {
                console.error("Error loading summaries:", error);

            } finally {
                if (loadingScreen) {
                    loadingScreen.style.opacity = "0";
                    setTimeout(() => {
                        loadingScreen.style.display = "none";
                    }, 500);
                }
            }
        },

        // Close all open summaries
        closeAllSummaries() {
            document.querySelectorAll(".summaries-content.open").forEach((openContent) => {
                openContent.classList.remove("open");
                openContent.style.maxHeight = "0";
                openContent.previousElementSibling.classList.remove("open");
            });
        },

        // Initialize the SummariesPage
        async initialize() {
            try {
                await this.loadSummaries();
            } catch (error) {
                console.error("Initialization error:", error);
            }
        },
    };

    // Start the SummariesPage
    SummariesPage.initialize();
});