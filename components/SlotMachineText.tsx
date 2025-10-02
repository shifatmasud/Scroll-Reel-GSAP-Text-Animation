import React from 'react';

interface SlotMachineTextProps {
  text: string;
  className?: string;
  animatedChars: boolean[];
}

// Number of duplicate characters to build the reel
const REEL_LENGTH = 1;

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

export default SlotMachineText;