$(document).ready(function(){

	var current;

	var ig_posts = [];

	var sv = new google.maps.StreetViewService();
	var panorama;

	var timer;
	var show_seconds = 11000;
	var load_seconds = 10000;

/*	$(document).snowfall({
		flakeCount : 10,        // number
		flakeColor : '#ffffff', // string
		flakeIndex: 999999,     // number
		minSize : 1,            // number
		maxSize : 17,            // number
		minSpeed : 1,           // number
		maxSpeed : 1.5,           // number
		round : true,          // bool
		shadow : false          // bool
	});
	*/

	function search_instagram(tag, next_url, cb) {
		var instagram_api;

		if(next_url) {
			instagram_api = next_url + "&callback=?";
		} else {
			var client_id = '01b5b09214bd44fd90d4ed10b808d0ec';
			instagram_api = "https://api.instagram.com/v1/tags/" + tag +
				"/media/recent?client_id=" + client_id + "&callback=?";
		}

		$.getJSON(instagram_api, function(data) {
			parse_instagram(data, function() {
				//Only call CB once
				if(ig_posts.length >= 1 && cb) {
					cb();
					cb = null;
				}
				
				if(ig_posts.length < 50) {
					search_instagram(tag, data.pagination.next_url, cb);
				}
			});
		});
	}

	function parse_instagram(resp, cb) {
		var max_req = resp.data.length;
		var done_req = 0;
		for(var i = 0; i < resp.data.length; i++) {
			var post = resp.data[i];

			if(post.location == null) {
				done_req++;
				if(done_req >= max_req) 
					cb();
				continue;
			}

			var ig_post = {};
			ig_post.pic_url = post.images.standard_resolution.url;
			ig_post.caption = post.caption ? post.caption.text : '';
			ig_post.created = post.created_time;
			ig_post.link = post.link;
			ig_post.latlng = post.location;
			create_location(ig_post, function(ig_post_modified) {
				if(ig_post_modified) {
					ig_posts.push(ig_post_modified);
				}
				done_req++;
				if(done_req >= max_req)
					cb();
			});
		}
	}


	function create_location(ig_post, cb) {
		var lat = ig_post.latlng.latitude;
		var lng = ig_post.latlng.longitude;
		var latlng = ig_post.sv_latlng = new google.maps.LatLng(lat, lng);

		sv.getPanoramaByLocation(latlng, 10, function(sv_data, sv_status) {
			if(sv_status == google.maps.StreetViewStatus.OK && sv_data.location.description) {
				ig_post.loc = sv_data.location.description;
				cb(ig_post);
			} else {
				//No StreetMap Data for this long/lat
				cb(null);
			}
		});
	}

	function initialize() {
		var latlng = new google.maps.LatLng(40.709385,-74.011323);
		var panoramaOptions = {
			position: latlng,
			pov: {
				heading: 34,
				pitch: 10,
				zoom: 1
			},
			panControl: false,
			linksControl: false,
			zoomControl: false,
			addressControl: false,
			scrollwheel: false,
		};
		panorama = new google.maps.StreetViewPanorama(document.getElementById("pano"), panoramaOptions);
	}

	var index = 0;

	var setupSite = function(ig_post) {
		panorama.setPosition(ig_post.sv_latlng);
		$("#overlay").attr("src", ig_post.pic_url);
		$("#tweet").html(ig_post.caption);
		$("#time").html(moment.unix(ig_post.created).fromNow() + ' near ');
		$("#description").html(ig_post.loc);
	}


	var loop = function() {
		(index == ig_posts.length - 1) ? index = 0 : index++;

		//Fade out the curtain then fade in content
		setTimeout(function(){
			$('#overlay').fadeIn('fast');
			$('#curtain').fadeOut('fast');
		}, 250);

		setupSite(ig_posts[index]);

		//Fade out the content then fade in the curtain
		setTimeout(function(){
			$('#curtain').fadeIn('fast');
			$('#overlay').fadeOut('fast')
		}, show_seconds - 250);

		timer = setTimeout(function(){ loop(); }, show_seconds);
	}

	var query = function(event) {
		current = 0;
		index = 0;

		q = $("#queryInput").val();
		$("#queryDisplay").html(q);

		search_instagram('thanksgiving', null, function() {
			if(ig_posts.length > 0) {
				loop();
			} else {
				console.log("Sorry, no results for that tag!");
			}
		});
	};

	$(".toggleModal").live("click", function() {
		clearTimeout(timer);
		$("#change_modal").fadeToggle(500, "linear"); 
	});

	initialize();

	// $("#scrape").live("click", function() {
	query(1);
	// });

});
