$(document).ready(function(){

	var current;

	var ig_posts = [];

	var sv = new google.maps.StreetViewService();
	var panorama;

	var timer;
	var show_seconds = 11000;
	var load_seconds = 10000;

  var initial_posts_to_get = 9;

  var next_page = null;

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

  function report_error(error) {
    console.log("Error occured: " + error);
    if(ig_posts.length == 0) {
      /*$("#error-info").html(error);*/
      $("#error-div").css('display', 'block');
    }
  }

	function search_instagram(tag, next_url, cb) {
		var instagram_api;

		if(next_url) {
			instagram_api = next_url + "&callback=?";
		} else {
			var  client_id;
      var rand = Math.floor(Math.random()*3);
      if(rand == 0) {
        client_id = '01b5b09214bd44fd90d4ed10b808d0ec';
      } else if (rand == 1) {
        client_id = '40e2d1ed8bd448c883b618bd2b590afc';
      } else { 
        client_id = '204de200af5043eeb1ece105eaea9166';
      }

			instagram_api = "https://api.instagram.com/v1/tags/" + tag +
				"/media/recent?client_id=" + client_id + "&callback=?";
		}

		$.jsonp({
      url: instagram_api,
      success: function(data) {
        console.log(data);

        if(data.meta.code != 200) {
          console.log("Error occured: " + JSON.stringify(data.meta));
          report_error(JSON.stringify(data.meta));
          return;
        }

        parse_instagram(data, function() {


          //Only call CB once, if you have at least one post or there are no more pages
          if( (ig_posts.length >= 1 && cb) || (!data.pagination.next_url && cb) ) {
            cb();
            cb = null;
          }

          next_page = data.pagination.next_url;

          if( (ig_posts.length < initial_posts_to_get) && next_page) {
            //Call on the heap, not stack
            setTimeout(function() {
              search_instagram(tag, data.pagination.next_url, cb);
            }, 0);
          }
        });
      },
      error: function(d,msg) {
        console.log("Error occured: " + msg);
        console.log(d);
        report_error(msg);
      }
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
		var latlng = new google.maps.LatLng(lat, lng);

		sv.getPanoramaByLocation(latlng, 30, function(sv_data, sv_status) {
			if(sv_status == google.maps.StreetViewStatus.OK && sv_data.location.description) {
				ig_post.loc = sv_data.location.description;
				ig_post.sv_pano = sv_data.location.pano;
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
		//panorama.setPosition(ig_post.sv_latlng);
		panorama.setPano(ig_post.sv_pano);
		$("#overlay").attr("src", ig_post.pic_url);
		$("#tweet").html(ig_post.caption + ' <a href="' + ig_post.link + '" target="_blank">' + ig_post.link + '</a>');
		$("#time").html(moment.unix(ig_post.created).fromNow() + ' near ');
		$("#description").html(ig_post.loc);
	};


	var loop = function() {
		(index == ig_posts.length - 1) ? index = 0 : index++;

    if( (index == ig_posts.length - 3) && (next_page) ) {
      search_instagram(null, next_page, null);
    }

		//Fade out the curtain then fade in content
		setTimeout(function(){
			$('#overlay').fadeIn('fast');
			$('#curtain').fadeOut('fast');
		}, 250);

		setupSite(ig_posts[index]);

		//Fade out the content then fade in the curtain
		setTimeout(function(){
			$('#curtain').fadeIn('fast');
			$('#overlay').fadeOut('fast');
		}, show_seconds - 250);

		timer = setTimeout(function(){ loop(); }, show_seconds);
	};

  function get(name){
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
  }

	function htmlEncode(value){
		return $('<div/>').text(value).html();
	}

	var query = function() {
		current = 0;
		index = 0;

		var q = get("q");
		q = htmlEncode(q);

    if(!q) {
      q = "christmas";
    }

    $(".hashtag").text(q);

		search_instagram(q, null, function() {
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

	query();

});
