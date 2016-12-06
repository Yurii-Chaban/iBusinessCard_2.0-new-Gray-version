// for main menu mobile
$(function () {
    $('.hidden-menu li a').each(function () {
        var location = window.location.pathname;
        var link = this.pathname;
        var result = location.match(link);
        if(result && link.length > 0) {
            $(this).addClass('hidden-menu-active');
        }
    });
});
// for main menu desctop
$(function () {
    $('.header-desctop-menu .menu-list li > a').each(function () {
        var location = window.location.pathname;
        var link = this.pathname;
        var result = location.match(link);
        if(result && link.length > 0) {
            $(this).addClass('desctop-item-active');
        }
    });
});
// for submenu mobile
$(function () {
    $('.dropdovn-menu-mobile .hidden-menu .sub-menu a').each(function () {
        var location = window.location.pathname;
        var link = this.pathname;
        var result = location.match(link);
        if(result && link.length > 0) {
            $(this).parents("li").addClass('submenu-mobile-item-active');
            $(this).parents(".sub-menu").addClass("active");
        }
    });
});
// for submenu desctop
$(function () {
    $('.header-desctop-menu .menu-list .sub-menu a').each(function () {
        var location = window.location.pathname;
        var link = this.pathname;
        var result = location.match(link);
        if(result && link.length > 0) {
             $(this).parents("li").addClass('submenu-desctop-item-active');
            $(this).parents(".sub-menu").addClass("active");
        }
    });
});

/*---------------------*/
/*SETTINGS CLICK*/
/*---------------------*/
$("#settings").click(function() {
  $(this).find("span").toggleClass('active-setting');
  $("#sett").toggleClass("show");
});

// for slider in Home page
$(document).ready(function() {
    var swiper_main = new Swiper('.swiper-container-home-page', {
        pagination: '.swiper-pagination',
        paginationClickable: true,
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',
        loop: true,
        slidesPerView: 1,
        spaceBetween: 0,
        simulateTouch: true,
        centeredSlides: true,
        autoplay: 3500,
        speed: 1000,
        watchSlidesProgress: true,
        autoplayDisableOnInteraction: false
    });
});
// for slider more on About Us page, services-more page and ather
$(document).ready(function() {
    $(document).ready(function() {
        $('.center').slick({
            autoplay: true,
            autoplaySpeed: 3000,
            infinite: true,
            speed: 1000,
            slidesToShow: 2,
            slidesToScroll: 1,
            centerPadding: '20px',
            responsive: [
            {
              breakpoint: 768,
              settings: {
                arrows: false,
                centerMode: true,
                centerPadding: '20px',
                slidesToShow: 2
            }
        },
        {
          breakpoint: 480,
          settings: {
            arrows: true,
            centerMode: true,
            centerPadding: '0px',
            slidesToShow: 1
        }
    }
    ],
    nextArrow: '<img class="next-btn" src="images/more-next.png" alt="more prev">',
    prevArrow: '<img class="prev-btn" src="images/more-prev.png" alt="more next">',
});
    });
});