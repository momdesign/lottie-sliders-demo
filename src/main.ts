import './style.css';
import lottie from 'lottie-web';

const lottieFixItem = document.querySelector<HTMLDivElement>('#lottie')!;
const sliderWrapper = document.querySelector<HTMLDivElement>('.slider-wrapper')!;
const slides = document.querySelectorAll<HTMLDivElement>('.slide');
const currentFrameEl = document.querySelector<HTMLSpanElement>('#current-frame')!;
const currentSegmentEl = document.querySelector<HTMLSpanElement>('#current-segment')!;
const scrollPercentageEl = document.querySelector<HTMLSpanElement>('#scroll-percentage')!;

// Define the proper type for animation configuration
type AnimationConfig = {
  container: HTMLElement;
  renderer: 'svg' | 'canvas' | 'html';
  loop: boolean;
  autoplay: boolean;
  path: string;
};

const animationData: AnimationConfig = {
  container: lottieFixItem,
  renderer: 'svg',
  loop: false,
  autoplay: false,
  path: './anim.json'
}; 

// Animation segments points with proper typing
const animationPoints: Record<number, number> = {
  0: 0,
  1: 80,
  2: 0,
};

let currentAnimationIndex = 0;
let isInStickyRange = false;
const animation = lottie.loadAnimation(animationData);

// Update the info panel with current animation state
const updateInfoPanel = (currentFrame: number, segmentIndex: number, scrollPercentage: number) => {
  currentFrameEl.textContent = String(Math.round(currentFrame));
  currentSegmentEl.textContent = String(segmentIndex);
  scrollPercentageEl.textContent = `${Math.round(scrollPercentage * 100)}%`;
};

// Update the slides to show which one is active
const updateActiveSlide = (index: number) => {
  slides.forEach((slide, i) => {
    if (i === index) {
      slide.classList.add('active');
    } else {
      slide.classList.remove('active');
    }
  });
};

// Function to animate with segment snapping
const animateWithSnapping = (newIndex: number) => {
  if (currentAnimationIndex !== newIndex) {
    animation.playSegments([animationPoints[currentAnimationIndex], animationPoints[newIndex]], true);
    currentAnimationIndex = newIndex;
    updateActiveSlide(newIndex);
  }
};

// Function to calculate sticky progress
const calculateStickyProgress = () => {
  // Get the bounds of the sticky container
  const wrapperRect = sliderWrapper.getBoundingClientRect();
  const wrapperHeight = wrapperRect.height;
  const viewportHeight = window.innerHeight;
  
  // Calculate the scroll progress within the sticky section
  // The offset is when the sticky element hits the top of the viewport
  const stickyOffset = wrapperRect.top;
  const stickyDuration = wrapperHeight - viewportHeight;
  
  // Calculate progress (0 to 1) of scroll through the sticky section
  let progress = 0;
  
  // If we're before the sticky section
  if (stickyOffset > 0) {
    progress = 0;
    isInStickyRange = false;
  } 
  // If we're after the sticky section
  else if (Math.abs(stickyOffset) > stickyDuration) {
    progress = 1;
    isInStickyRange = false;
  } 
  // If we're in the sticky section
  else {
    progress = Math.abs(stickyOffset) / stickyDuration;
    isInStickyRange = true;
  }
  
  return progress;
};

// Function to handle scroll and determine which segment to play
const handleScroll = () => {
  const progress = calculateStickyProgress();
  
  // Get the number of segments
  const totalSegments = Object.keys(animationPoints).length;
  const segmentSize = 1 / totalSegments;
  
  // Calculate which segment to show based on the progress
  // Now each segment gets an equal portion of the scroll distance
  const newIndex = Math.min(
    Math.floor(progress / segmentSize),
    totalSegments - 1
  );
  
  // Only animate if we're in the sticky range
  if (isInStickyRange || progress === 0 || progress === 1) {
    animateWithSnapping(newIndex);
  }
  
  updateInfoPanel(animation.currentFrame, newIndex, progress);
};

// Keep track of animation frame updates
animation.addEventListener('enterFrame', () => {
  updateInfoPanel(animation.currentFrame, currentAnimationIndex, calculateStickyProgress());
});

// Initialize the animation once it's loaded
animation.addEventListener('data_ready', () => {
  // Set initial state
  animation.goToAndStop(animationPoints[0], true);
  updateActiveSlide(0);
  updateInfoPanel(0, 0, 0);
  
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll);
  
  // Run once to set initial state
  handleScroll();
});

export {};
