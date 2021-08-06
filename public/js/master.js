let usernameField = $(".username-input");
let userErrField = $(".user-err-message");
let fileInput = $('.file-upload');
let uploadButton = $('.upload-btn');
let contactForm = $('.contact-form');
let toast = $('#liveToast');
userErrField.hide();

// check if username is valid on submit
$(".submit-button").click(function(e){
  let checkUsername = validateUsername();
  if(!checkUsername && usernameField[0].value){
    e.preventDefault();
    usernameField.addClass('is-invalid');
    userErrField.show();
    userErrField.addClass('invalid-feedback')
    userErrField.text("Username must not contain special characters");
  }
})

// check if a username containes special characters
function validateUsername() {
        // Regex for Valid Characters i.e. Alphabets, Numbers and Space.
        var regex = /^[A-Za-z0-9]+$/
        //
        // Validate TextBox value against the Regex.
        var isValid = regex.test(usernameField[0].value);
        return isValid;
    }

// check audio file size
uploadButton.click(function(e){
  console.log(fileInput[0].files[0].size);
  if(fileInput[0].files[0].size > 5000000){
    e.preventDefault();
    console.log("file is too big");
    fileInput.addClass("is-invalid");
  }
});

// make ajax request to the backend to send a message to the admins
contactForm.submit(function(e){
  let email = $('.contact-email').val();
  let subject = $('.contact-subject').val();
  let message = $('.contact-message').val();
  $('.contact-email').val('')
  $('.contact-subject').val('');
  $('.contact-message').val('');
  e.preventDefault();
  $.ajax({
           url: '/help',
           type: 'POST',
           cache: false,
           data: { email: email, subject: subject, message: message },
           success: function(data){
             toast.addClass('show');
             toast.removeClass('hide');
             setTimeout(function(){
               toast.removeClass('show');
               toast.addClass('hide');
             }, 5000);
           }
        });
});
