<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Glimpse - Your Daily Five</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary-fixed-variant": "#474747",
                      "tertiary": "#c7c6c6",
                      "surface-dim": "#131313",
                      "secondary-fixed-dim": "#c8c6c6",
                      "on-primary-fixed-variant": "#930007",
                      "on-error": "#690005",
                      "on-tertiary-container": "#f9f8f8",
                      "on-primary": "#690003",
                      "inverse-surface": "#e5e2e1",
                      "tertiary-container": "#727272",
                      "primary-fixed-dim": "#ffb4aa",
                      "on-background": "#e5e2e1",
                      "surface-tint": "#ffb4aa",
                      "primary": "#ffb4aa",
                      "on-primary-fixed": "#410001",
                      "error": "#ffb4ab",
                      "secondary": "#c8c6c6",
                      "outline": "#af8782",
                      "on-secondary": "#303030",
                      "on-secondary-fixed": "#1b1c1c",
                      "primary-fixed": "#ffdad5",
                      "surface-container-lowest": "#0e0e0e",
                      "on-tertiary-fixed-variant": "#464747",
                      "surface-bright": "#393939",
                      "background": "#131313",
                      "on-secondary-container": "#b6b5b4",
                      "secondary-container": "#474747",
                      "inverse-on-surface": "#313030",
                      "error-container": "#93000a",
                      "on-error-container": "#ffdad6",
                      "surface-container-highest": "#353534",
                      "primary-container": "#e50914",
                      "surface": "#131313",
                      "outline-variant": "#5e3f3b",
                      "tertiary-fixed": "#e3e2e2",
                      "surface-variant": "#353534",
                      "surface-container-high": "#2a2a2a",
                      "on-tertiary": "#2f3131",
                      "tertiary-fixed-dim": "#c7c6c6",
                      "on-surface-variant": "#e9bcb6",
                      "surface-container": "#201f1f",
                      "on-surface": "#e5e2e1",
                      "on-tertiary-fixed": "#1a1c1c",
                      "on-primary-container": "#fff7f6",
                      "surface-container-low": "#1c1b1b",
                      "inverse-primary": "#c0000c",
                      "secondary-fixed": "#e4e2e1"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "margin-desktop": "64px",
                      "unit": "4px",
                      "stack-lg": "48px",
                      "margin-mobile": "20px",
                      "stack-sm": "8px",
                      "gutter": "16px",
                      "stack-md": "24px"
              },
              "fontFamily": {
                      "headline-lg-mobile": [
                              "Inter", "sans-serif"
                      ],
                      "display-mystery": [
                              "Playfair Display", "serif"
                      ],
                      "body-md": [
                              "Inter", "sans-serif"
                      ],
                      "tagline-italic": [
                              "Playfair Display", "serif"
                      ],
                      "label-caps": [
                              "Inter", "sans-serif"
                      ],
                      "headline-lg": [
                              "Inter", "sans-serif"
                      ]
              },
              "fontSize": {
                      "headline-lg-mobile": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "700"
                              }
                      ],
                      "display-mystery": [
                              "40px",
                              {
                                      "lineHeight": "1.2",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "tagline-italic": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "400",
                                      "fontStyle": "italic"
                              }
                      ],
                      "label-caps": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "letterSpacing": "0.1em",
                                      "fontWeight": "600",
                                      "textTransform": "uppercase"
                              }
                      ],
                      "headline-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ]
              }
      },
          },
        }
    </script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;family=Playfair+Display:ital,wght@0,700;1,400&amp;display=swap" rel="stylesheet"/>
