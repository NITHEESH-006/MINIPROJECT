
function showAlert() {
    alert("Message Successfully Sends !")
}

function show() {
    alert("THIS FEATURE CURRENTLY DISABLED! AVAILABLE SOON !")
}


let currentSlide = 0;
const slides = document.querySelectorAll('.custom-carousel-item');
const indicators = document.querySelectorAll('.custom-carousel-indicators button');
const carouselInner = document.querySelector('.custom-carousel-inner');

function updateCarousel() {
  // Remove 'active' class from all slides and indicators
  slides.forEach((slide) => slide.classList.remove('active'));
  indicators.forEach((indicator) => indicator.classList.remove('active'));

  // Add 'active' class to the current slide
  slides[currentSlide].classList.add('active');
  indicators[currentSlide].classList.add('active');

  // Move the carousel to the current slide by adjusting the transform property
  carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function moveCarousel(direction) {
  if (direction === 'next') {
    currentSlide = (currentSlide + 1) % slides.length;
  } else if (direction === 'prev') {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  }
  updateCarousel();
}

// Auto change slide every 3 seconds
setInterval(() => {
  moveCarousel('next');
}, 3000);



// Initialize carousel
updateCarousel();

// Add event listeners for the buttons
document.querySelector('.custom-carousel-control-prev').addEventListener('click', () => moveCarousel('prev'));
document.querySelector('.custom-carousel-control-next').addEventListener('click', () => moveCarousel('next'));





