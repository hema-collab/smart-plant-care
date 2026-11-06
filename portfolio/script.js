/* =============================================
   HEMA SRI — PORTFOLIO SCRIPTS
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ===== TYPEWRITER EFFECT =====
    const typewriterEl = document.getElementById('typewriter');
    const phrases = [
        'Full-Stack Web Developer',
        'React.js Enthusiast',
        'Node.js Developer',
        'Problem Solver',
        'UI/UX Lover'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 80;

    function typewrite() {
        const current = phrases[phraseIndex];

        if (isDeleting) {
            typewriterEl.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 40;
        } else {
            typewriterEl.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 80;
        }

        if (!isDeleting && charIndex === current.length) {
            typeSpeed = 2000; // pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // pause before new phrase
        }

        setTimeout(typewrite, typeSpeed);
    }

    typewrite();

    // ===== NAVBAR SCROLL =====
    const navbar = document.getElementById('navbar');

    function handleNavScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavScroll);

    // ===== MOBILE MENU =====
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // ===== ACTIVE NAV LINK ON SCROLL =====
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);

    // ===== BACK TO TOP =====
    const backToTop = document.getElementById('back-to-top');

    function handleBackToTop() {
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', handleBackToTop);

    // ===== SCROLL REVEAL (Custom AOS) =====
    function revealOnScroll() {
        const elements = document.querySelectorAll('[data-aos]');
        const windowHeight = window.innerHeight;

        elements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const delay = el.getAttribute('data-aos-delay') || 0;

            if (elementTop < windowHeight - 80) {
                setTimeout(() => {
                    el.classList.add('aos-animate');
                }, parseInt(delay));
            }
        });
    }

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // trigger on load

    // ===== SKILL BARS ANIMATION =====
    function animateSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach(bar => {
            const barTop = bar.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (barTop < windowHeight - 50 && bar.style.width === '0px' || bar.style.width === '') {
                const width = bar.getAttribute('data-width');
                bar.style.width = width + '%';
            }
        });
    }

    window.addEventListener('scroll', animateSkillBars);

    // ===== STAT COUNTER ANIMATION =====
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const counterTop = counter.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (counterTop < windowHeight - 50 && !counter.classList.contains('counted')) {
                counter.classList.add('counted');
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 1500;
                const start = performance.now();

                function updateCounter(timestamp) {
                    const elapsed = timestamp - start;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    counter.textContent = Math.floor(eased * target);

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                }

                requestAnimationFrame(updateCounter);
            }
        });
    }

    window.addEventListener('scroll', animateCounters);

    // ===== CONTACT FORM =====
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;

        // Simulate submission
        btnText.textContent = 'Sending...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        setTimeout(() => {
            formStatus.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
            formStatus.className = 'form-status success';
            btnText.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            contactForm.reset();

            setTimeout(() => {
                formStatus.textContent = '';
                formStatus.className = 'form-status';
            }, 5000);
        }, 1500);
    });

    // ===== SMOOTH SCROLL FOR ALL ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== PARALLAX EFFECT ON HERO SHAPES =====
    const shapes = document.querySelectorAll('.shape');

    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 15;
            shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });

});