<style>
        body {
            background-color: #141414; /* Level 0 Base */
            overflow: hidden;
            min-height: max(884px, 100dvh);
        }

        .card-container {
            position: relative;
            height: 50vh;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            align-items: center;
            perspective: 1200px; /* 3D perspective */
        }

        .coverflow-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            transform-style: preserve-3d;
        }

        .mystery-card {
            background-color: #1C1C1C; /* Level 1 Sealed Cards */
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 10px 30px -5px rgba(0,0,0,0.8); /* Inner border and soft inner shadow for envelope look */
            transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s ease, filter 0.6s ease;
            position: absolute;
            top: 50%;
            left: 50%;
            margin-top: -112px; /* Half of height (224px) */
            margin-left: -80px; /* Half of width (160px) */
            overflow: hidden;
            transform-origin: center center;
        }

        .mystery-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at center, rgba(229, 9, 20, 0.15) 0%, transparent 60%);
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
            z-index: 1;
        }

        .mystery-card:hover:not(.expanded) {
            box-shadow: inset 0 0 0 1px rgba(229, 9, 20, 0.5), 0 30px 60px -10px rgba(0, 0, 0, 0.9);
            cursor: pointer;
        }

        .mystery-card:hover::before {
            opacity: 1; /* Glow behind element */
        }

        /* Coverflow States - applied via JS classes */
        .card-state-0 {
            transform: translateZ(0) translateX(0);
            z-index: 5;
            opacity: 1;
            filter: blur(0px);
        }
        .card-state-1 {
            transform: translateZ(-100px) translateX(120px) rotateY(-20deg);
            z-index: 4;
            opacity: 0.8;
            filter: blur(0px);
        }
        .card-state-2 {
            transform: translateZ(-200px) translateX(200px) rotateY(-30deg);
            z-index: 3;
            opacity: 0.5;
            filter: blur(1px);
        }
        .card-state-3 {
            transform: translateZ(-200px) translateX(-200px) rotateY(30deg);
            z-index: 3;
            opacity: 0.5;
            filter: blur(1px);
        }
        .card-state-4 {
            transform: translateZ(-100px) translateX(-120px) rotateY(20deg);
            z-index: 4;
            opacity: 0.8;
            filter: blur(0px);
        }

        .progress-indicator {
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background-color: #E50914; /* Red accent */
            width: 0%;
            z-index: 100;
            transition: width 0.3s ease;
        }

        /* Expanded State */
        .mystery-card.expanded {
            width: 300px !important;
            height: 420px !important;
            margin-left: -150px !important;
            margin-top: -210px !important;
            z-index: 100 !important;
            transform: translateZ(100px) translateX(0) rotateY(0deg) !important;
            box-shadow: inset 0 0 0 1px rgba(229, 9, 20, 0.5), 0 0 80px -10px rgba(229, 9, 20, 0.4), 0 30px 60px -10px rgba(0, 0, 0, 0.9);
            filter: blur(0) !important;
            opacity: 1 !important;
        }

        .mystery-card.expanded .card-content-hidden {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        .card-content-hidden {
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px);
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
        }

        .tagline-text {
            font-size: 16px;
            line-height: 1.4;
        }

        @media (min-width: 768px) {
            .tagline-text {
                font-size: 20px;
            }
            .card-container { height: 60vh; }

            .card-state-1 { transform: translateZ(-150px) translateX(180px) rotateY(-25deg); }
            .card-state-2 { transform: translateZ(-300px) translateX(300px) rotateY(-35deg); }
            .card-state-3 { transform: translateZ(-300px) translateX(-300px) rotateY(35deg); }
            .card-state-4 { transform: translateZ(-150px) translateX(-180px) rotateY(25deg); }
        }

        /* Overlay for expanded state */
        .overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px);
            z-index: 40;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
        }
        .overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Tap to Inspect Indicator */
        .tap-to-inspect {
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        .card-state-0 .tap-to-inspect {
            opacity: 1;
        }
        .mystery-card.expanded .tap-to-inspect {
            opacity: 0;
        }
        .mystery-card.expanded .large-number {
            opacity: 0;
        }
    </style>

</head>
<body class="text-on-background min-h-screen flex flex-col font-body-md antialiased overflow-hidden selection:bg-primary-container selection:text-white">
<!-- Progress Indicator -->
<div class="progress-indicator" id="progress-bar"></div>
<!-- Overlay for focus state -->
<div class="overlay" id="focus-overlay"></div>
<!-- TopAppBar (From JSON) -->
<header class="bg-surface/80 backdrop-blur-md dark:bg-surface/80 font-headline-lg text-headline-lg-mobile md:text-headline-lg docked full-width top-0 bg-surface dark:bg-surface flat no shadows flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 fixed top-0 z-40 transition-colors duration-300">
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center overflow-hidden hover:shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-shadow cursor-pointer relative group">
<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="A moody, high-contrast digital painting of a mysterious figure in silhouette against a deep crimson and black background. The style is cinematic and minimalistic, emphasizing shadow and subtle red highlights. A highly stylized profile avatar for a premium user interface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVy-Lgrp3GFTjlLj3iUrRpACRl4f7bfbt5pJmDISiy_2T4X13SXsIC9jScqrTe6jOFGNb10-imsYTxFB_1ABwiHVEMbb-5mNwWqh8YP8A49nldelc9I7DzkpwPIf7fMN8SJ94e040LjYooutePp17BpSbdck7sc4YHV1wDiptuJuc5QqZQQsbDspB5qVwR4DEyA-8VxDmh6rtBVSXxoFC7Tbm_8Wno7pCNEVP4l1KfxAbVl2zZwRSS"/>
<div class="absolute inset-0 bg-primary-container/10 mix-blend-overlay"></div>
</div>
</div>
<div class="font-display-mystery text-display-mystery text-primary-container dark:text-primary-container tracking-tighter">
            GLIMPSE
        </div>
<button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface hover:text-primary-container group">
<span class="material-symbols-outlined transition-transform group-hover:scale-110 group-active:scale-95" style="font-variation-settings: 'FILL' 0, 'wght' 200;">notifications</span>
</button>
</header>
<!-- Main Content Canvas -->
<main class="flex-grow flex flex-col justify-center items-center pt-24 pb-32 px-margin-mobile md:px-margin-desktop relative z-10 w-full max-w-7xl mx-auto h-screen">
<div class="text-center mb-4 md:mb-8 animate-fade-in-up mt-4 z-10">
<h1 class="font-display-mystery text-2xl md:text-4xl text-on-surface mb-2 tracking-tighter">Your Daily Five</h1>
<p class="font-body-md text-sm md:text-base text-on-surface-variant max-w-md mx-auto opacity-80">Five sealed envelopes. Five unknown stories. Break the seal to discover what awaits in the dark.</p>
</div>
<!-- The 5 Sealed Cards Grid - 3D Coverflow Layout -->
<div class="card-container" id="card-container">
<div class="coverflow-wrapper" id="coverflow-wrapper">
<!-- Card 1 -->
<div class="mystery-card card-state-0 rounded-xl p-4 md:p-6 flex flex-col justify-between items-center text-center cursor-pointer w-40 h-56 group border border-outline-variant/50 shadow-2xl" data-index="0">
<div class="w-full flex justify-between items-start z-10">
<span class="material-symbols-outlined text-primary-container/80 transition-colors" style="font-variation-settings: 'FILL' 1, 'wght' 400;">movie</span>
<span class="material-symbols-outlined text-on-surface-variant/40" style="font-variation-settings: 'FILL' 0, 'wght' 200;">lock</span>
</div>
<div class="flex-grow flex flex-col justify-center items-center z-10 w-full mt-4 card-content-hidden">
<p class="font-tagline-italic tagline-text text-white transition-colors duration-300">
                            "A silent vow. A city in ruins. One last chance."
                        </p>
</div>
<div class="mt-auto flex flex-col items-center w-full z-10 gap-stack-sm card-content-hidden">
<button class="bg-primary-container text-white font-label-caps text-[10px] md:text-xs px-4 py-3 w-full rounded-md hover:bg-[#ff0f1b] uppercase tracking-widest shadow-[0_0_20px_rgba(229,9,20,0.6)] reveal-btn transition-all">
                            Reveal Movie
                        </button>
</div>
<div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 large-number z-0">
<span class="font-display-mystery text-6xl text-primary-container opacity-80">1</span>
</div>
<div class="tap-to-inspect absolute bottom-6 left-0 right-0 text-center z-10">
<span class="text-[10px] uppercase tracking-[0.2em] text-primary-container/90 animate-pulse font-semibold">Tap to Inspect</span>
</div>
</div>
<!-- Card 2 -->
<div class="mystery-card card-state-1 rounded-xl p-4 md:p-6 flex flex-col justify-between items-center text-center cursor-pointer w-40 h-56 group border border-outline-variant/50 shadow-2xl" data-index="1">
<div class="w-full flex justify-between items-start z-10">
<span class="material-symbols-outlined text-primary-container/80 transition-colors" style="font-variation-settings: 'FILL' 1, 'wght' 400;">movie</span>
<span class="material-symbols-outlined text-on-surface-variant/40" style="font-variation-settings: 'FILL' 0, 'wght' 200;">lock</span>
</div>
<div class="flex-grow flex flex-col justify-center items-center z-10 w-full mt-4 card-content-hidden">
<p class="font-tagline-italic tagline-text text-white transition-colors duration-300">
                            "Sometimes the past is better left buried."
                        </p>
</div>
<div class="mt-auto flex flex-col items-center w-full z-10 gap-stack-sm card-content-hidden">
<button class="bg-primary-container text-white font-label-caps text-[10px] md:text-xs px-4 py-3 w-full rounded-md hover:bg-[#ff0f1b] uppercase tracking-widest shadow-[0_0_20px_rgba(229,9,20,0.6)] reveal-btn transition-all">
                            Reveal Movie
                        </button>
</div>
<div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 large-number z-0">
<span class="font-display-mystery text-6xl text-primary-container opacity-80">2</span>
</div>
<div class="tap-to-inspect absolute bottom-6 left-0 right-0 text-center z-10">
<span class="text-[10px] uppercase tracking-[0.2em] text-primary-container/90 animate-pulse font-semibold">Tap to Inspect</span>
</div>
</div>
<!-- Card 3 -->
<div class="mystery-card card-state-2 rounded-xl p-4 md:p-6 flex flex-col justify-between items-center text-center cursor-pointer w-40 h-56 group border border-outline-variant/50 shadow-2xl" data-index="2">
<div class="w-full flex justify-between items-start z-10">
<span class="material-symbols-outlined text-primary-container/80 transition-colors" style="font-variation-settings: 'FILL' 1, 'wght' 400;">movie</span>
<span class="material-symbols-outlined text-on-surface-variant/40" style="font-variation-settings: 'FILL' 0, 'wght' 200;">lock</span>
</div>
<div class="flex-grow flex flex-col justify-center items-center z-10 w-full mt-4 card-content-hidden">
<p class="font-tagline-italic tagline-text text-white transition-colors duration-300">
                            "Two strangers, one train, infinite possibilities."
                        </p>
</div>
<div class="mt-auto flex flex-col items-center w-full z-10 gap-stack-sm card-content-hidden">
<button class="bg-primary-container text-white font-label-caps text-[10px] md:text-xs px-4 py-3 w-full rounded-md hover:bg-[#ff0f1b] uppercase tracking-widest shadow-[0_0_20px_rgba(229,9,20,0.6)] reveal-btn transition-all">
                            Reveal Movie
                        </button>
</div>
<div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 large-number z-0">
<span class="font-display-mystery text-6xl text-primary-container opacity-80">3</span>
</div>
<div class="tap-to-inspect absolute bottom-6 left-0 right-0 text-center z-10">
<span class="text-[10px] uppercase tracking-[0.2em] text-primary-container/90 animate-pulse font-semibold">Tap to Inspect</span>
</div>
</div>
<!-- Card 4 -->
<div class="mystery-card card-state-3 rounded-xl p-4 md:p-6 flex flex-col justify-between items-center text-center cursor-pointer w-40 h-56 group border border-outline-variant/50 shadow-2xl" data-index="3">
<div class="w-full flex justify-between items-start z-10">
<span class="material-symbols-outlined text-primary-container/80 transition-colors" style="font-variation-settings: 'FILL' 1, 'wght' 400;">movie</span>
<span class="material-symbols-outlined text-on-surface-variant/40" style="font-variation-settings: 'FILL' 0, 'wght' 200;">lock</span>
</div>
<div class="flex-grow flex flex-col justify-center items-center z-10 w-full mt-4 card-content-hidden">
<p class="font-tagline-italic tagline-text text-white transition-colors duration-300">
                            "In the void of space, silence is the loudest scream."
                        </p>
</div>
<div class="mt-auto flex flex-col items-center w-full z-10 gap-stack-sm card-content-hidden">
<button class="bg-primary-container text-white font-label-caps text-[10px] md:text-xs px-4 py-3 w-full rounded-md hover:bg-[#ff0f1b] uppercase tracking-widest shadow-[0_0_20px_rgba(229,9,20,0.6)] reveal-btn transition-all">
                            Reveal Movie
                        </button>
</div>
<div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 large-number z-0">
<span class="font-display-mystery text-6xl text-primary-container opacity-80">4</span>
</div>
<div class="tap-to-inspect absolute bottom-6 left-0 right-0 text-center z-10">
<span class="text-[10px] uppercase tracking-[0.2em] text-primary-container/90 animate-pulse font-semibold">Tap to Inspect</span>
</div>
</div>
<!-- Card 5 -->
<div class="mystery-card card-state-4 rounded-xl p-4 md:p-6 flex flex-col justify-between items-center text-center cursor-pointer w-40 h-56 group border border-outline-variant/50 shadow-2xl" data-index="4">
<div class="w-full flex justify-between items-start z-10">
<span class="material-symbols-outlined text-primary-container/80 transition-colors" style="font-variation-settings: 'FILL' 1, 'wght' 400;">movie</span>
<span class="material-symbols-outlined text-on-surface-variant/40" style="font-variation-settings: 'FILL' 0, 'wght' 200;">lock</span>
</div>
<div class="flex-grow flex flex-col justify-center items-center z-10 w-full mt-4 card-content-hidden">
<p class="font-tagline-italic tagline-text text-white transition-colors duration-300">
                            "The heist of the century wasn't about money."
                        </p>
</div>
<div class="mt-auto flex flex-col items-center w-full z-10 gap-stack-sm card-content-hidden">
<button class="bg-primary-container text-white font-label-caps text-[10px] md:text-xs px-4 py-3 w-full rounded-md hover:bg-[#ff0f1b] uppercase tracking-widest shadow-[0_0_20px_rgba(229,9,20,0.6)] reveal-btn transition-all">
                            Reveal Movie
                        </button>
</div>
<div class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 large-number z-0">
<span class="font-display-mystery text-6xl text-primary-container opacity-80">5</span>
</div>
<div class="tap-to-inspect absolute bottom-6 left-0 right-0 text-center z-10">
<span class="text-[10px] uppercase tracking-[0.2em] text-primary-container/90 animate-pulse font-semibold">Tap to Inspect</span>
</div>
</div>
</div>
</div>
<div class="mt-8 z-10 flex flex-col items-center gap-2 pb-16">
<button class="flex items-center gap-2 px-6 py-3 rounded-full border border-primary-container text-primary-container hover:bg-primary-container/10 transition-colors group">
<span class="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500" style="font-variation-settings: 'FILL' 0, 'wght' 300;">sync</span>
<span class="font-label-caps tracking-widest">Sync Selection</span>
</button>
<p class="text-xs text-on-surface-variant/60 font-body-md">3 syncs remaining today</p>
</div>
</main>
<!-- BottomNavBar (From JSON) -->
<!-- Displayed on mobile, hidden on desktop according to standard app patterns -->
<nav class="md:hidden bg-surface-dim/90 dark:bg-surface-dim/90 backdrop-blur-md text-primary-container dark:text-primary-container font-label-caps text-label-caps font-display-mystery text-primary-container docked full-width bottom-0 rounded-t-xl flat no shadows fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-8 pt-4 border-t border-outline-variant/30">
<!-- Tab 1: Explore (Active) -->
<a class="flex flex-col items-center justify-center text-primary-container dark:text-primary-container scale-110 Active: scale-90 transition-all duration-300" href="#">
<span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1, 'wght' 400;">home_max</span>
<span class="text-[10px]">Explore</span>
</a>
<!-- Tab 2: Collections -->
<a class="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container hover:text-primary dark:hover:text-primary transition-colors" href="#">
<span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 0, 'wght' 400;">auto_awesome_motion</span>
<span class="text-[10px]">Vault</span>
</a>
<!-- Tab 3: Settings -->
<a class="flex flex-col items-center justify-center text-on-secondary-container dark:text-on-secondary-container hover:text-primary dark:hover:text-primary transition-colors" href="#">
<span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 0, 'wght' 400;">settings</span>
<span class="text-[10px]">Settings</span>
</a>
</nav>
<script>
        document.addEventListener('DOMContentLoaded', () => {
            const progressBar = document.getElementById('progress-bar');
            setTimeout(() => {
                progressBar.style.width = '100%';
                setTimeout(() => {
                    progressBar.style.opacity = '0';
                }, 500);
            }, 100);

            const cards = Array.from(document.querySelectorAll('.mystery-card'));
            const wrapper = document.getElementById('coverflow-wrapper');
            const overlay = document.getElementById('focus-overlay');

            let currentIndex = 0;
            let autoRotateInterval;
            let expandedCard = null;

            function updateCarousel() {
                cards.forEach((card, index) => {
                    // Reset classes
                    card.classList.remove('card-state-0', 'card-state-1', 'card-state-2', 'card-state-3', 'card-state-4');

                    // Calculate relative position (0 is center, 1 is right, -1 is left, etc.)
                    let relativeIndex = (index - currentIndex + cards.length) % cards.length;

                    // Map relative index to state class
                    card.classList.add(`card-state-${relativeIndex}`);
                });
            }

            function nextCard() {
                if(!expandedCard) {
                    currentIndex = (currentIndex + 1) % cards.length;
                    updateCarousel();
                }
            }

            function startAutoRotate() {
                autoRotateInterval = setInterval(nextCard, 4000);
            }

            function stopAutoRotate() {
                clearInterval(autoRotateInterval);
            }

            // Initial setup
            updateCarousel();
            startAutoRotate();

            function closeExpandedCard() {
                if (expandedCard) {
                    expandedCard.classList.remove('expanded');
                    overlay.classList.remove('active');
                    expandedCard = null;
                    startAutoRotate();
                }
            }

            cards.forEach((card, index) => {
                card.addEventListener('click', (e) => {
                    if (card.classList.contains('expanded')) return;

                    if(card.classList.contains('card-state-0')) {
                        // Expand if it's the center card
                        stopAutoRotate();
                        expandedCard = card;
                        card.classList.add('expanded');
                        overlay.classList.add('active');
                    } else {
                        // Rotate to this card if it's on the side
                        stopAutoRotate();
                        currentIndex = index;
                        updateCarousel();
                        // Resume rotation after a short delay
                        setTimeout(startAutoRotate, 6000);
                    }
                });

                // Reveal logic
                const revealBtn = card.querySelector('.reveal-btn');
                if(revealBtn) {
                    revealBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        revealBtn.textContent = 'Unsealed...';
                        revealBtn.classList.add('animate-pulse');
                        setTimeout(() => {
                            revealBtn.textContent = 'Unlocked';
                            revealBtn.classList.replace('bg-primary-container', 'bg-surface-variant');
                            revealBtn.classList.replace('text-white', 'text-on-surface-variant');
                            revealBtn.classList.replace('shadow-[0_0_20px_rgba(229,9,20,0.6)]', 'shadow-none');
                            revealBtn.classList.remove('animate-pulse');
                            revealBtn.parentElement.previousElementSibling.querySelector('p').classList.add('text-primary-container');
                        }, 800);
                    });
                }
            });

            // Close on overlay click
            overlay.addEventListener('click', closeExpandedCard);

            // Sync button interaction
            const syncBtn = document.querySelector('button.border-primary-container');
            if(syncBtn) {
                syncBtn.addEventListener('click', () => {
                    const icon = syncBtn.querySelector('span');
                    icon.classList.add('animate-spin');
                    setTimeout(() => icon.classList.remove('animate-spin'), 1000);
                });
            }
        });
    </script>

</body></html>
