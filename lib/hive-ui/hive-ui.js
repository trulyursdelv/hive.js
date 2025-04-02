// hive-ui module by @trulyursdelv
// require: jquery, bootstrap

(() => {

const ui_toast = {
  _timeout: null,
  _init_toast() {
    document.body.innerHTML += `<div class="p-3" id="hive-toast-wrapper"><div class="bg-dark shadow-sm p-3 rounded" id="hive-toast"></div></div>`;
  },
  _show_toast(text) {
    $("#hive-toast").text(text).fadeIn(200);
    hive.ui._timeout = setTimeout(() => {
      $("#hive-toast").fadeOut(300);
      hive.ui._timeout = null;
    }, 5200);
  },
  dismiss_toast() {
    clearTimeout(hive.ui._timeout);
    hive.ui._timeout = null;
    $("#hive-toast").fadeOut(150);
  },
  create_toast(text) {
    $("#hive-toast-wrapper").click(hive.ui.dismiss);
    if(hive.ui._timeout != null) {
      hive.ui.dismiss_toast();
      setTimeout(() => {
        hive.ui._show_toast(text);
      }, 300);
    } else {
      hive.ui._show_toast(text);
    }
  }
}

const ui_statusbar = {
  _init_statusbar() {
    document.body.innerHTML += `<div id="hive-statusbar-wrapper" class="container-fluid"><div id="hive-statusbar" class="bg-primary"></div></div>`;
  },
  show_statusbar() {
    $("#hive-statusbar").show();
  },
  hide_statusbar() {
    $("#hive-statusbar").hide();
  }
}

hive.use(() => {
  ui_toast._init_toast();
  ui_statusbar._init_statusbar();
  hive.ui = {
    ...ui_toast,
    ...ui_statusbar
  }
});

})();