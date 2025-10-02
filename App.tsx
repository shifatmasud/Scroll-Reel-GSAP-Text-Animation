
import React, { useEffect, useMemo, useRef } from 'react';
import SlotMachineText from './components/SlotMachineText';

// Tell TypeScript that gsap and ScrollTrigger are global variables
declare const gsap: any;
declare const ScrollTrigger: any;

const App: React.FC = () => {
  const appRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  const phrases = ["Learn it", "Tweak it", "Use it"];

  // Memoize the calculation of which characters to animate so it only runs once.
  const animatedCharsMap = useMemo(() => {
    const animationMap = phrases.map(p => p.split('').map(() => false));

    phrases.forEach((phrase, phraseIndex) => {
        // Get original indices of all characters that are not spaces
        const letterIndices = phrase
            .split('')
            .map((char, index) => (char !== ' ' ? index : -1))
            .filter(index => index !== -1);
        
        if (letterIndices.length === 0) return; // Skip if no letters in phrase

        // Determine possible odd counts for this specific phrase
        const possibleCounts = [1, 3, 5, 7, 9].filter(count => count <= letterIndices.length);
        if (possibleCounts.length === 0) {
            possibleCounts.push(1); // Default to 1 if the phrase is very short
        }
        
        // Select a random odd number of characters to animate for this line
        const targetAnimatedCount = possibleCounts[Math.floor(Math.random() * possibleCounts.length)];

        // Shuffle the indices for random selection
        const shuffledIndices = [...letterIndices].sort(() => 0.5 - Math.random());
        const selectedIndices: number[] = [];

        // Select characters, ensuring at least one static letter is between them
        for (const candidateIndex of shuffledIndices) {
            if (selectedIndices.length >= targetAnimatedCount) {
                break;
            }
            
            let isTooClose = false;
            for (const selectedIndex of selectedIndices) {
                const start = Math.min(candidateIndex, selectedIndex);
                const end = Math.max(candidateIndex, selectedIndex);
                const inBetween = phrase.substring(start + 1, end);
                
                // If there are no actual letters in the space between the two characters,
                // they are considered too close.
                if (inBetween.trim().length === 0) {
                    isTooClose = true;
                    break;
                }
            }

            if (!isTooClose) {
                selectedIndices.push(candidateIndex);
            }
        }

        // Populate the animation map for the current phrase
        selectedIndices.forEach(charIndex => {
            animationMap[phraseIndex][charIndex] = true;
        });
    });

    return animationMap;
  }, []);


  useEffect(() => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("GSAP or ScrollTrigger not loaded from CDN.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    
    const ctx = gsap.context(() => {
        // This value MUST match REEL_LENGTH in SlotMachineText.tsx
        const REEL_LENGTH = 1;
        const reels = gsap.utils.toArray('.char-reel');
        
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerRef.current,
                // Creates a small, precise trigger area in the middle of the screen.
                // The animation will start when the center of the text block enters this zone.
                // NOTE: The start value must be smaller than the end value for correct trigger behavior.
                start: 'center 45%', // Start when center of trigger hits 45% from the top of viewport
                end: 'center 55%',   // End when center of trigger hits 55% from the top of viewport
                // 'play': Plays the animation when entering the zone from the bottom.
                // 'none': Does nothing when leaving the zone at the top (scrolling down).
                // 'none': Does nothing when re-entering the zone from the top (scrolling up).
                // 'reverse': Reverses the animation when leaving the zone at the bottom (scrolling up).
                toggleActions: 'play none none reverse',
                // For debugging, uncomment the line below to see the trigger zone.
                markers: true,
            }
        });

        // Animate the reels scrolling up to reveal the final character.
        // We move them up by the height of REEL_LENGTH characters.
        tl.to(reels, {
            yPercent: -100 * (REEL_LENGTH / (REEL_LENGTH + 1)),
            ease: 'power2.inOut',
            duration: 1,
            stagger: {
                amount: 0.6,
                from: 'random'
            }
        });

    }, appRef);
    
    return () => ctx.revert(); // Cleanup GSAP animations on component unmount
  }, []);

  return (
    <div ref={appRef} className="bg-black text-white min-h-screen font-sans antialiased overflow-hidden">
        <section ref={triggerRef} className="h-screen flex flex-col items-center justify-center text-center space-y-4">
            {phrases.map((phrase, index) => (
                <SlotMachineText
                    key={index}
                    text={phrase}
                    animatedChars={animatedCharsMap[index]}
                />
            ))}
        </section>
        
        {/* This extra div provides scrollable area AFTER the animation section */}
        <section className="h-screen flex items-center justify-center">
             <p className="text-2xl text-gray-500">The End.</p>
        </section>
    </div>
  );
};

export default App;
