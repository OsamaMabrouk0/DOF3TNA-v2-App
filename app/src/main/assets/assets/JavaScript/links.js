function filterLinks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const linkCards = document.querySelectorAll('.link-card');
    let hasResults = false;

    linkCards.forEach(card => {
        if (card.dataset.name.toLowerCase().includes(query)) {
            card.style.display = 'grid';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });

    document.getElementById('noResults').style.display = hasResults ? 'none' : 'block';
}


function openLink(url) {
    window.open(url, '_self');
}