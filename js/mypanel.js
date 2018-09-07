var diffData = [];

chrome.devtools.network.onRequestFinished.addListener(function(request) {
  request.getContent(function(body) {
    var diff = request.response.headers.filter(item => {
      return item.name === "diff";
    });
    var project = request.response.headers.filter(item => {
      return item.name === "project";
    });
    if (diff.length) {
      var urlObj = parseUrl(request.request.url);
      project = project[0].value.substr(1, project[0].value.length - 2);
      body = JSON.parse(body);
      const diffObj = {
        url: urlObj.pathname,
        method: request.request.method,
        diff: JSON.parse(diff[0].value),
        index: diffData.length,
        code: body.code,
        project: project
      };
      var diffIndex = arrayIndexOf(diffData, diffObj);
      if (diffIndex === -1) {
        diffData.push(diffObj);
      } else {
        diffData.splice(diffIndex, 1, { ...diffObj, index: diffIndex });
      }
      doLoad();
    }
  });
});
var r = {
  protocol: /([^\/]+:)\/\/(.*)/i,
  host: /(^[^\:\/]+)((?:\/|:|$)?.*)/,
  port: /\:?([^\/]*)(\/?.*)/,
  pathname: /([^\?#]+)(\??[^#]*)(#?.*)/
};
function parseUrl(url) {
  var tmp,
    res = {};
  res["href"] = url;
  for (p in r) {
    tmp = r[p].exec(url);
    res[p] = tmp[1];
    url = tmp[2];
    if (url === "") {
      url = "/";
    }
    if (p === "pathname") {
      res["pathname"] = tmp[1];
      res["search"] = tmp[2];
      res["hash"] = tmp[3];
    }
  }
  return res;
}

function arrayIndexOf(array, obj) {
  var result = -1;
  for (var i = 0; i < array.length; i++) {
    var item = array[i];
    if (item.url === obj.url && item.method === obj.method) {
      result = i;
      break;
    }
  }
  return result;
}

function doLoad() {
  dataTable.data(diffData, "index");
}

var dataTable = $("#dataTable").raytable({
  datasource: { data: [], keyfield: "index" },
  columns: [
    { field: "url", title: "Url" },
    { field: "method", title: "Method" },
    {
      title: "Merge",
      icons: [{ glyph: "glyphicon-edit", handler: iconAction, data: "index" }]
    }
  ],
  pagesize: 13,
  maxPageButtons: 5,
  rowNumbers: true,
  rowClickHandler: rowAction
});
jQuery(".glyphicon").css("cursor", "pointer");

function iconAction(event) {
  if (window.confirm("你确定要merge这条数据吗？")) {
    var index = event.data.rowIdx;
    var diffObj = diffData[index];
    // 	//所有消息均发送到background层
    chrome.extension.sendRequest({
      tabId: chrome.devtools.inspectedWindow.tabId,
      url: diffObj.url,
      method: diffObj.method,
      code: diffObj.code,
      project: diffObj.project
    });
    diffData.splice(index, 1);
    doLoad();
  }

  // alert("glyph icon data is " + data);
}

function rowAction(event) {
  var diffObj = diffData[event.data.rowIdx];

  $("#diff_data").html(jsondiffpatch.formatters.html.format(diffObj.diff));
}

doLoad();

// 点击清空
$("#btnclear").on("click", function() {
  diffData = [];
  doLoad();
});

// document.getElementById("check_jquery").addEventListener("click", function() {
//   console.log("清空");
// });

// var oldHref = "";

// setInterval(function() {
//   chrome.devtools.inspectedWindow.eval("window.location.href", function(
//     result,
//     isException
//   ) {
//     if (oldHref !== result) {
//       oldHref = result;
//       diffData = [];
//       doLoad();
//       console.log("href发生了变化");
//     }
//   });
// }, 5000);
