// hive.js framework
// https://github.com/trulyursdelv/hive.js

(() => {

const hive_state = {
  _loaded_state: [],
  _is_state_loaded: false,
  _init_states() {
    if(hive._is_state_loaded) return;
    hive._is_state_loaded = true;
    const list = JSON.parse(localStorage.getItem("hive-state:all") || "[]");
    let destroy = [];
    list.forEach((path, i) => {
      const content = JSON.parse(localStorage.getItem(path));
      if(content.expire >= Date.now()) {
        destroy.push(path);
        localStorage.removeItem(path);
      } else {
        hive._loaded_state.push(content);
      }
    });
    localStorage.setItem("hive-state:all", JSON.stringify(list.filter(path => !destroy.includes(path))));
  },
  _update_state() {
    localStorage.setItem("hive-state:all", JSON.stringify(hive._loaded_state.map(y => y.path)));
  },
  state(key, placeholder) {
    let is_loaded = false;
    let value = placeholder;
    let path = `hive-state:${crypto.randomUUID()}`;
    hive._init_states();
    hive._loaded_state.forEach(y => {
      if(y.key != key) return;
      value = y.value;
      path = y.path;
      is_loaded = true;
    });
    if(!is_loaded) {
      const content = {
        key, value, path,
        // 5 hours
        expire: Date.now() + 18e6
      }
      hive._loaded_state.push(content);
      localStorage.setItem(path, JSON.stringify(content));
    }
    const read = (placeholder) => {
      const state = hive._loaded_state.find(y => y.key == key);
      return state ? state.value : placeholder;
    }
    const write = (value) => {
      hive._loaded_state.forEach((y, i) => {
        if(y.key != key) return;
        const state = hive._loaded_state[i];
        hive._loaded_state[i].value = value;
        localStorage.setItem(state.path, JSON.stringify({
          key: state.key,
          value, path: state.path
        }));
        hive._update_state();
      });
    }
    return [read, write];
  }
}

const hive_database = {
  _database: null,
  async connect(name, version=1) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(name, version);
      request.onupgradeneeded = evt => {
        const db = evt.target.result;
        const main = db.createObjectStore("main", { keyPath: "key" });
        main.createIndex("value", "value", { unique: false });
      }
      request.onsuccess = evt => {
        hive._database = evt.target.result;
        resolve();
      }
      request.onerror = evt => {
        reject(evt.target.error);
      }
    });
  },
  async store(key, value, define) {
    const db = hive._database;
    return new Promise((resolve, reject) => {
      const trans = db.transaction(["main"], "readwrite");
      const store = trans.objectStore("main");
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if(result != null) {
          result.value = value;
          if(define) window[define] = value;
          store.put(result);
        } else {
          store.put({ key, value });
        }
        resolve();
      }
      request.onerror = () => {
        reject(request.error);
      }
    });
  },
  retrieve(key, placeholder, define) {
    const db = hive._database;
    return new Promise((resolve, reject) => {
      const trans = db.transaction(["main"], "readonly");
      const store = trans.objectStore("main");
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        const value = result?.value || placeholder;
        if(define) window[define] = value;
        resolve(value);
      }
      request.onerror = () => {
        reject(request.error);
      }
    });
  }
}

const hive_fields = {
  fields: {},
  _fields_page: {},
  _init_fields() {
    const fields = [];
    document.querySelectorAll("[data-page]").forEach(page => {
      page.querySelectorAll("[data-field]").forEach(field => {
        const label = field.getAttribute("data-field");
        field.addEventListener("change", (evt) => {
          hive.fields[label] = evt.target.value;
        });
        hive.fields[label] = field.value;
        fields.push({
          target: field, label,
          reset: field.value
        });
        hive._fields_page[page].push(label);
      });
    });
  },
  _update_fields(ignore) {
    for(let page in hive._fields_page) {
      if(page == ignore) continue;
      hive._fields_page[page].forEach(f => {
        f.target.value = f.reset;
      });
    }
  }
}

const hive_pages = {
  _pages: [],
  _init_pages() {
    document.querySelectorAll("[data-page]").forEach(f => {
      const name = f.getAttribute("data-page");
      const page = {
        target: f, name,
        is_active: f.hasAttribute("data-active"),
        show() {
          this.target.style.display = "block";
        },
        hide() {
          this.target.style.display = "none";
        }
      }
      if(!page.is_active) page.hide();
      hive._pages.push(page);
      hive.fields[name] = [];
    });
  },
  configure_page(name, { show, hide }) {
    hive._pages.forEach((f, i) => {
      if(f.name != name) return;
      if(show) hive._pages[i].show = show;
      if(hide) hive._pages[i].hide = hide;
    });
  },
  navigate(name) {
    hive._pages.forEach(f => {
      if(f.name == name) {
        hive._update_fields(name);
        f.show();
      } else f.hide();
    })
  }
}

const hive_models = {
  _models: [],
  create_model(name, handler, fallback) {
    hive._models.push({
      name, handler, fallback
    });
  },
  model(name, payload) {
    const model = hive._models.find(z => z.name == name);
    return model ? model.handler(payload) : null;
  },
  mount(name, payloads) {
    const model = hive._models.find(z => z.name == name);
    if(payloads.length == 0) {
      return model.fallback();
    } else {
      return payloads.map(z => model.handler(z)).join("");
    }
  }
}

const hive_externals = {
  _externals: [],
  use(handler) {
    hive._externals.push(handler);
  },
  _init_externals() {
    hive._externals.forEach(g => g());
  }
}

window.hive = {
  version: "1.2",
  init() {
    hive._init_states();
    hive._init_pages();
    hive._init_fields();
    hive._init_externals();
  },
  ...hive_state,
  ...hive_database,
  ...hive_pages,
  ...hive_fields,
  ...hive_models,
  ...hive_externals
}

})();