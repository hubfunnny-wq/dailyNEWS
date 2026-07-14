/* ==========================================================================
   DAILY PULSE - APPLICATION SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Initial State ---
    let appState = {
        theme: localStorage.getItem('dp-theme') || 'dark',
        currentTab: 'all', // 'all', 'bookmarks', or 'custom-[id]'
        currentCategory: 'all', // 'all', 'technology', 'science', 'sports'
        searchQuery: '',
        articles: [],
        bookmarks: JSON.parse(localStorage.getItem('dp-bookmarks')) || [],
        customFeeds: JSON.parse(localStorage.getItem('dp-custom-feeds')) || [],
        weatherData: null,
        userLocation: null,
        quoteDismissed: localStorage.getItem('dp-quote-dismissed') === 'true'
    };

    // --- Predefined Feeds ---
    const DEFAULT_FEEDS = [
        { name: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'general' },
        { name: 'NYT World News', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'general' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology' },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'technology' },
        { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'science' },
        { name: 'ESPN News', url: 'https://www.espn.com/espn/rss/news', category: 'sports' }
    ];

    // --- Unsplash Category Backdrops (Used when RSS item has no image) ---
    const CATEGORY_IMAGES = {
        general: [
            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
        ],
        technology: [
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&q=80'
        ],
        science: [
            'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80'
        ],
        sports: [
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1484482438455-862d362372d7?auto=format&fit=crop&w=600&q=80'
        ]
    };

    // --- Offline Fallback News (To ensure UI is NEVER empty/broken) ---
    const OFFLINE_NEWS = [
        {
            title: 'Global Tech Summit Unveils Next-Generation AI Assistant Tools',
            description: 'The annual Global Tech Summit kicked off today in San Francisco, showcasing revolutionary advancements in AI, neural interfaces, and green technology solutions designed for enterprise and personal development.',
            link: 'https://techcrunch.com',
            source: 'TechCrunch',
            pubDate: new Date().toUTCString(),
            category: 'technology',
            image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80'
        },
        {
            title: 'Astronomers Detect Deep Space Signal from Distant Galaxy Cluster',
            description: 'Using the upgraded James Webb Space Telescope array, scientists have recorded an unusual repeating radio burst originating from a galaxy cluster over 2.4 billion light-years away.',
            link: 'https://www.sciencedaily.com',
            source: 'Science Daily',
            pubDate: new Date(Date.now() - 3600000).toUTCString(),
            category: 'science',
            image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
        },
        {
            title: 'Championship Finals: Underdog Team Secures Dramatic Last-Second Win',
            description: 'In one of the most exciting championship matches in recent sports history, the underdogs mounted a thrilling fourth-quarter comeback to clinch the trophy with a final second shot.',
            link: 'https://www.espn.com',
            source: 'ESPN News',
            pubDate: new Date(Date.now() - 7200000).toUTCString(),
            category: 'sports',
            image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'
        },
        {
            title: 'New Renewable Energy Infrastructure Bill Passed by Parliament',
            description: 'A major milestone for climate action has been reached as the parliament voted in favor of a comprehensive green energy initiative aiming to double solar and wind capacities by 2030.',
            link: 'https://feeds.bbci.co.uk',
            source: 'BBC World News',
            pubDate: new Date(Date.now() - 10800000).toUTCString(),
            category: 'general',
            image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80'
        }
    ];

    // --- Inspirational Quotes Data ---
    const INSPIRATIONAL_QUOTES = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
        { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
        { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
        { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" }
    ];

    // --- DOM Elements ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleText = document.getElementById('themeToggleText');
    const greetingText = document.getElementById('greeting');
    const currentDateText = document.getElementById('currentDate');
    const quoteCard = document.getElementById('quoteCard');
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');
    const closeQuoteBtn = document.getElementById('closeQuoteBtn');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const categoriesTabs = document.getElementById('categoriesTabs');
    const newsGrid = document.getElementById('newsGrid');
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshIcon = refreshBtn.querySelector('.refresh-icon');
    const refreshIndicator = document.querySelector('.refresh-indicator');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const bookmarkCountBadge = document.getElementById('bookmarkCount');
    const customFeedsList = document.getElementById('customFeedsList');
    
    // Modals
    const addFeedModal = document.getElementById('addFeedModal');
    const openAddFeedModal = document.getElementById('openAddFeedModal');
    const closeFeedModalBtn = document.getElementById('closeFeedModalBtn');
    const cancelFeedBtn = document.getElementById('cancelFeedBtn');
    const addFeedForm = document.getElementById('addFeedForm');
    const modalError = document.getElementById('modalError');
    const saveFeedBtn = document.getElementById('saveFeedBtn');
    
    // Reader Drawer
    const readerOverlay = document.getElementById('readerOverlay');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const readerContent = document.getElementById('readerContent');
    
    // Weather
    const weatherWidget = document.getElementById('weatherWidget');

    // --- Weather Mapping Rules ---
    // Maps WMO Weather Codes to descriptive strings & beautiful SVG configurations
    const weatherCodes = {
        0: { desc: 'Clear sky', icon: 'sun' },
        1: { desc: 'Mainly clear', icon: 'cloud-sun' },
        2: { desc: 'Partly cloudy', icon: 'cloud-sun' },
        3: { desc: 'Overcast', icon: 'cloud' },
        45: { desc: 'Fog', icon: 'fog' },
        48: { desc: 'Depositing rime fog', icon: 'fog' },
        51: { desc: 'Light drizzle', icon: 'drizzle' },
        53: { desc: 'Moderate drizzle', icon: 'drizzle' },
        55: { desc: 'Dense drizzle', icon: 'drizzle' },
        61: { desc: 'Slight rain', icon: 'rain' },
        63: { desc: 'Moderate rain', icon: 'rain' },
        65: { desc: 'Heavy rain', icon: 'rain' },
        71: { desc: 'Slight snow fall', icon: 'snow' },
        73: { desc: 'Moderate snow fall', icon: 'snow' },
        75: { desc: 'Heavy snow fall', icon: 'snow' },
        80: { desc: 'Slight rain showers', icon: 'rain' },
        81: { desc: 'Moderate rain showers', icon: 'rain' },
        82: { desc: 'Violent rain showers', icon: 'rain' },
        95: { desc: 'Thunderstorm', icon: 'storm' },
    };

    // --- Initial Setup ---
    function init() {
        setTheme(appState.theme);
        updateGreetingAndDate();
        loadRandomQuote();
        loadBookmarksCount();
        renderCustomFeedsList();
        setupWeather();
        fetchNews();
        
        // Start live clock updating
        setInterval(updateGreetingAndDate, 60000);
    }

    // --- Theme Control ---
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dp-theme', theme);
        appState.theme = theme;
        themeToggleText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    themeToggleBtn.addEventListener('click', () => {
        setTheme(appState.theme === 'dark' ? 'light' : 'dark');
    });

    // --- Dynamic Greeting & Dates ---
    function updateGreetingAndDate() {
        const now = new Date();
        const hrs = now.getHours();
        let greet = 'Good Evening';
        
        if (hrs < 12) greet = 'Good Morning';
        else if (hrs < 17) greet = 'Good Afternoon';
        
        greetingText.textContent = `${greet}`;
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateText.textContent = now.toLocaleDateString('en-US', options);
    }

    // --- Inspirational Quote Widget ---
    function loadRandomQuote() {
        if (appState.quoteDismissed) {
            quoteCard.style.display = 'none';
            return;
        }
        
        const index = Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length);
        const quote = INSPIRATIONAL_QUOTES[index];
        quoteText.textContent = `"${quote.text}"`;
        quoteAuthor.textContent = `- ${quote.author}`;
    }

    closeQuoteBtn.addEventListener('click', () => {
        quoteCard.style.display = 'none';
        appState.quoteDismissed = true;
        localStorage.setItem('dp-quote-dismissed', 'true');
    });

    // --- Local Weather Integration (Open-Meteo) ---
    function setupWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    appState.userLocation = { lat, lon };
                    getWeatherDetails(lat, lon, 'Your Location');
                },
                (error) => {
                    console.log("Weather location permission denied or error. Falling back to default.");
                    // Fallback to London
                    getWeatherDetails(51.5074, -0.1278, 'London');
                }
            );
        } else {
            getWeatherDetails(51.5074, -0.1278, 'London');
        }
    }

    async function getWeatherDetails(lat, lon, locationName) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&relativehumidity_2m=true&windspeed_10m=true`);
            if (!res.ok) throw new Error("Weather request failed");
            const data = await res.json();
            
            appState.weatherData = data.current_weather;
            renderWeather(data.current_weather, locationName);
        } catch (e) {
            console.error("Could not fetch weather data:", e);
            weatherWidget.innerHTML = `
                <div class="weather-info" style="text-align: center; padding: 10px 0;">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Weather currently unavailable</span>
                </div>
            `;
        }
    }

    function getWeatherIcon(iconName) {
        const color = 'currentColor';
        switch (iconName) {
            case 'sun':
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></svg>`;
            case 'cloud-sun':
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"></path><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25"></path></svg>`;
            case 'cloud':
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25"></path></svg>`;
            case 'drizzle':
            case 'rain':
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13a4 4 0 0 1-8 0V6a4 4 0 0 1 8 0v7Z"></path><path d="M8 14H4M20 14h-4M12 18v4M8 20l4 2M16 20l-4 2"></path></svg>`; // Note: Let's use simple cloud-rain
            case 'snow':
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 15.25"></path><path d="M8 20v2M12 20v2M16 20v2"></path></svg>`;
            case 'storm':
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 8.58"></path><path d="M13 11l-4 6h6l-3 5"></path></svg>`;
            case 'fog':
            default:
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="9" x2="16" y2="9"></line><line x1="6" y1="13" x2="18" y2="13"></line><line x1="7" y1="17" x2="17" y2="17"></line></svg>`;
        }
    }

    function renderWeather(current, locationName) {
        const codeInfo = weatherCodes[current.weathercode] || { desc: 'Unknown', icon: 'cloud' };
        
        weatherWidget.innerHTML = `
            <div class="weather-info">
                <div class="weather-top">
                    <span class="weather-temp">${Math.round(current.temperature)}°C</span>
                    <span class="weather-icon-wrapper">${getWeatherIcon(codeInfo.icon)}</span>
                </div>
                <div class="weather-desc">${codeInfo.desc}</div>
                <div class="weather-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>${locationName}</span>
                </div>
            </div>
        `;
    }

    // --- RSS Feeds Fetching and Aggregation ---
    async function fetchNews() {
        showLoadingState();
        setSyncing(true);
        
        appState.articles = [];
        
        // Build the active feed list based on selection
        let feedsToFetch = [];
        
        if (appState.currentTab === 'all') {
            // General grid shows feeds matching the current category
            feedsToFetch = DEFAULT_FEEDS.filter(f => appState.currentCategory === 'all' || f.category === appState.currentCategory);
            // Also include custom feeds that fall into this category
            const customMatched = appState.customFeeds.filter(f => appState.currentCategory === 'all' || f.category === appState.currentCategory);
            feedsToFetch = [...feedsToFetch, ...customMatched];
        } else if (appState.currentTab.startsWith('custom-')) {
            const feedId = appState.currentTab.replace('custom-', '');
            const targetFeed = appState.customFeeds.find(f => f.id === feedId);
            if (targetFeed) {
                feedsToFetch = [targetFeed];
            }
        }
        
        if (feedsToFetch.length === 0) {
            renderNews();
            setSyncing(false);
            return;
        }

        const fetchPromises = feedsToFetch.map(feed => fetchAndParseFeed(feed));
        
        try {
            const results = await Promise.allSettled(fetchPromises);
            
            // Collect all successfully parsed articles
            let allArticles = [];
            results.forEach(res => {
                if (res.status === 'fulfilled' && res.value) {
                    allArticles = [...allArticles, ...res.value];
                }
            });
            
            // Sort articles by publication date descending
            allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            appState.articles = allArticles;
            
            // If offline or proxy returns nothing, load the offline backup
            if (appState.articles.length === 0) {
                console.log("No online articles resolved. Using realistic mock feed data.");
                appState.articles = OFFLINE_NEWS;
            }
        } catch (err) {
            console.error("General error aggregation feeds: ", err);
            appState.articles = OFFLINE_NEWS;
        } finally {
            renderNews();
            setSyncing(false);
        }
    }

    async function fetchAndParseFeed(feed) {
        // Use allorigins.win free CORS proxy to retrieve XML format raw
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`;
        
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Fetch failed for ${feed.name}`);
            
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            
            // Parse error check
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) throw new Error(`Parse error for XML in ${feed.name}`);
            
            const items = xmlDoc.querySelectorAll('item');
            const parsedItems = [];
            
            // Read top 15 items per feed to avoid clutter
            const limit = Math.min(items.length, 15);
            for (let i = 0; i < limit; i++) {
                const item = items[i];
                
                const title = cleanText(item.querySelector('title')?.textContent || 'Untitled Story');
                const link = item.querySelector('link')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
                
                // Description extraction & cleanup
                let rawDesc = item.querySelector('description')?.textContent || '';
                let description = cleanText(rawDesc.replace(/<[^>]*>/g, '')); // Strip HTML tags
                if (description.length > 250) {
                    description = description.slice(0, 247) + '...';
                }
                
                // Find image in feed tags
                let image = null;
                // Method 1: <enclosure>
                const enclosure = item.querySelector('enclosure');
                if (enclosure && enclosure.getAttribute('type')?.startsWith('image')) {
                    image = enclosure.getAttribute('url');
                }
                
                // Method 2: <media:content> or <media:thumbnail>
                if (!image) {
                    const mediaContent = item.getElementsByTagName('media:content')[0] || item.getElementsByTagName('content')[0];
                    if (mediaContent) image = mediaContent.getAttribute('url');
                }
                if (!image) {
                    const mediaThumb = item.getElementsByTagName('media:thumbnail')[0];
                    if (mediaThumb) image = mediaThumb.getAttribute('url');
                }
                
                // Fallback image if none was retrieved
                if (!image) {
                    const imagesArr = CATEGORY_IMAGES[feed.category] || CATEGORY_IMAGES.general;
                    const index = Math.floor(Math.abs(hashCode(title)) % imagesArr.length);
                    image = imagesArr[index];
                }
                
                parsedItems.push({
                    title,
                    description,
                    link,
                    pubDate,
                    source: feed.name,
                    category: feed.category || 'general',
                    image
                });
            }
            return parsedItems;
        } catch (err) {
            console.warn(`Error loading feed: ${feed.name}`, err);
            return null; // Resolve with null, handled by aggregate Promise
        }
    }

    // Helper functions
    function cleanText(text) {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&apos;/g, "'")
            .trim();
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    // --- Loading UI Animations ---
    function showLoadingState() {
        newsGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            newsGrid.appendChild(createSkeletonCard());
        }
    }

    function createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-body">
                <div class="skeleton-meta">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line short"></div>
                </div>
                <div class="skeleton-line title-1"></div>
                <div class="skeleton-line title-2"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-footer">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `;
        return card;
    }

    function setSyncing(isSyncing) {
        if (isSyncing) {
            refreshIndicator.classList.add('syncing');
            refreshBtn.classList.add('syncing');
            refreshBtn.disabled = true;
        } else {
            refreshIndicator.classList.remove('syncing');
            refreshBtn.classList.remove('syncing');
            refreshBtn.disabled = false;
        }
    }

    // --- Render News Cards Grid ---
    function renderNews() {
        newsGrid.innerHTML = '';
        
        let filtered = [];
        
        if (appState.currentTab === 'bookmarks') {
            filtered = appState.bookmarks;
        } else {
            filtered = appState.articles;
        }

        // Apply Search query filter if exists
        if (appState.searchQuery) {
            const query = appState.searchQuery.toLowerCase();
            filtered = filtered.filter(art => 
                art.title.toLowerCase().includes(query) || 
                art.description.toLowerCase().includes(query) ||
                art.source.toLowerCase().includes(query)
            );
        }

        if (filtered.length === 0) {
            renderEmptyState();
            return;
        }

        filtered.forEach(article => {
            newsGrid.appendChild(createNewsCard(article));
        });
    }

    function createNewsCard(article) {
        const isBookmarked = isArticleBookmarked(article);
        const card = document.createElement('div');
        card.className = 'news-card';
        
        // Dynamic time layout
        const dateObj = new Date(article.pubDate);
        const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        card.innerHTML = `
            <div class="news-card-image">
                <span class="card-category-badge">${article.category}</span>
                <img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=600&q=80'">
            </div>
            <div class="news-card-body">
                <div class="news-card-meta">
                    <span class="news-card-source">${article.source}</span>
                    <span>${formattedDate}</span>
                </div>
                <h3 class="news-card-title">${article.title}</h3>
                <p class="news-card-excerpt">${article.description}</p>
                <div class="news-card-footer">
                    <span class="read-more-text">
                        Read Story
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </span>
                    <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" title="${isBookmarked ? 'Remove Bookmark' : 'Save Article'}" aria-label="Bookmark article">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                </div>
            </div>
        `;

        // Event: Open Reader Drawer
        card.addEventListener('click', (e) => {
            // Check if user clicked bookmark button specifically
            if (e.target.closest('.bookmark-btn')) return;
            openReader(article);
        });

        // Event: Bookmark toggle
        const bookmarkBtn = card.querySelector('.bookmark-btn');
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBookmark(article, bookmarkBtn);
        });

        return card;
    }

    function renderEmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        
        let title = 'No Articles Found';
        let desc = 'We couldn\'t find any stories matching your current selection or search terms.';
        let btnText = 'Reset Search & Filters';
        let act = 'reset';
        
        if (appState.currentTab === 'bookmarks') {
            title = 'No Bookmarked Stories';
            desc = 'You haven\'t saved any articles yet. Bookmark news articles you like and read them anytime later here.';
            btnText = 'Explore General Feeds';
            act = 'all-feeds';
        } else if (appState.currentTab.startsWith('custom-')) {
            title = 'Custom Feed Empty';
            desc = 'This custom feed has no stories. Wait for content to arrive or double-check the XML endpoint.';
            btnText = 'Sync Feed';
            act = 'sync';
        }

        div.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <h3>${title}</h3>
            <p>${desc}</p>
            <button class="empty-state-btn">${btnText}</button>
        `;

        const btn = div.querySelector('.empty-state-btn');
        btn.addEventListener('click', () => {
            if (act === 'reset') {
                searchInput.value = '';
                appState.searchQuery = '';
                clearSearchBtn.style.display = 'none';
                appState.currentCategory = 'all';
                updateCategoryChips();
                fetchNews();
            } else if (act === 'all-feeds') {
                switchTab('all');
            } else if (act === 'sync') {
                fetchNews();
            }
        });

        newsGrid.appendChild(div);
    }

    // --- Category Chips and Nav Switching ---
    function updateCategoryChips() {
        const chips = categoriesTabs.querySelectorAll('.category-chip');
        chips.forEach(chip => {
            if (chip.getAttribute('data-category') === appState.currentCategory) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }

    categoriesTabs.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        
        appState.currentCategory = chip.getAttribute('data-category');
        updateCategoryChips();
        
        // Force Tab back to all news if currently in custom/bookmarks mode
        if (appState.currentTab !== 'all') {
            appState.currentTab = 'all';
            updateSidebarNavActive();
        }
        
        fetchNews();
    });

    function updateSidebarNavActive() {
        const navItems = sidebarNav.querySelectorAll('.nav-item, .custom-feed-item');
        navItems.forEach(item => {
            const tabAttr = item.getAttribute('data-tab');
            if (tabAttr === appState.currentTab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function switchTab(tabId) {
        appState.currentTab = tabId;
        updateSidebarNavActive();
        
        if (tabId === 'bookmarks') {
            categoriesTabs.style.display = 'none';
            renderNews();
        } else {
            categoriesTabs.style.display = 'flex';
            fetchNews();
        }
    }

    sidebarNav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item, .custom-feed-item');
        if (!item || e.target.closest('.delete-feed-btn')) return;
        
        const tabId = item.getAttribute('data-tab');
        switchTab(tabId);
    });

    // --- Search Logic ---
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value;
        if (appState.searchQuery) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        renderNews();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        appState.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderNews();
    });

    refreshBtn.addEventListener('click', () => {
        fetchNews();
    });

    // --- Bookmarking (Local Storage) ---
    function loadBookmarksCount() {
        bookmarkCountBadge.textContent = appState.bookmarks.length;
    }

    function isArticleBookmarked(article) {
        return appState.bookmarks.some(b => b.link === article.link);
    }

    function toggleBookmark(article, btnElement) {
        const exists = isArticleBookmarked(article);
        if (exists) {
            appState.bookmarks = appState.bookmarks.filter(b => b.link !== article.link);
            if (btnElement) {
                btnElement.classList.remove('active');
                btnElement.title = 'Save Article';
            }
        } else {
            appState.bookmarks.push(article);
            if (btnElement) {
                btnElement.classList.add('active');
                btnElement.title = 'Remove Bookmark';
            }
        }
        
        localStorage.setItem('dp-bookmarks', JSON.stringify(appState.bookmarks));
        loadBookmarksCount();
        
        // If on Bookmarks page, re-render immediately
        if (appState.currentTab === 'bookmarks') {
            renderNews();
        }
    }

    // --- Reader Panel Drawer (Slide-out) ---
    function openReader(article) {
        const isBookmarked = isArticleBookmarked(article);
        const dateObj = new Date(article.pubDate);
        const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        readerContent.innerHTML = `
            <div class="reader-hero">
                <img src="${article.image}" alt="${article.title}" onerror="this.src='https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=600&q=80'">
                <div class="reader-hero-overlay"></div>
            </div>
            <div class="reader-body">
                <div class="reader-meta-row">
                    <span class="reader-source-badge">${article.source}</span>
                    <span>${dateStr}</span>
                </div>
                <h2 class="reader-title">${article.title}</h2>
                <div class="reader-text">
                    <p>${article.description}</p>
                    <p style="margin-top: 16px;">This RSS summary is provided by Daily Pulse. To access the complete writing, multimedia content, and complete journalistic coverage, please proceed to the publisher's official platform via the direct source portal below.</p>
                </div>
                <div class="reader-actions">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="reader-visit-btn">
                        <span>Read Full Story</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                    <button class="reader-bookmark-btn ${isBookmarked ? 'active' : ''}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        <span>${isBookmarked ? 'Saved' : 'Save for Later'}</span>
                    </button>
                </div>
            </div>
        `;
        
        readerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock body scroll

        // Reader bookmark event
        const rBmkBtn = readerContent.querySelector('.reader-bookmark-btn');
        rBmkBtn.addEventListener('click', () => {
            toggleBookmark(article, null);
            const active = isArticleBookmarked(article);
            if (active) {
                rBmkBtn.classList.add('active');
                rBmkBtn.querySelector('span').textContent = 'Saved';
            } else {
                rBmkBtn.classList.remove('active');
                rBmkBtn.querySelector('span').textContent = 'Save for Later';
            }
            // Update the main card grid if visible underneath
            renderNews();
        });
    }

    function closeReader() {
        readerOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Unlock body scroll
    }

    closeDrawerBtn.addEventListener('click', closeReader);
    readerOverlay.addEventListener('click', (e) => {
        if (e.target === readerOverlay) closeReader();
    });

    // --- Custom RSS Feeds Addition & Management ---
    function renderCustomFeedsList() {
        customFeedsList.innerHTML = '';
        
        if (appState.customFeeds.length === 0) {
            customFeedsList.innerHTML = '<div class="no-feeds-msg">No custom feeds added yet.</div>';
            return;
        }

        appState.customFeeds.forEach(feed => {
            const feedDiv = document.createElement('div');
            feedDiv.className = `custom-feed-item ${appState.currentTab === `custom-${feed.id}` ? 'active' : ''}`;
            feedDiv.setAttribute('data-tab', `custom-${feed.id}`);
            
            feedDiv.innerHTML = `
                <span class="custom-feed-name" title="${feed.name}">${feed.name}</span>
                <button class="delete-feed-btn" title="Remove Feed" aria-label="Remove feed">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;

            // Delete event handler
            const delBtn = feedDiv.querySelector('.delete-feed-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeCustomFeed(feed.id);
            });

            customFeedsList.appendChild(feedDiv);
        });
    }

    function removeCustomFeed(id) {
        if (confirm("Are you sure you want to remove this custom feed?")) {
            appState.customFeeds = appState.customFeeds.filter(f => f.id !== id);
            localStorage.setItem('dp-custom-feeds', JSON.stringify(appState.customFeeds));
            
            // If deleting the active custom tab, reset back to All
            if (appState.currentTab === `custom-${id}`) {
                appState.currentTab = 'all';
            }
            
            renderCustomFeedsList();
            updateSidebarNavActive();
            fetchNews();
        }
    }

    // Modal Events
    openAddFeedModal.addEventListener('click', () => {
        addFeedModal.classList.add('active');
        addFeedForm.reset();
        modalError.style.display = 'none';
        saveFeedBtn.classList.remove('loading');
        saveFeedBtn.disabled = false;
    });

    function closeFeedModal() {
        addFeedModal.classList.remove('active');
    }

    closeFeedModalBtn.addEventListener('click', closeFeedModal);
    cancelFeedBtn.addEventListener('click', closeFeedModal);
    addFeedModal.addEventListener('click', (e) => {
        if (e.target === addFeedModal) closeFeedModal();
    });

    addFeedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('feedName').value.trim();
        const url = document.getElementById('feedUrl').value.trim();
        const category = document.getElementById('feedCategory').value;
        
        modalError.style.display = 'none';
        saveFeedBtn.classList.add('loading');
        saveFeedBtn.disabled = true;

        // Test feed validation via the CORS proxy
        const testProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        
        try {
            const res = await fetch(testProxyUrl);
            if (!res.ok) throw new Error("Could not access feed URL.");
            const xmlText = await res.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError || !xmlDoc.querySelector('channel')) {
                throw new Error("Invalid RSS structure. Ensure this is an XML feed (not HTML).");
            }
            
            // Validated! Add to list
            const newId = String(Date.now());
            const newFeed = { id: newId, name, url, category };
            
            appState.customFeeds.push(newFeed);
            localStorage.setItem('dp-custom-feeds', JSON.stringify(appState.customFeeds));
            
            renderCustomFeedsList();
            closeFeedModal();
            
            // Switch view immediately to this custom feed
            switchTab(`custom-${newId}`);
        } catch (err) {
            modalError.textContent = err.message || "Failed to validate RSS Feed. Check URL and try again.";
            modalError.style.display = 'block';
        } finally {
            saveFeedBtn.classList.remove('loading');
            saveFeedBtn.disabled = false;
        }
    });

    // Run Initialization
    init();
});
