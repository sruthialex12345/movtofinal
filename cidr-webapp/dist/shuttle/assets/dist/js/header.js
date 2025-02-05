$( document ).ready(function() {
	$(window).scroll(function(){
	  var sticky = $(".main-header "),
		scroll = $(window).scrollTop();
	    if (scroll >= 90) sticky.addClass("bg-header");
		else sticky.removeClass("bg-header");
    });
});