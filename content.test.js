const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const path = require("node:path");

const script = readFileSync(path.join(__dirname, "content.js"), "utf8");
const gradesUrl = "https://learn.uwaterloo.ca/d2l/lms/grades/my_grades/main.d2l?ou=123";

function text(data, { excluded = false, editable = false } = {}) {
  return {
    nodeType: 3,
    data,
    parentElement: {
      isContentEditable: editable,
      closest: () => excluded,
    },
  };
}

function run(url, initialNodes) {
  let observer;
  const document = {
    nodeType: 9,
    createTreeWalker(root) {
      const nodes = root === document ? initialNodes : root.children;
      let index = 0;
      return {
        currentNode: null,
        nextNode() {
          this.currentNode = nodes[index++];
          return Boolean(this.currentNode);
        },
      };
    },
  };
  class MutationObserver {
    constructor(callback) {
      observer = callback;
    }
    observe() {}
  }
  runInNewContext(script, {
    location: { href: url },
    URL,
    document,
    Node: { TEXT_NODE: 3, ELEMENT_NODE: 1, DOCUMENT_NODE: 9 },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver,
  });
  return { notify: (mutations) => observer(mutations), hasObserver: () => Boolean(observer) };
}

test("updates fractions while preserving spacing and excluding editable content", () => {
  const grade = text("3/9, -2.5 / 10.00, 4/4");
  const editable = text("3/9", { editable: true });
  const scriptText = text("3/9", { excluded: true });
  run(gradesUrl, [grade, editable, scriptText]);
  assert.equal(grade.data, "9/9, 10.00 / 10.00, 4/4");
  assert.equal(editable.data, "3/9");
  assert.equal(scriptText.data, "3/9");
});

test("only runs on the grades page with an ou parameter", () => {
  for (const url of [
    "https://learn.uwaterloo.ca/d2l/lms/grades/my_grades/main.d2l",
    "https://learn.uwaterloo.ca/d2l/lms/grades/my_grades/main.d2l-other?ou=123",
  ]) {
    const grade = text("3/9");
    const result = run(url, [grade]);
    assert.equal(grade.data, "3/9");
    assert.equal(result.hasObserver(), false);
  }
});

test("updates inserted nodes and later text changes", () => {
  const result = run(gradesUrl, []);
  const insertedText = text("1/5");
  const nestedText = text("2 / 6");
  result.notify([{
    type: "childList",
    addedNodes: [insertedText, { nodeType: 1, children: [nestedText] }],
  }]);
  assert.equal(insertedText.data, "5/5");
  assert.equal(nestedText.data, "6 / 6");

  insertedText.data = "3/8";
  result.notify([{ type: "characterData", target: insertedText }]);
  assert.equal(insertedText.data, "8/8");
});
