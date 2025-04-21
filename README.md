## Hive JS :honey_pot:

Hive JS is a lightweight yet powerful framework for building web applications, offering features like variable caching, pagination, form management, IndexedDB handling, and custom HTML component modeling for fast and efficient development.

```javascript
// * Variable Caching
version = hive.read("version", null);
hive.write("version", "1.0.0");
console.log(version);

// * Pagination
// <div data-page="main">...</div>
hive.navigate("main");

// * Form Management
// <div data-page="main">
//   <input data-field="name" type="text" placeholder="Your Name" />
// </div>

hive.navigate("another-page");
hive.navigate("main");
// This resets the field since the window exited the main page

// * Indexed Database Handling
await hive.connect("my-database");
await hive.store("version", hive.read("version"));
console.log(await hive.retrieve("version"))

// * Modelling
hive.create_model("p", payload => {
  return `<p>${payload.text}</p>`;
});
document.body.innerHTML = hive.mount("p", [{
  text: "Paragraph 1"
}, {
  text: "Paragraph 2"
}]);
```

## Installation

To install Hive JS, embed the following script tag:

```html
<script src="https://cdn.jsdelivr.net/gh/trulyursdelv/hive.js@main/dist/hive.js"></script>
```
