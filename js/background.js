chrome.extension.onRequest.addListener(function(request) {
  $.ajax({
    url: "http://monitor.api.com/apis/stack/merge",
    type: "put",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      url: request.url,
      method: request.method,
      code: request.code,
      workProject: request.project
    }),
    dataType: "json",
    success: function(data) {
      console.log(data);
    }
  });
});

// setInterval(function() {
//   console.log(window.location.href, "location");
// }, 5000);
