// Configuration for API endpoint and key
const API_CONFIG = {
    endpoint: 'https://oxfcb18s01.execute-api.ap-southeast-1.amazonaws.com/', // Replace with actual API endpoint
    apiKey: 'tiYbk6fnENavq3qwqIM9U5yDHnkNkNnm6zX63OZL', // Replace with actual API key
    timeout: 10000 // 10 seconds timeout
};

// Helper function to make API requests
async function makeApiRequest(data) {
    try {
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            timeout: API_CONFIG.timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Enhanced fact checking function
function initializeFactChecker() {
    const analyzeButton = document.querySelector('button:has([data-feather="search"])');
    const textarea = document.querySelector('textarea');
    const resultsSection = document.getElementById('results-section');
    const statusBadge = resultsSection.querySelector('.truth-verified-bg');
    const resultText = resultsSection.querySelector('.text-green-600');
    const resultDescription = resultsSection.querySelector('.text-xl.text-gray-800');
    const credibilityMeter = resultsSection.querySelector('.bg-gradient-to-r');
    const credibilityScore = resultsSection.querySelector('.text-2xl.font-bold');
    const stars = resultsSection.querySelectorAll('[data-feather="star"]');
    const sourceList = resultsSection.querySelector('.space-y-4');

    analyzeButton.addEventListener('click', async function() {
        if (textarea.value.trim() === '') {
            // Add shake animation for empty input
            textarea.classList.add('animate-shake');
            setTimeout(() => textarea.classList.remove('animate-shake'), 500);
            return;
        }

        // Show loading state
        const originalHTML = this.innerHTML;
        this.innerHTML = `
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-4"></div>
                <span class="text-lg">AI Analysis in Progress...</span>
            </div>
        `;
        this.disabled = true;

        // Add particle effect during loading
        const particles = document.createElement('div');
        particles.className = 'absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl animate-pulse';
        this.appendChild(particles);

        try {
            // Make API call
            const response = await makeApiRequest({
                text: textarea.value.trim(),
                maxWords: 250
            });

            // Update UI with API response
            updateResultsUI(response);

            // Show results with animation
            resultsSection.classList.remove('hidden');
            setTimeout(() => {
                resultsSection.classList.add('scale-100', 'opacity-100');
                resultsSection.classList.remove('scale-95', 'opacity-0');
            }, 10);

            // Smooth scroll to results
            resultsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });

            // Add confetti effect
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'fixed inset-0 z-50 pointer-events-none';
                confetti.innerHTML = `
                    <div class="absolute top-0 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-confetti" style="animation-delay: 0.1s"></div>
                    <div class="absolute top-0 left-40% w-2 h-2 bg-green-400 rounded-full animate-confetti" style="animation-delay: 0.2s"></div>
                    <div class="absolute top-0 left-60% w-2 h-2 bg-blue-400 rounded-full animate-confetti" style="animation-delay: 0.3s"></div>
                `;
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, 500);

        } catch (error) {
            // Handle API error
            showErrorState(error.message);
        } finally {
            // Reset button
            this.innerHTML = originalHTML;
            this.disabled = false;
            particles.remove();
            feather.replace();
        }
    });

    function updateResultsUI(response) {
        // Update status badge
        const status = response.status || 'unknown';
        const statusClasses = {
            true: { bg: 'truth-verified-bg', text: 'truth-verified', label: '✅ Verified True', border: 'border-green-300/50' },
            misleading: { bg: 'misleading-warning-bg', text: 'misleading-warning', label: '⚠️ Misleading', border: 'border-yellow-300/50' },
            false: { bg: 'fake-danger-bg', text: 'fake-danger', label: '❌ False', border: 'border-red-300/50' },
            unknown: { bg: 'unknown-neutral-bg', text: 'unknown-neutral', label: '❓ Unknown', border: 'border-gray-300/50' }
        };

        const currentStatus = statusClasses[status] || statusClasses.unknown;
        statusBadge.className = `px-8 py-4 text-2xl font-bold border-4 ${currentStatus.border} shadow-professional transition-all duration-500 rounded-2xl flex items-center animate-bounce-in ${currentStatus.bg}`;
        statusBadge.querySelector('span').textContent = currentStatus.label;
        statusBadge.querySelector('[data-feather="shield"]').className = `mr-4 w-8 h-8 ${currentStatus.text}`;

        // Update result text
        resultText.textContent = currentStatus.label;
        resultText.className = `text-xl ${currentStatus.text} font-semibold`;
        resultDescription.innerHTML = `
            Our advanced AI has thoroughly analyzed your statement and cross-referenced it with 
            <span class="font-semibold text-blue-600">${response.sourceCount || 0} verified sources</span> for maximum accuracy.
        `;

        // Update credibility score
        const score = Math.min(Math.max(response.credibilityScore || 0, 0), 100);
        credibilityScore.textContent = `${score}%`;
        credibilityMeter.style.width = `${score}%`;
        
        const starCount = Math.round(score / 20);
        stars.forEach((star, index) => {
            star.className = `w-7 h-7 ${index < starCount ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'} animate-pulse`;
            star.style.animationDelay = `${0.1 * (index + 1)}s`;
        });

        // Update sources
        sourceList.innerHTML = '';
        (response.sources || []).forEach((source, index) => {
            const sourceElement = document.createElement('div');
            sourceElement.className = 'flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-elevated transition-all duration-500 cursor-pointer hover:-translate-y-2 border border-gray-200/20 group transform-gpu';
            sourceElement.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-${['blue', 'red', 'green'][index % 3]}-500 to-${['purple', 'orange', 'teal'][index % 3]}-500 rounded-xl flex items-center justify-center shadow-professional">
                        <span class="text-white font-bold">${source.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <span class="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">${source.name}</span>
                </div>
                <i data-feather="external-link" class="text-blue-500 w-6 h-6 group-hover:scale-125 transition-transform"></i>
            `;
            sourceList.appendChild(sourceElement);
        });

        feather.replace();
    }

    function showErrorState(message) {
        resultsSection.classList.remove('hidden');
        resultsSection.classList.add('scale-100', 'opacity-100');
        resultsSection.classList.remove('scale-95', 'opacity-0');

        statusBadge.className = 'px-8 py-4 text-2xl font-bold border-4 border-red-300/50 shadow-professional transition-all duration-500 rounded-2xl flex items-center animate-bounce-in fake-danger-bg';
        statusBadge.querySelector('span').textContent = '❌ Analysis Failed';
        statusBadge.querySelector('[data-feather="shield"]').className = 'mr-4 w-8 h-8 fake-danger';

        resultText.textContent = 'Analysis Failed';
        resultText.className = 'text-xl fake-danger font-semibold';
        resultDescription.textContent = `An error occurred: ${message}. Please try again or contact support.`;

        credibilityScore.textContent = '0%';
        credibilityMeter.style.width = '0%';
        stars.forEach(star => {
            star.className = 'w-7 h-7 fill-gray-300 text-gray-300';
        });

        sourceList.innerHTML = '';
        feather.replace();

        resultsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeFactChecker();
    AOS.init({
        duration: 1200,
        once: true,
        easing: 'ease-out-cubic'
    });
    feather.replace();
    
    // Mobile menu functionality
    function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('mobile-menu');
        const menuButton = document.querySelector('[onclick="toggleMobileMenu()"]');
        
        if (!menu.contains(event.target) && !menuButton.contains(event.target) && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    });

    // Initialize particle background
    initParticles();
});

// Particle background initialization
function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.className = 'absolute inset-0 z-0';
    document.querySelector('#particle-canvas').replaceWith(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 0.5,
            direction: Math.random() * 360,
            color: `hsla(${Math.random() * 360}, 70%, 60%, ${Math.random() * 0.3})`
        });
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
            
            particle.x += Math.cos(particle.direction) * particle.speed;
            particle.y += Math.sin(particle.direction) * particle.speed;
            
            if (particle.x < 0 || particle.x > canvas.width || 
                particle.y < 0 || particle.y > canvas.height) {
                particle.x = Math.random() * canvas.width;
                particle.y = Math.random() * canvas.height;
            }
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}
