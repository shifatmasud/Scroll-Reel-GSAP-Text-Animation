import React, { useEffect, useMemo, useRef } from 'react';
import SlotMachineText from './components/SlotMachineText';

// Tell TypeScript that gsap and ScrollTrigger are global variables
declare const gsap: any;
declare const ScrollTrigger: any;

const App: React.FC = () => {
  const appRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  const phrases = ["Learn it", "Tweak it", "Use it"];
  const TOTAL_ANIMATED_CHARS = 8;

  // Memoize the calculation of which characters to animate so it only runs once.
  const animatedCharsMap = useMemo(() => {
    // Flatten all non-space characters into a single array with their coordinates
    const allCharPositions: { phraseIndex: number; charIndex: number }[] = [];
    phrases.forEach((phrase, phraseIndex) => {
      phrase.split('').forEach((char, charIndex) => {
        if (char !== ' ') {
          allCharPositions.push({ phraseIndex, charIndex });
        }
      });
    });

    // Shuffle the positions for random selection
    const shuffledPositions = allCharPositions.sort(() => 0.5 - Math.random());
    const positionsToAnimate: { phraseIndex: number; charIndex: number }[] = [];

    // Select characters, ensuring no two are adjacent
    for (const candidate of shuffledPositions) {
      if (positionsToAnimate.length >= TOTAL_ANIMATED_CHARS) {
        break;
      }
      
      let isAdjacent = false;
      for (const selected of positionsToAnimate) {
        // Check if they are in the same phrase and their indices are consecutive
        if (candidate.phraseIndex === selected.phraseIndex && Math.abs(candidate.charIndex - selected.charIndex) === 1) {
          isAdjacent = true;
          break;
        }
      }

      if (!isAdjacent) {
        positionsToAnimate.push(candidate);
      }
    }

    // Create a 2D boolean map for easy lookup in the render method
    const animationMap = phrases.map(p => p.split('').map(() => false));
    positionsToAnimate.forEach(({ phraseIndex, charIndex }) => {
      animationMap[phraseIndex][charIndex] = true;
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
                amount: 0.4,
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