jQuery(document).ready(function($) {

	$(".nsu-form p").mouseover(function(){
		$obj = $(".nsu-error",this);
		$obj.fadeOut();
	});

	$(".custom-list li:nth-child(2n)").addClass("even");

	$("body:not(.home)").addClass("subpage");

});