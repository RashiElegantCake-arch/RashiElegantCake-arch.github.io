
/* ==========================================
   RASHI ELEGANT CAKE — ANIMATION CONTROLLER
   Does not replace existing website functions
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const hero = document.querySelector("#home");

    // 1. Create falling petals and a limited number of sparkles
    if (hero && !hero.querySelector(".hero-petal-layer")) {
        const petalLayer = document.createElement("div");
        petalLayer.className = "hero-petal-layer";
        petalLayer.setAttribute("aria-hidden", "true");

        const sparkleLayer = document.createElement("div");
        sparkleLayer.className = "hero-sparkle-layer";
        sparkleLayer.setAttribute("aria-hidden", "true");

        // A small number of petals for better mobile performance
        for (let i = 0; i < 9; i++) {
            const petal = document.createElement("span");
            petal.className = "hero-petal";

            petal.style.setProperty("--petal-left", `${5 + i * 11}%`);
            petal.style.setProperty(
                "--petal-duration",
                `${7 + (i % 4) * 1.5}s`
            );
            petal.style.setProperty("--petal-delay", `${i * -1.3}s`);
            petal.style.setProperty(
                "--petal-drift",
                `${(i % 2 === 0 ? 1 : -1) * (20 + i * 3)}px`
            );

            petalLayer.appendChild(petal);
        }

        // Only six gentle golden sparkles
        for (let i = 0; i < 6; i++) {
            const sparkle = document.createElement("span");
            sparkle.className = "hero-sparkle";
            sparkle.textContent = "✦";

            sparkle.style.setProperty(
                "--sparkle-left",
                `${12 + ((i * 17) % 76)}%`
            );
            sparkle.style.setProperty(
                "--sparkle-top",
                `${15 + ((i * 13) % 65)}%`
            );
            sparkle.style.setProperty(
                "--sparkle-size",
                `${10 + (i % 3) * 4}px`
            );
            sparkle.style.setProperty(
                "--sparkle-duration",
                `${2.5 + (i % 3) * 0.7}s`
            );
            sparkle.style.setProperty("--sparkle-delay", `${i * 0.45}s`);

            sparkleLayer.appendChild(sparkle);
        }

        hero.prepend(petalLayer);
        hero.appendChild(sparkleLayer);
    }

    // 2. Reveal Welcome, About and Contact sections on scroll
    const revealSelectors = [
        "#welcome",
        ".welcome-section",
        "#about",
        ".about-section",
        "#contact",
        ".contact-section"
    ];

    const revealSections = [
        ...new Set(
            revealSelectors.flatMap(selector =>
                Array.from(document.querySelectorAll(selector))
            )
        )
    ];

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        revealSections.forEach(section => {
            section.classList.add("romantic-reveal");
            revealObserver.observe(section);
        });
    } else {
        revealSections.forEach(section => {
            section.classList.add("is-visible");
        });
    }

    // 3. Gentle hover animation is controlled by style.css.
    // 4. Add glow only to buttons/links clearly related to ordering.
    document.querySelectorAll(
        "button, a, input[type='submit']"
    ).forEach(element => {
        const text = (
            element.innerText ||
            element.value ||
            element.getAttribute("aria-label") ||
            ""
        ).toLowerCase();

        const isOrderButton =
            /order|send order|custom cake|place order|දැන් ඇණවුම්/.test(text) ||
            element.matches(
                "#customRequestSubmit, [data-open-custom-cake]"
            );

       
        if (isOrderButton) {
            element.classList.add("romantic-order-glow");
        }
    });

    // 5. CONTINUOUS CUPCAKE RAIN 🍰
const rain = document.querySelector("#home .cupcake-rain");

    if (rain && !rain.dataset.continuousRain) {
        rain.dataset.continuousRain = "true";
        rain.replaceChildren();

        const cupcakeCount = window.innerWidth <= 600 ? 12 : 20;
        const cupcakes = ["🧁", "🧁", "🧁", "🍰"];

        for (let i = 0; i < cupcakeCount; i++) {
            const cupcake = document.createElement("span");

            cupcake.textContent = cupcakes[i % cupcakes.length];

            cupcake.style.setProperty(
                "--cupcake-left",
                `${(i * 37 + 7) % 100}%`
            );
            cupcake.style.setProperty(
                "--cupcake-size",
                `${20 + (i % 3) * 6}px`
            );
            cupcake.style.setProperty(
                "--cupcake-duration",
                `${6 + (i % 5) * 1.4}s`
            );
            cupcake.style.setProperty(
                "--cupcake-delay",
                `${-(i * 1.1)}s`
            );
            cupcake.style.setProperty(
                "--cupcake-drift",
                `${i % 2 === 0 ? 35 : -35}px`
            );

            rain.appendChild(cupcake);
        }
    }
});

});
