function makePhoto(i) {
  let imgUrl = i.bin.userPhoto[0].url;
  let description = i.data.description;

  let tags = i.tags;

  let tags_html = "";
  if (tags) {
    tags.forEach((item) => {
      tags_html += `<a href="/database/welcome.html?tag=${item}">#${item}</a>, `;
    });
  }

  let html = /*html*/ `
        <br>
        <br>
        <img src="${imgUrl}">
        <br>
        <button id='${i.record_id}_like' style='float:right' onclick='like("${i.record_id}")'>Like</button>
        <p id='number_of_likes_${i.record_id}' style='float:right; clear:both'></p>
        <p style='clear:both'>${description}</p>
        ${tags_html ? `${tags_html}<br><br>` : ""}
        <form onsubmit="event.preventDefault();postComment(event, '${i.record_id}')">
            <input placeholder="Comment" name="comment" required>
            <button type="submit">Send</button>
            <h4 id='loading_new_comment_${i.record_id}'></h4>
        </form>
        <p id='number_of_comments_${i.record_id}'></p>
        <div id="comments_section_${i.record_id}">
            <p id='loading_text_comments_${i.record_id}'></p>
        </div>
        <hr>
    `;

  let div = document.createElement("div");
  div.className = 'feed';
  div.innerHTML = html;

  return div;
}

function postComment(event, record_id) {
  let loadingNewComment = document.getElementById(
    `loading_new_comment_${record_id}`
  );
  loadingNewComment.innerHTML = LOADING;
  skapi
    .postRecord(event, {
      table: {
        name: "comments",
        access_group: "authorized",
      },
      reference: {
        record_id: record_id,
      },
    })
    .then((rec) => {
      event.target.reset();
      loadingNewComment.innerHTML = "";
      let record_id = rec.reference.record_id;
      let userComment = rec.data.comment;
      // console.log(userComment);

      let div = document.getElementById(`comments_section_${record_id}`);
      let comments = document.createElement("p");
      comments.innerHTML = userComment;
      div.prepend(comments);

      let commentSection = document.getElementById(`number_of_comments_${record_id}`);
      let commentSectionNumber = commentSection.textContent;
      let number_of_comments = Number(commentSectionNumber.split(' ')[0]);
      console.log(number_of_comments);
      commentSection.textContent = `${(number_of_comments + 1)} comment(s)`;
    });
}

function getAllComments(record_id) {
  let loadingTextComments = document.getElementById(
    `loading_text_comments_${record_id}`
  );
  loadingTextComments.innerHTML = LOADING;
  skapi
    .getRecords(
      {
        table: {
          name: "comments",
          access_group: "authorized",
        },
        reference: record_id,
      },
      {
        ascending: false,
      }
    )
    .then((data) => {
      loadingTextComments.innerHTML = "";
      let comment_list = data.list;
      let div = document.getElementById(`comments_section_${record_id}`);
      if (comment_list.length >= 1) {
        comment_list.forEach((item) => {
          let userComment = item.data.comment;
          let comments = document.createElement("p");
          comments.innerHTML = userComment;
          div.append(comments);
        });
      }
    });
}

function like(record_id){
  let button = document.getElementById(record_id + '_like');
  let likes = document.getElementById(`number_of_likes_${record_id}`);
  let likes_text = likes.textContent;
  let likes_number = Number(likes_text.split(' ')[0]);
  if (button.innerHTML === 'Liked'){
    skapi.deleteRecords(
      {
        record_id: myLikes[record_id]
      }
    ).then(() => {
      button.innerHTML = 'Like';
      delete myLikes[record_id]
  });
    likes.textContent = `${likes_number > 0 ? likes_number - 1 : 0} like(s)`
  }
  else{
    skapi.postRecord(null, {
      table: {
        name: 'like',
        access_group: 'authorized'
      },
      index:{
        name: `like.${record_id}`,
        value: true
      }
    }).then(data=>{
      myLikes[record_id] = data.record_id;
      button.innerHTML = 'Liked';
    })
    likes.textContent = `${ likes_number + 1} like(s)`
  }
}