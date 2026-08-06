$(document).ready(function () {

    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: false,
            mirror: true,
            offset: 100,
            delay: 0,
            disable: false,
            anchorPlacement: 'top-bottom'
        });
        

        let scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                AOS.refresh();
            }, 50);
        }, { passive: true });
    }

    $("#testimonial-slider").owlCarousel({
        items: 3,
        itemsDesktop: [1000, 3],
        itemsDesktopSmall: [979, 2],
        itemsTablet: [768, 2],
        itemsMobile: [650, 1],
        pagination: true,
        autoPlay: true,
    });

    var $btns = $(".side-tab").click(function () {
        if (this.id === "all") {
            $("#parent > div").fadeIn(450);
        } else {
            var $el = $("." + this.id).fadeIn(450);
            $("#parent > div").not($el).hide();
        }
        $btns.removeClass("active");
        $(this).addClass("active");
    });

    $(".owl-carousel").owlCarousel({
        loop: false,
        autoplay: true,
        autoplayHoverPause: true,
        responsive: {
            0: { items: 1 },
            600: { items: 1 },
            1000: { items: 3 },
        },
    });

    $(".counter").each(function () {
        var $this = $(this),
            countTo = $this.attr("data-count");

        $({ countNum: $this.text() }).animate(
            {
                countNum: countTo,
            },
            {
                duration: 5000,
                easing: "linear",
                step: function () {
                    $this.text(Math.floor(this.countNum));
                },
                complete: function () {
                    $this.text(this.countNum);
                },
            }
        );
    });

    $(".wizard li").click(function () {
        $(this).prevAll().addClass("completed");
        $(this).nextAll().removeClass("completed");
    });

    class Toggle {
        constructor(toggleClass) {
            this.el = $(toggleClass);
            this.tabs = this.el.find(".tab");
            this.panels = this.el.find(".panel");
            this.bind();
        }

        show(index) {
            var activeTab = this.tabs.get(index);
            $(activeTab).addClass("active");
            this.panels.hide();
            var activePanel = this.panels.get(index);
            $(activePanel).show();
        }

        bind() {
            this.tabs.unbind("click").bind("click", (e) => {
                this.show($(e.currentTarget).index());
            });
        }
    }

    new Toggle(".toggle");

    $(".tab-slider--body").hide();
    $(".tab-slider--body:first").show();

    $(".tab-slider--nav li").click(function () {
        $(".tab-slider--body").hide();
        var activeTab = $(this).attr("rel");
        $("#" + activeTab).fadeIn();
        if ($(this).attr("rel") === "tab2") {
            $(".tab-slider--tabs").addClass("slide");
        } else {
            $(".tab-slider--tabs").removeClass("slide");
        }
        $(".tab-slider--nav li").removeClass("active");
        $(this).addClass("active");
    });

    $(window).on("resize", moveProgressBar);
    moveProgressBar();

    function moveProgressBar() {
        var getPercent = $(".progress-wrap").data("progress-percent") / 100;
        var getProgressWrapWidth = $(".progress-wrap").width();
        var progressTotal = getPercent * getProgressWrapWidth;
        var animationLength = 2500;

        $(".progress-bar").stop().animate(
            {
                left: progressTotal,
            },
            animationLength
        );
    }

    $("input[name=action]").change(function () {
        var test = $(this).val();
        $(".show-hide").hide();
        $("#" + test).show();
    });
});

$("#logout").on("click", function (e) {
    e.preventDefault();
    $.ajax({
        url: "/logout",
        method: "POST",
        headers: {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
        },
        success: function (response) {
            toastr.success('Logged out successfully')
            setTimeout(function () {
                window.location.href = "/login";
            }, 3000);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Logout error:", textStatus, errorThrown);
        },
    });
});

  if ($(".custom-cursor").length) {
    var cursor = document.querySelector(".custom-cursor__cursor");
    var cursorinner = document.querySelector(".custom-cursor__cursor-two");
    var a = document.querySelectorAll("a");

    document.addEventListener("mousemove", function (e) {
      var x = e.clientX;
      var y = e.clientY;
      cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
    });

    document.addEventListener("mousemove", function (e) {
      var x = e.clientX;
      var y = e.clientY;
      cursorinner.style.left = x + "px";
      cursorinner.style.top = y + "px";
    });

    document.addEventListener("mousedown", function () {
      cursor.classList.add("click");
      cursorinner.classList.add("custom-cursor__innerhover");
    });

    document.addEventListener("mouseup", function () {
      cursor.classList.remove("click");
      cursorinner.classList.remove("custom-cursor__innerhover");
    });

    a.forEach((item) => {
      item.addEventListener("mouseover", () => {
        cursor.classList.add("custom-cursor__hover");
      });
      item.addEventListener("mouseleave", () => {
        cursor.classList.remove("custom-cursor__hover");
      });
    });
  }
