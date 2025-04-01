// hive.js framework
// https://github.com/trulyursdelv/hive.js

(() => {

// var: y
const hive_cache = {
  _loaded_cache: [],
  _is_cache_loaded: false,
  _init_cache() {
    if(hive._is_cache_loaded) return;
    hive._is_cache_loaded = true;
    const list = localStorage.getItem("hive-cache:all") || "[]";
    let destroy = [];
    JSON.parse(list).forEach((path, i) => {
      const content = JSON.parse(localStorage.getItem(path));
      if(content.expire >= Date.now()) {
        destroy.push(path);
        localStorage.removeItem(path);
      } else {
        hive._loaded_cache.push(content);
      }
    });
    localStorage.setItem("hive-cache:all", JSON.stringify(list.filter(path => !destroy.includes(path))));
  },
  _update_cache() {
    localStorage.setItem("hive-cache:all", JSON.stringify(hive._loaded_cache.map(y => y.path)));
  },
  cache(key, placeholder) {
    let is_loaded = false;
    let value = placeholder;
    let path = `hive-cache:${crypto.randomUUID()}`;
    hive._init_cache();
    hive._loaded_cache.forEach(y => {
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
      hive._loaded_cache.push(content);
      localStorage.setItem(path, JSON.stringify(content));
    }
    const read = (placeholder) => {
      return hive.read_cache(key, placeholder);
    }
    const write = (value) => {
      hive.write_cache(key, value);
    }
    return [read, write];
  },
  read_cache(key, placeholder) {
    const cache = hive._loaded_cache.find(y => y.key == key);
    return cache ? cache.value : placeholder;
  },
  write_cache(key, value) {
    hive._loaded_cache.forEach((y, i) => {
      if(y.key != key) return;
      const cache = hive._loaded_cache[i];
      hive._loaded_cache[i].value = value;
      localStorage.setItem(cache.path, JSON.stringify({
        key: cache.key,
        value, path: cache.path
      }));
      hive._update_cache();
    });
  }
}

// var: none
const hive_models = {
  _models: [],
  createModel(name, handler, fallback) {
    hive._models.push({
      name, handler, fallback
    });
  },
  model(name, payload) {
    const model = hive._models.find(y => y.name == name);
    return model ? model.handler(payload) : null;
  },
  mapModel(name, payloads) {
    const model = hive._models.find(y => y.name == name);
    if(payloads.length == 0) {
      return model.fallback();
    } else {
      return payloads.map(y => model.handler(y)).join("");
    }
  }
}

// var: f
const hive_pages = {
  _pages: [],
  _init_pages() {
    hive._pages = [...document.querySelectorAll("[data-page]")].map(f => {
      return {
        target: f,
        name: f.getAttribute("data-page"),
        is_active: f.hasAttribute("data-active"),
        show(target) {
          target.style.display = "block";
        },
        hide(target) {
          target.style.display = "none";
        },
        on() {}
      }
    });
  },
  configure_page(name, { show, hide, on }) {
    hive._pages.forEach((f, i) => {
      if(f.name != name) return;
      if(show) hive._pages[i].show = show;
      if(hide) hive._pages[i].hide = hide;
      if(on) hive._pages[i].on = on;
    });
  },
  navigate(name) {
    hive._pages.forEach(f => {
      if(f.name == name) {
        f.show();
        f.on();
      } else {
        f.hide();
      }
    })
  }
}

// var: k
const hive_fields = {
  _fields: [],
  _init_fields() {
    hive._fields = [...document.querySelectorAll("[data-field]")].map(k => {
      return {
        target: k,
        label: k.getAttribute("data-field"),
        change() {},
        reset() {
          return k.value
        }
      }
    });
    hive._update_fields();
  },
  _update_fields() {
    hive._fields.forEach(k => {
      k.target.addEventListener("change", (evt) => {
        k.change(evt.target.value);
      });
    });
  },
  reset_fields(labels) {
    hive._fields.forEach((k, i) => {
      if(!labels.includes(k.label)) return;
      k.target.value = k.reset();
    });
  },
  configure_field(label, { change, reset }) {
    hive._fields.forEach((k, i) => {
      if(k.label != label) return;
      if(change) hive._fields[i].change = show;
      if(reset) hive._pages[i].reset = reset;
      hive._update_fields();
    });
  }
}

// var: v
const hive_databases = {
  _database: null,
  use_database(v) {
    hive._database = v;
  },
  async store(name, value) {
    await hive._database.set(name, value);
  },
  async retrieve(name, placeholder) {
    return await hive._database.get(name, placeholder);
  },
  async store_from(name, cache) {
    await hive.store(name, hive.read_cache(cache));
  },
  async retrive_from(name, mapping) {
    for(let db_key in mapping) {
      let cache_key = mapping[db_key];
      hive.write_cache(cache_key, await hive.retrieve(db_key));
    }
  }
}

// var: z
const hive_modules = {
  _exports: [],
  export(name, builder) {
    hive._exports.push({
      name, builder
    });
  },
  import(name, payload) {
    const module = hive._exports.find(z => z.name == name);
    if(module) module.builder(payload);
  }
}

window.hive = {
  version: 1,
  init() {
    hive._init_cache();
    hive._init_pages();
    hive._init_fields();
  },
  ...hive_cache,
  ...hive_models,
  ...hive_pages,
  ...hive_fields,
  ...hive_databases,
  ...hive_modules
}

})();