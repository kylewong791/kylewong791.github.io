// Smooth scrolling
$(document).ready(function () {
    $(document).on('click', 'a[href^="#"]', function (event) {
        event.preventDefault();

        var targetSection = $($.attr(this, 'href'));
        var navbarHeight = $('.navbar').height();
        var targetPosition = targetSection.offset().top - navbarHeight;

        // Explicitly specify the listener as passive
        $('html, body').animate({
            scrollTop: targetPosition
        }, 500);
    });
});


// Make the navigation bar sticky
$(document).ready(function () {
    var navbar = $('.navbar');
    var navbarHeight = navbar.height();
    var meSection = $('#me');

    // Adjust margin-top for sections to make space for the sticky navbar
    var sections = $('.scroll-section'); // Define sections here
    sections.css('margin-top', navbarHeight + 'px');

    $(window).on('scroll', function () {
        var scrollTop = $(window).scrollTop();
        var meSectionTop = meSection.offset().top;

        // Check if the scroll position is below the me section
        if (scrollTop > meSectionTop) {
            navbar.addClass('sticky');
        } else {
            navbar.removeClass('sticky');
        }
    });
});

// Fade in/out
$(document).ready(function() {
    checkVisibilityAndUpdate();

    $(window).on('scroll', function() {
        checkVisibilityAndUpdate();
    });

    function checkVisibilityAndUpdate() {
        $('.scroll-section').each(function() {
            if (isElementInView(this)) {
                $(this).addClass('in-view');
            } else {
                $(this).removeClass('in-view');
            }
        });
    }

    function isElementInView(element) {
        var elementTop = $(element).offset().top;
        var elementBottom = elementTop + $(element).outerHeight();
        var viewportTop = $(window).scrollTop();
        var viewportBottom = viewportTop + $(window).height();
        return elementBottom > viewportTop && elementTop < viewportBottom;
    }
});



// Flip "cards"
$(document).ready(function() {
    $('.project-item').click(function() {
        $(this).find('.card').toggleClass('flipped');
    });
});

