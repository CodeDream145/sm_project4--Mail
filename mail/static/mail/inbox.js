document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  

  //
  document.querySelector('#compose-form').addEventListener('submit', (form) =>{
    
    form.preventDefault();
  
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector("#compose-body").value;

    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result["error"]){
        const error_el = document.querySelector('#top_error');
        error_el.style.display = "block";
        error_el.innerHTML = result["error"];
      }
      else{
        document.querySelector('#top_error').style.display = "none";
        load_mailbox('sent');
        const green_msg = document.querySelector('#sent_message');
        green_msg.style.display = "block";
        green_msg.innerHTML = result["message"];
      }
    });
  });

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view_mail').style.display = 'none';
  document.querySelector('#sent_message').style.display = 'none';
  document.querySelector('#top_error').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

//show mail
function show_email(id , mail_box){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view_mail').style.display = 'block';
  document.querySelector('#sent_message').style.display = 'none';
  document.querySelector('#top_error').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    if(email.read !== 'true'){
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });
    }
    const mail_viewer = document.querySelector('#view_mail');
    const formattedBody = email.body.replace(/\n/g, '<br>');
    mail_viewer.innerHTML = `<p><span id="bold_one">From:  </span> <span id="lit_thick">   ${email.sender}</span></p>   
    <p><span id="bold_one">To:  </span> <span id="lit_thick">   ${email.recipients}</span></p>
    <p><span id="bold_one">Subject:  </span> <span id="lit_thick">   ${email.subject}</span></p>
    <p><span id="bold_one">Timesamp:  </span> <span id="lit_thick">   ${email.timestamp}</span></p>
    <div id="mail_buttons"></div>
    <hr>
    <p id="mail_body">${formattedBody}</p>`
    if(mail_box !== 'sent'){
      const e_a_button = document.createElement('button');
      e_a_button.className = "btn btn-primary";
      if (email.archived !== true){
        e_a_button.innerHTML = 'Archive';
        e_a_button.id = 'archive';
      } 
      else if(email.archived === true){
        e_a_button.innerHTML = 'Unarchive';
        e_a_button.id = 'unarchive';
      }
      e_a_button.onclick = () => archiving(e_a_button.id, email.id);
      document.querySelector('#mail_buttons').append(e_a_button)
    }
    const reply_button = document.createElement('button');
    reply_button.className ='btn btn-primary';
    reply_button.id = "reply_button";
    reply_button.innerHTML = "Reply";
    reply_button.onclick = ()=> reply_mail(email.id)
    document.querySelector('#mail_buttons').append(reply_button)
  });
}

//archive || unarchive
function archiving(wtd, id){
  let archive_bool = false
  if(wtd === 'archive'){
    archive_bool = true
  }
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archive_bool
    })
  })
  .then(()=>{
    load_mailbox('inbox');
  });
}

//reply_mail
function reply_mail(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email =>{
    compose_email();
    document.querySelector('#comp_header').innerHTML = "Reply"
    const recipients = document.querySelector('#compose-recipients');
    const subject = document.querySelector('#compose-subject');
    const body = document.querySelector("#compose-body");
    
    recipients.value = email.sender;
    let sub = email.subject.trim()
    sub = sub.split(" ")
    if(sub[0] === 'Re:'){
      subject.value = email.subject;
    }
    else{
      subject.value = `Re:  ${email.subject}`;
    }
    body.value = `On ${email.timestamp}  ${email.sender} Wrote:    ${email.body}
     ----------------------------------
    Reply by ${document.querySelector('#user_email').innerHTML}:
        `
  });
}

//load_mailbox
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#view_mail').style.display = 'none';
  document.querySelector('#sent_message').style.display = 'none';
  document.querySelector('#top_error').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    if (emails["error"]){
      document.querySelector('#emails-view').innerHTML = '<h3 id="invalid_mail">Invalid Mail Box!</h3>';
    }

    else if((emails.length) <= 0){
      document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3> <h5>No Mails Inside The ${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)} Box!</h5`;
    }
    else{
      const mails_view = document.querySelector('#emails-view');
      mails_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
      emails.forEach(email => {
        const container = document.createElement('div');
        container.className = "email_box";
        container.id = `${email.id}`
        container.innerHTML = `<span id="e_mail">${email.sender.trim()}</span> <span id="e_sub">${email.subject.trim()}</span> <span id="e_time">${email.timestamp.trim()}</span>`;
        if (email.read){
          container.style.backgroundColor = "rgba(133, 133, 133, 0.592)"
        }
        container.onclick = ()=> show_email(container.id, mailbox);
        mails_view.append(container);
      });
    }
  });
}