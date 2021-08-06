// create waveform
function createAudioPlayer(id, postFile) {
  var wavesurfer = {};
  wavesurfer.id = WaveSurfer.create({
    container: '#waveform' + id,
    responsive: true,
    hideScrollbar: true,
    cursorWidth: 0,
    backgroundColor: "#f2f2f2",
    progressColor: "#7534FF"
  });

  wavesurfer.id.load('/uploads/' + postFile);
  wavesurfer.id.on('finish', function() {
    wavesurfer.id.play();
  });
  wavesurfer.id.on('ready', fullDuration);
  wavesurfer.id.on('audioprocess', updateTimer);
  wavesurfer.id.on('interaction', updateTimer);

  function updateTimer() {
    setTimeout(function() {
      var formattedTime = secondsToTimestamp(wavesurfer.id.getCurrentTime());
      $('.time' + id).text(formattedTime);
    }, );
  }

  function fullDuration() {
    setTimeout(function() {
      var formattedTime = secondsToTimestamp(wavesurfer.id.getDuration());
      $('.time-full' + id).text(formattedTime);
    }, );
  }

  function secondsToTimestamp(seconds) {
    seconds = Math.floor(seconds);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds - (h * 3600)) / 60);
    var s = seconds - (h * 3600) - (m * 60);

    m = m < 10 ? '0' + m : m;
    s = s < 10 ? '0' + s : s;
    return m + ':' + s;
  }

  var audioState = {};
  audioState.id = "off";

  setTimeout(function() {
    document.querySelector(".waveform" + id + "-button").addEventListener('click', function() {
      if (audioState.id === "off") {
        wavesurfer.id.play();
        this.src = ("/images/pause.png");
        audioState.id = "on";
      } else {
        wavesurfer.id.pause();
        this.src = ("/images/play.png");
        audioState.id = "off";
      }
    });
  }, 1000);
}

// add functionality to like button and make it dynamically update like count
// without reloading the page
function addLike(id) {
  $(".like-form-" + id).submit(function(e) {
    var postId = $('.post-id-input-' + id).val();
    var userId = $('.user-id-input').val();
    e.preventDefault();
    $.ajax({
      url: "/like",
      type: "POST",
      data: {
        'postId': postId,
        'userId': userId,
      },
      success: function(data) {
        if (data.message === 'removed user') {
          var dislikeButton = $('.dislike-button-' + id);
          dislikeButton.addClass('btn-light like-button-' + id);
          dislikeButton.html('<img src = "/images/like.png" height=25 width=25/>');
          dislikeButton.removeClass('btn-secondary dislike-button-' + id);
          $('.like-count-' + id).text(data.foundPost.likes.length);
        } else if (data.message === 'added user') {
          var likeButton = $('.like-button-' + id);
          likeButton.addClass('btn-light dislike-button-' + id);
          likeButton.html('<img src = "/images/like-filled.png" height=25 width=25/>');
          likeButton.removeClass('btn-light like-button-' + id);
          $('.like-count-' + id).text(data.foundPost.likes.length);
        }
      }
    });
  });
}
