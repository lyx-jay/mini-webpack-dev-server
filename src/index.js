let divEl = document.createElement("div")
document.body.appendChild(divEl);

let render = () => {
  // divEl.innerText = '哈哈哈哈ss'
  let content = require("./content").default;
  divEl.innerText = content;
}
render();

if (module.hot) {
  module.hot.accept(["./content.js"], render);
}

