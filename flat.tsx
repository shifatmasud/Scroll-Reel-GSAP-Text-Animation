
import React, { useEffect, useMemo, useRef } from 'react';

// Tell TypeScript that gsap and ScrollTrigger are global variables
declare const gsap: any;
declare const ScrollTrigger: any;

// This value is used by both SlotMachineText and the GSAP timeline
const REEL_LENGTH = 1;

// --- Merged SlotMachineText component ---
// This is now a local component within the same file.
interface SlotMachineTextProps {
  text: string;
  className?: string;
  animatedChars: boolean[];
}

const SlotMachineText: React.FC<SlotMachineTextProps> = ({ text, className, animatedChars }) => {
  return (
    <h1 className={`flex text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter ${className}`} aria-label={text}>
      {text.split('').map((char, index) => {
        if (char === ' ') {
          // A wider space for visual balance
          return <span key={index} className="whitespace-pre w-4 md:w-6 lg:w-8"> </span>;
        }
        
        // Use the prop to decide if this character should have the reel animation
        const shouldAnimate = animatedChars[index];

        if (!shouldAnimate) {
            // If not animating, render a static character.
            // We keep it in a container to ensure consistent height and alignment.
            return (
                <div key={index} className="h-[1em] leading-[1em]">
                    <span aria-hidden="true">{char}</span>
                </div>
            )
        }

        // Create an array filled with the *same* character for a clean slide effect
        const reelChars = Array.from({ length: REEL_LENGTH + 1 }, () => char);

        return (
          // This div is the "viewport" for our reel, masking the overflow
          <div key={index} className="h-[1em] leading-[1em] overflow-hidden">
            {/* This div is the "reel" that will animate vertically */}
            <div className="char-reel flex flex-col items-center justify-center">
              {reelChars.map((reelChar, i) => (
                <span key={i} className="char-reel-item" aria-hidden="true">
                  {reelChar}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </h1>
  );
};


// --- Main component Clarity ---
// This component now encapsulates all logic and state.
// It follows the pattern where props trigger animation re-initialization.

interface ClarityProps {
    phrases?: string[];
}

export default function Clarity({ phrases = ["Learn it", "Tweak it", "Use it"] }: ClarityProps) {
  const appRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  // Memoize the calculation of which characters to animate.
  // This will re-run only when the `phrases` prop changes.
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
  }, [phrases]);


  // useEffect for setting up and tearing down GSAP animations.
  // It re-runs whenever the animated characters map changes, which is driven by the `phrases` prop.
  useEffect(() => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("GSAP or ScrollTrigger not loaded from CDN.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    
    // GSAP context for safe cleanup
    const ctx = gsap.context(() => {
        const reels = gsap.utils.toArray('.char-reel');
        if (reels.length === 0) return; // Don't create a timeline if there's nothing to animate
        
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerRef.current,
                start: 'center 45%',
                end: 'center 55%',
                toggleActions: 'play none none reverse',
                // For debugging, you can enable markers:
                // markers: true,
            }
        });

        // Animate the reels scrolling up to reveal the final character.
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
    
    return () => ctx.revert(); // Cleanup GSAP animations and ScrollTriggers on re-render or unmount
  }, [animatedCharsMap]);

  // The request to include index.html as JSX is interpreted as rendering the main app content.
  // A React component cannot and should not render the entire <html> structure.
  return (
    <div ref={appRef} className="bg-black text-white min-h-screen font-sans antialiased overflow-hidden">
        <section ref={triggerRef} className="h-screen flex flex-col items-center justify-center text-center space-y-4">
            {phrases.map((phrase, index) => (
                <SlotMachineText
                    key={phrase + index}
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
}
