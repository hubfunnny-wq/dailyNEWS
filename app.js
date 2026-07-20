/* ==========================================================================
   AI PULSE - APPLICATION SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let appState = {
        theme: localStorage.getItem('aip-theme') || 'dark',
        currentTab: 'ideas', // 'ideas', 'news', 'radar', 'bookmarks', or 'custom-[id]'
        currentIdeaCategory: 'all',
        currentNewsCategory: 'all',
        searchQuery: '',
        articles: [],
        ideas: [],
        bookmarks: JSON.parse(localStorage.getItem('aip-bookmarks')) || [],
        customFeeds: JSON.parse(localStorage.getItem('aip-custom-feeds')) || [],
        weatherData: null,
        quoteDismissed: localStorage.getItem('aip-quote-dismissed') === 'true'
    };

    // --- Curated AI Feeds ---
    const DEFAULT_AI_FEEDS = [
        { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/feed/', category: 'technology' },
        { name: 'TechCrunch AI', url: 'https://techcrunch.com/feed/', category: 'technology' },
        { name: 'Wired AI & Innovation', url: 'https://www.wired.com/feed/rss', category: 'technology' },
        { name: 'Science Daily AI', url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml', category: 'science' }
    ];

    // --- AI Models Radar Dataset ---
    const AI_MODELS_RADAR = [
        {
            name: 'DeepSeek-R1',
            org: 'DeepSeek AI',
            type: 'Reasoning & Open Weights',
            desc: 'State-of-the-art open reasoning model using reinforcement learning to match top closed frontier models on complex math and coding.',
            stat: '671B Params (MoE)',
            link: 'https://github.com/deepseek-ai/DeepSeek-R1'
        },
        {
            name: 'Claude 3.5 Sonnet',
            org: 'Anthropic',
            type: 'Frontier LLM & Vision',
            desc: 'Industry benchmark leader for advanced computer coding, complex multi-step reasoning, and computer use capability.',
            stat: 'Top Benchmark Score',
            link: 'https://www.anthropic.com/claude'
        },
        {
            name: 'Llama 3.3 70B',
            org: 'Meta AI',
            type: 'Open Source LLM',
            desc: 'Ultra-efficient 70-billion parameter model offering performance rivaling much larger proprietary models.',
            stat: '70B Active Params',
            link: 'https://www.llama.com'
        },
        {
            name: 'LangGraph & AutoGen',
            org: 'Open Source Community',
            type: 'Multi-Agent Framework',
            desc: 'Frameworks for building stateful, multi-agent AI systems capable of autonomous tool execution and collaborative planning.',
            stat: 'Agentic Framework',
            link: 'https://www.langchain.com/langgraph'
        },
        {
            name: 'Midjourney v6.1',
            org: 'Midjourney',
            type: 'Generative Vision',
            desc: 'State-of-the-art image generation model with enhanced photorealism, text rendering, and prompt fidelity.',
            stat: 'Generative Media',
            link: 'https://www.midjourney.com'
        },
        {
            name: 'Whisper v3',
            org: 'OpenAI',
            type: 'Speech Recognition',
            desc: 'Robust multilingual speech-to-text recognition model trained on 680,000 hours of diverse audio.',
            stat: 'Multilingual Audio',
            link: 'https://github.com/openai/whisper'
        }
    ];

    // --- Curated Dataset of AI Startup & Project Ideas ---
    const AI_IDEAS_DATABASE = [
        {
            id: 'idea-1',
            title: 'Autonomous Code Security Auditor',
            subtitle: 'AI Agent for Zero-Day Vulnerability Patching',
            category: 'coding',
            problem: 'Development teams struggle to catch complex logic flaws and zero-day vulnerabilities in large repositories prior to production deployment.',
            solution: 'Deploy a localized RAG agent that scans pull requests, simulates adversarial exploits in a sandbox, and automatically drafts security patches.',
            techStack: ['LLM RAG', 'Multi-Agent Workflows', 'Static Analysis', 'Docker Sandbox'],
            targetAudience: 'DevSecOps & Enterprise Software Teams',
            feasibility: '9.4 / 10'
        },
        {
            id: 'idea-2',
            title: 'AI Clinical Trial Matching Engine',
            subtitle: 'Genomic Data & EHR Patient Qualifier',
            category: 'healthcare',
            problem: 'Patients with rare medical conditions miss out on life-saving clinical trials due to complex qualifying eligibility documents.',
            solution: 'Anonymized medical record parser powered by medical-tuned LLMs that instantly matches patient EHR profiles with global clinical trial registries.',
            techStack: ['BioBERT', 'HIPAA Privacy Layer', 'FHIR API', 'Vector Database'],
            targetAudience: 'Hospitals, Oncologists & Biotech Researchers',
            feasibility: '8.9 / 10'
        },
        {
            id: 'idea-3',
            title: 'Hyper-Personalized AI Course Architect',
            subtitle: 'Dynamic Adaptive Learning Engine',
            category: 'education',
            problem: 'Generic online courses have high dropout rates because they do not adapt to individual learning speeds or background knowledge.',
            solution: 'An AI engine that generates customized micro-interactive courses, quizzes, and voice tutors based on a student\'s target skill set and preferred learning style.',
            techStack: ['Multimodal LLM', 'Voice Synthesis', 'Adaptive Knowledge Graphs'],
            targetAudience: 'Self-directed Learners & Bootcamps',
            feasibility: '9.1 / 10'
        },
        {
            id: 'idea-4',
            title: 'Enterprise ERP Voice Copilot',
            subtitle: 'Natural Language Business Analytics',
            category: 'enterprise',
            problem: 'Execs and managers waste hours constructing complex SQL queries or navigating clunky ERP dashboards to extract business performance metrics.',
            solution: 'A secure, voice-activated enterprise AI agent connected directly to warehouse SQL and CRM data that answers complex analytical queries instantly.',
            techStack: ['Text-to-SQL', 'LangGraph', 'Enterprise RAG', 'Whisper API'],
            targetAudience: 'C-Suite Executives & Operations Managers',
            feasibility: '9.5 / 10'
        },
        {
            id: 'idea-5',
            title: 'Generative Brand Design System',
            subtitle: 'Automated Multi-Channel Design Engine',
            category: 'creative',
            problem: 'Marketing teams spend significant budget re-rendering ad graphics and assets across dozens of aspect ratios and localized copy requirements.',
            solution: 'Upload brand guidelines once and let an AI generator produce pixel-perfect, compliant ad vectors, copy variations, and localized videos on demand.',
            techStack: ['Diffusion Models', 'SVG Canvas Gen', 'Fine-Tuned Flux', 'BrandGuard API'],
            targetAudience: 'E-commerce Brands & Marketing Agencies',
            feasibility: '9.0 / 10'
        },
        {
            id: 'idea-6',
            title: 'AI Micro-SaaS Financial Compliance Auditor',
            subtitle: 'Tax & Audit Risk Predictor',
            category: 'enterprise',
            problem: 'Small businesses frequently incur tax penalties due to missed deductible expense categorizations and changing regulatory policies.',
            solution: 'An automated OCR & LLM accounting assistant that parses receipts, flags audit risks in real time, and synchronizes with QuickBooks.',
            techStack: ['Document AI', 'GPT-4o Vision', 'Finetuned Tax Model', 'Plaid API'],
            targetAudience: 'Freelancers & Small Business Owners',
            feasibility: '9.3 / 10'
        }
    ];

    // --- AI Prompts & Insights Database ---
    const AI_PROMPTS = [
        {
            text: "Build a multi-agent autonomous system that continuously audits codebases for security vulnerabilities using localized RAG pipelines.",
            author: "AI Pulse Research"
        },
        {
            text: "The future of software engineering lies in orchestrating specialized neural agents, not writing boilerplate syntax.",
            author: "Andrej Karpathy"
        },
        {
            text: "Design an AI system that translates non-technical business requirement documents directly into executable architectural diagrams and OpenAPI specs.",
            author: "Enterprise AI Benchmark"
        },
        {
            text: "AI will not replace humans, but humans who leverage AI will replace those who do not.",
            author: "AI Innovation Guild"
        }
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
    const copyPromptBtn = document.getElementById('copyPromptBtn');
    const copyPromptText = document.getElementById('copyPromptText');
    
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    // Nav & Sections
    const sidebarNav = document.querySelector('.sidebar-nav');
    const ideaGeneratorSection = document.getElementById('ideaGeneratorSection');
    const newsSection = document.getElementById('newsSection');
    const radarSection = document.getElementById('radarSection');
    const bookmarkCountBadge = document.getElementById('bookmarkCount');
    const customFeedsList = document.getElementById('customFeedsList');
    
    const ideaCategoriesTabs = document.getElementById('ideaCategoriesTabs');
    const newsCategoriesTabs = document.getElementById('newsCategoriesTabs');
    const generateRandomIdeaBtn = document.getElementById('generateRandomIdeaBtn');
    
    const ideasGrid = document.getElementById('ideasGrid');
    const newsGrid = document.getElementById('newsGrid');
    const radarGrid = document.getElementById('radarGrid');
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshIndicator = document.querySelector('.refresh-indicator');
    
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
    const weatherWidget = document.getElementById('weatherWidget');

    // --- Initialization ---
    function init() {
        setTheme(appState.theme);
        updateGreetingAndDate();
        loadRandomInsight();
        loadBookmarksCount();
        renderCustomFeedsList();
        setupWeatherRadar();
        
        // Render initial sections
        appState.ideas = AI_IDEAS_DATABASE;
        renderIdeas();
        renderRadar();
        fetchNews();
    }

    // --- Theme Control ---
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('aip-theme', theme);
        appState.theme = theme;
        themeToggleText.textContent = theme === 'dark' ? 'Cyber Mode' : 'Light Mode';
    }

    themeToggleBtn.addEventListener('click', () => {
        setTheme(appState.theme === 'dark' ? 'light' : 'dark');
    });

    // --- Greeting & Time ---
    function updateGreetingAndDate() {
        const now = new Date();
        const hrs = now.getHours();
        let greet = 'AI Innovation Hub';
        if (hrs < 12) greet = 'Good Morning | AI Innovation Hub';
        else if (hrs < 17) greet = 'Good Afternoon | AI Innovation Hub';
        else greet = 'Good Evening | AI Innovation Hub';
        
        greetingText.textContent = greet;
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateText.textContent = `Today: ${now.toLocaleDateString('en-US', options)} | Artificial Intelligence Radar`;
    }

    // --- AI Insight Banner & Prompt Copy ---
    function loadRandomInsight() {
        if (appState.quoteDismissed) {
            quoteCard.style.display = 'none';
            return;
        }
        const index = Math.floor(Math.random() * AI_PROMPTS.length);
        const item = AI_PROMPTS[index];
        quoteText.textContent = `"${item.text}"`;
        quoteAuthor.textContent = `- ${item.author}`;
    }

    closeQuoteBtn.addEventListener('click', () => {
        quoteCard.style.display = 'none';
        appState.quoteDismissed = true;
        localStorage.setItem('aip-quote-dismissed', 'true');
    });

    copyPromptBtn.addEventListener('click', () => {
        const textToCopy = quoteText.textContent.replace(/^"|"$/g, '');
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyPromptText.textContent = 'Copied to Clipboard!';
            setTimeout(() => {
                copyPromptText.textContent = 'Copy Prompt';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    });

    // --- Weather & Tech Radar Widget ---
    function setupWeatherRadar() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => getWeatherData(pos.coords.latitude, pos.coords.longitude, 'Local Node'),
                () => getWeatherData(37.7749, -122.4194, 'Silicon Valley') // Fallback SF
            );
        } else {
            getWeatherData(37.7749, -122.4194, 'Silicon Valley');
        }
    }

    async function getWeatherData(lat, lon, locName) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            renderWeatherWidget(data.current_weather, locName);
        } catch {
            weatherWidget.innerHTML = `
                <div class="weather-info" style="text-align:center;">
                    <span style="font-size:0.75rem; color:var(--text-muted);">AI Radar Active | Node Connected</span>
                </div>
            `;
        }
    }

    function renderWeatherWidget(weather, locName) {
        weatherWidget.innerHTML = `
            <div class="weather-info">
                <div class="weather-top">
                    <span class="weather-temp">${Math.round(weather.temperature)}°C</span>
                    <span class="weather-desc" style="color:var(--accent-primary); font-weight:700;">AI Radar Active</span>
                </div>
                <div class="weather-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"></path></svg>
                    <span>${locName} | Online</span>
                </div>
            </div>
        `;
    }

    // --- AI Idea Generator Renderer ---
    function renderIdeas() {
        ideasGrid.innerHTML = '';
        
        let filtered = appState.ideas;
        if (appState.currentIdeaCategory !== 'all') {
            filtered = filtered.filter(item => item.category === appState.currentIdeaCategory);
        }

        if (appState.searchQuery) {
            const q = appState.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(q) || 
                item.subtitle.toLowerCase().includes(q) ||
                item.solution.toLowerCase().includes(q) ||
                item.techStack.some(t => t.toLowerCase().includes(q))
            );
        }

        if (filtered.length === 0) {
            ideasGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 48px; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                    <h3>No AI Ideas Match Filter</h3>
                    <p style="color: var(--text-secondary); margin-top: 6px;">Try selecting "All Domains" or clearing search terms.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(idea => {
            ideasGrid.appendChild(createIdeaCard(idea));
        });
    }

    function createIdeaCard(idea) {
        const isSaved = isItemBookmarked(idea.id);
        const card = document.createElement('div');
        card.className = 'idea-card';
        
        const tagsHtml = idea.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('');

        card.innerHTML = `
            <div class="idea-card-header">
                <span class="idea-domain-badge">${idea.category}</span>
                <span class="feasibility-score">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    ${idea.feasibility}
                </span>
            </div>
            <div>
                <h3 class="idea-title">${idea.title}</h3>
                <div class="idea-subtitle">${idea.subtitle}</div>
            </div>
            <div class="idea-block">
                <span class="idea-block-label">Problem</span>
                <p class="idea-block-text">${idea.problem}</p>
            </div>
            <div class="idea-block">
                <span class="idea-block-label">Proposed AI Solution</span>
                <p class="idea-block-text">${idea.solution}</p>
            </div>
            <div class="idea-block">
                <span class="idea-block-label">Recommended Tech Stack</span>
                <div class="tech-stack-tags">${tagsHtml}</div>
            </div>
            <div class="idea-card-footer">
                <span class="target-audience">Target: ${idea.targetAudience}</span>
                <button class="save-idea-btn ${isSaved ? 'active' : ''}" title="${isSaved ? 'Remove from Vault' : 'Save AI Idea'}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    <span>${isSaved ? 'Saved' : 'Save Idea'}</span>
                </button>
            </div>
        `;

        const bmkBtn = card.querySelector('.save-idea-btn');
        bmkBtn.addEventListener('click', () => {
            toggleBookmark({
                id: idea.id,
                title: idea.title,
                description: idea.solution,
                type: 'idea',
                category: idea.category
            }, bmkBtn);
        });

        return card;
    }

    generateRandomIdeaBtn.addEventListener('click', () => {
        appState.currentIdeaCategory = 'all';
        updateIdeaCategoryChips();
        renderIdeas();
        
        // Pick a card and add glowing effect
        const cards = ideasGrid.querySelectorAll('.idea-card');
        if (cards.length > 0) {
            const randomIndex = Math.floor(Math.random() * cards.length);
            const targetCard = cards[randomIndex];
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.style.boxShadow = '0 0 35px var(--accent-primary)';
            setTimeout(() => {
                targetCard.style.boxShadow = '';
            }, 2500);
        }
    });

    function updateIdeaCategoryChips() {
        const chips = ideaCategoriesTabs.querySelectorAll('.category-chip');
        chips.forEach(c => {
            c.classList.toggle('active', c.getAttribute('data-idea-cat') === appState.currentIdeaCategory);
        });
    }

    ideaCategoriesTabs.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        appState.currentIdeaCategory = chip.getAttribute('data-idea-cat');
        updateIdeaCategoryChips();
        renderIdeas();
    });

    // --- AI Models Radar Renderer ---
    function renderRadar() {
        radarGrid.innerHTML = '';
        AI_MODELS_RADAR.forEach(model => {
            const card = document.createElement('div');
            card.className = 'model-card';
            card.innerHTML = `
                <div class="model-card-top">
                    <span class="model-type-badge">${model.type}</span>
                    <span class="model-org">${model.org}</span>
                </div>
                <h3 class="model-name">${model.name}</h3>
                <p class="model-desc">${model.desc}</p>
                <div class="model-footer">
                    <span class="model-stat">${model.stat}</span>
                    <a href="${model.link}" target="_blank" rel="noopener noreferrer" class="model-link">Explore Model →</a>
                </div>
            `;
            radarGrid.appendChild(card);
        });
    }

    // --- RSS AI News Fetching ---
    async function fetchNews() {
        showNewsLoading();
        setSyncing(true);
        appState.articles = [];

        let feeds = DEFAULT_AI_FEEDS;
        if (appState.currentNewsCategory !== 'all') {
            feeds = feeds.filter(f => f.category === appState.currentNewsCategory);
        }

        const fetchPromises = feeds.map(f => fetchFeedXML(f));
        try {
            const results = await Promise.allSettled(fetchPromises);
            let collected = [];
            results.forEach(r => {
                if (r.status === 'fulfilled' && r.value) {
                    collected = [...collected, ...r.value];
                }
            });
            collected.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            appState.articles = collected;
        } catch {
            appState.articles = [];
        } finally {
            renderNews();
            setSyncing(false);
        }
    }

    async function fetchFeedXML(feed) {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`;
        try {
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error();
            const xmlText = await res.text();
            const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
            
            const items = xmlDoc.querySelectorAll('item');
            const result = [];
            const limit = Math.min(items.length, 10);
            
            for (let i = 0; i < limit; i++) {
                const item = items[i];
                const title = cleanText(item.querySelector('title')?.textContent || 'AI Breakthrough Update');
                const link = item.querySelector('link')?.textContent || '#';
                const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
                let rawDesc = item.querySelector('description')?.textContent || '';
                let description = cleanText(rawDesc.replace(/<[^>]*>/g, ''));
                if (description.length > 220) description = description.slice(0, 217) + '...';

                const image = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

                result.push({
                    id: link,
                    title,
                    description,
                    link,
                    pubDate,
                    source: feed.name,
                    category: feed.category,
                    image,
                    type: 'article'
                });
            }
            return result;
        } catch {
            return null;
        }
    }

    function cleanText(txt) {
        return txt.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
    }

    function showNewsLoading() {
        newsGrid.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const card = document.createElement('div');
            card.className = 'skeleton-card';
            card.innerHTML = `<div class="skeleton-image"></div><div class="skeleton-body"><div class="skeleton-line title-1"></div><div class="skeleton-line long"></div></div>`;
            newsGrid.appendChild(card);
        }
    }

    function setSyncing(isSync) {
        refreshIndicator.classList.toggle('syncing', isSync);
        refreshBtn.disabled = isSync;
    }

    function renderNews() {
        newsGrid.innerHTML = '';
        let list = appState.articles;

        if (appState.searchQuery) {
            const q = appState.searchQuery.toLowerCase();
            list = list.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
        }

        if (list.length === 0) {
            newsGrid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1; padding:48px; text-align:center; border:1px dashed var(--border-color); border-radius:var(--radius-md);">
                    <h3>No AI News Loaded</h3>
                    <p style="color:var(--text-secondary); margin-top:4px;">Click Sync RSS to refresh live AI feeds.</p>
                </div>
            `;
            return;
        }

        list.forEach(article => {
            const isBookmarked = isItemBookmarked(article.id);
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <div class="news-card-image">
                    <span class="card-category-badge">${article.category}</span>
                    <img src="${article.image}" alt="${article.title}" loading="lazy">
                </div>
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="news-card-source">${article.source}</span>
                    </div>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-excerpt">${article.description}</p>
                    <div class="news-card-footer">
                        <span class="read-more-text">Read Analysis →</span>
                        <button class="bookmark-btn ${isBookmarked ? 'active' : ''}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.bookmark-btn')) return;
                openReader(article);
            });

            const bmkBtn = card.querySelector('.bookmark-btn');
            bmkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBookmark(article, bmkBtn);
            });

            newsGrid.appendChild(card);
        });
    }

    refreshBtn.addEventListener('click', fetchNews);

    // --- Bookmarking (Local Storage) ---
    function loadBookmarksCount() {
        bookmarkCountBadge.textContent = appState.bookmarks.length;
    }

    function isItemBookmarked(id) {
        return appState.bookmarks.some(b => b.id === id);
    }

    function toggleBookmark(item, btnEl) {
        const exists = isItemBookmarked(item.id);
        if (exists) {
            appState.bookmarks = appState.bookmarks.filter(b => b.id !== item.id);
            if (btnEl) btnEl.classList.remove('active');
        } else {
            appState.bookmarks.push(item);
            if (btnEl) btnEl.classList.add('active');
        }
        localStorage.setItem('aip-bookmarks', JSON.stringify(appState.bookmarks));
        loadBookmarksCount();
        
        if (appState.currentTab === 'bookmarks') {
            renderBookmarksVault();
        }
    }

    function renderBookmarksVault() {
        ideasGrid.innerHTML = '';
        if (appState.bookmarks.length === 0) {
            ideasGrid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1; padding:48px; text-align:center; border:1px dashed var(--border-color); border-radius:var(--radius-md);">
                    <h3>Saved Vault Empty</h3>
                    <p style="color:var(--text-secondary); margin-top:6px;">Bookmark AI startup ideas and articles to view them here anytime.</p>
                </div>
            `;
            return;
        }

        appState.bookmarks.forEach(bmk => {
            const card = document.createElement('div');
            card.className = 'idea-card';
            card.innerHTML = `
                <div class="idea-card-header">
                    <span class="idea-domain-badge">${bmk.type === 'idea' ? 'AI Idea' : 'AI News'}</span>
                </div>
                <h3 class="idea-title">${bmk.title}</h3>
                <p class="idea-block-text" style="margin-top:8px;">${bmk.description}</p>
                <div class="idea-card-footer">
                    <button class="save-idea-btn active">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        <span>Remove</span>
                    </button>
                </div>
            `;

            card.querySelector('.save-idea-btn').addEventListener('click', () => {
                toggleBookmark(bmk, null);
            });
            ideasGrid.appendChild(card);
        });
    }

    // --- Reader Drawer Overlay ---
    function openReader(article) {
        readerContent.innerHTML = `
            <div class="reader-hero">
                <img src="${article.image}" alt="${article.title}">
                <div class="reader-hero-overlay"></div>
            </div>
            <div class="reader-body">
                <div class="reader-meta-row">
                    <span class="reader-source-badge">${article.source}</span>
                </div>
                <h2 class="reader-title">${article.title}</h2>
                <div class="reader-text">
                    <p>${article.description}</p>
                    <p style="margin-top:16px;">Read the complete research and full publication directly on the official portal below.</p>
                </div>
                <div class="reader-actions">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="reader-visit-btn">Read Full AI Article →</a>
                </div>
            </div>
        `;
        readerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeReader() {
        readerOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeDrawerBtn.addEventListener('click', closeReader);
    readerOverlay.addEventListener('click', (e) => { if (e.target === readerOverlay) closeReader(); });

    // --- Search Bar Handler ---
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value;
        clearSearchBtn.style.display = appState.searchQuery ? 'flex' : 'none';
        
        if (appState.currentTab === 'ideas') renderIdeas();
        else if (appState.currentTab === 'news') renderNews();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        appState.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        if (appState.currentTab === 'ideas') renderIdeas();
        else if (appState.currentTab === 'news') renderNews();
    });

    // --- Tab Switcher ---
    sidebarNav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item, .custom-feed-item');
        if (!item || e.target.closest('.delete-feed-btn')) return;
        
        const tab = item.getAttribute('data-tab');
        appState.currentTab = tab;
        
        // Update nav active classes
        sidebarNav.querySelectorAll('.nav-item, .custom-feed-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-tab') === tab);
        });

        // Hide all sections first
        ideaGeneratorSection.style.display = 'none';
        newsSection.style.display = 'none';
        radarSection.style.display = 'none';

        if (tab === 'ideas') {
            ideaGeneratorSection.style.display = 'flex';
            renderIdeas();
        } else if (tab === 'news') {
            newsSection.style.display = 'flex';
            renderNews();
        } else if (tab === 'radar') {
            radarSection.style.display = 'flex';
            renderRadar();
        } else if (tab === 'bookmarks') {
            ideaGeneratorSection.style.display = 'flex';
            renderBookmarksVault();
        }
    });

    // --- Custom RSS Feeds ---
    function renderCustomFeedsList() {
        customFeedsList.innerHTML = '';
        if (appState.customFeeds.length === 0) {
            customFeedsList.innerHTML = '<div class="no-feeds-msg">No custom AI feeds added yet.</div>';
            return;
        }

        appState.customFeeds.forEach(feed => {
            const feedDiv = document.createElement('div');
            feedDiv.className = `custom-feed-item ${appState.currentTab === `custom-${feed.id}` ? 'active' : ''}`;
            feedDiv.setAttribute('data-tab', `custom-${feed.id}`);
            feedDiv.innerHTML = `
                <span class="custom-feed-name" title="${feed.name}">${feed.name}</span>
                <button class="delete-feed-btn" title="Remove Feed">✕</button>
            `;

            feedDiv.querySelector('.delete-feed-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                appState.customFeeds = appState.customFeeds.filter(f => f.id !== feed.id);
                localStorage.setItem('aip-custom-feeds', JSON.stringify(appState.customFeeds));
                renderCustomFeedsList();
            });

            customFeedsList.appendChild(feedDiv);
        });
    }

    openAddFeedModal.addEventListener('click', () => {
        addFeedModal.classList.add('active');
        addFeedForm.reset();
        modalError.style.display = 'none';
    });

    function closeFeedModal() { addFeedModal.classList.remove('active'); }
    closeFeedModalBtn.addEventListener('click', closeFeedModal);
    cancelFeedBtn.addEventListener('click', closeFeedModal);
    addFeedModal.addEventListener('click', (e) => { if (e.target === addFeedModal) closeFeedModal(); });

    addFeedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('feedName').value.trim();
        const url = document.getElementById('feedUrl').value.trim();
        const category = document.getElementById('feedCategory').value;

        modalError.style.display = 'none';
        saveFeedBtn.classList.add('loading');

        try {
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error("Could not connect to XML feed.");
            const xmlText = await res.text();
            const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
            if (xmlDoc.querySelector('parsererror') || !xmlDoc.querySelector('channel')) {
                throw new Error("Invalid RSS structure.");
            }

            const newFeed = { id: String(Date.now()), name, url, category };
            appState.customFeeds.push(newFeed);
            localStorage.setItem('aip-custom-feeds', JSON.stringify(appState.customFeeds));
            renderCustomFeedsList();
            closeFeedModal();
        } catch (err) {
            modalError.textContent = err.message || "Failed to validate feed.";
            modalError.style.display = 'block';
        } finally {
            saveFeedBtn.classList.remove('loading');
        }
    });

    // Run Initialization
    init();
});
