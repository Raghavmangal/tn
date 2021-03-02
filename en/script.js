'use strict';

/* globals MediaRecorder */

let mediaRecorder;
let recordedBlobs;

const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('a#record');
const playButton = document.querySelector('a#play');
const downloadButton = document.querySelector('a#download');
let video;
let message;

recordButton.addEventListener('click', () => {

  if (recordButton.textContent === 'Record') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Record';
    $("#record").hide();
    $("#play").show();
    $("#download").show();
  }
});


playButton.addEventListener('click', () => {
  $(".gum").hide();
  $(".recorded").show();
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});


downloadButton.addEventListener('click', () => {

  const blob = new Blob(recordedBlobs, {type: 'video/mp4'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'recording.mp4';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
  recordedBlobs = [];
  let options = {mimeType: 'video/webm;codecs=vp9,opus'};
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  // playButton.disabled = true;
  // downloadButton.disabled = true;
  mediaRecorder.onstop = (event) => {
    video = recordedBlobs[0];
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  // $('#start').hide();
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;

  const gumVideo = document.querySelector('video#gum');
  gumVideo.srcObject = stream;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    return 1;
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    return 0;
  }
}

document.querySelector('a#start').addEventListener('click', async () => {
  const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
  const constraints = {
    audio: {
      echoCancellation: {exact: hasEchoCancellation}
    },
    video: {
      width: 100
    }
  };
  console.log('Using media constraints:', constraints);
  const status = await init(constraints);
  if (status) {
    $("#start_button").hide();
    $("#video_upload").show();
    $("#record").show();
  }
  else {
    alert("You have either denied the permission to access camera and microphone, Or this feature is not supported on your device.");
  }
});


$("#district").on('change', (e) => {
  fetch(`https://lokkhosonarbangla.com/api/v1/assembly?district_id=${e.target.value}`).then((resp) => resp.json()).then((res) => {
    let options = `<option value="" selected="true" disabled="disabled">Select constituency *</option>`;
    res.assemblies.forEach((assembly) => {
      options += `<option value="${assembly.id}">${assembly.assemblyname}</option>`;
    });
    $("#constituency").html(options);
  });
});
function getParamByKey(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

$("#my_form").on("submit", (e) => {
  e.preventDefault();
  if (!message && !video) {
    console.log(message, video);
    return;
  }
  const fd = new FormData();
    fd.append("name", $("#name").val());
    fd.append("mobile", $("#mob").val());
    fd.append("age", $("#age").val());
    fd.append("assembly_id", $("#constituency").val());
    fd.append("district_id", $("#district").val());
    video && fd.append("video", video, "blob.mp4");
    message && fd.append("message", message);
  fd.append("source", getParamByKey("source") || "");
  fetch("https://lokkhosonarbangla.com/api/v1/suggestion", {
    method: "POST",
    body: fd
  })
  .then((resp) => resp.json())
  .then((res) => {
    if (res.message === "Suggestion Captured successfully") {
      window.location.href="./thanks.html";
    }
  })
});

$("#suggestions").on("input", (e) => {
  message = e.target.value;
});

$("#continue").on('click', (e) => {
  e.preventDefault();
  if (video || message) {
    $("#exampleModal").modal();
  }
  else {
    alert("Please provide your suggestion to continue.")
  }
});

$("#video_file").on("change", (e) => {
    video = e.target.files[0];
});

$(document).ready(() => {
  fetch("https://lokkhosonarbangla.com/api/v1/district").then((resp) => resp.json()).then((res) => {
    let options = `<option value="" selected="true" disabled="disabled">Select District *</option>`;
    res.districts.forEach((district) => {
      options += `<option value="${district.id}">${district.districtname}</option>`;
    });
    $("#district").html(options);
  });
});