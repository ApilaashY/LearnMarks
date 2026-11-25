# Perfect Grade Display

This Chrome extension changes fractions displayed on the Waterloo LEARN grades
page to full marks (for example, `3/9` becomes `9/9`). It changes only the
page in your browser; it does not change grades stored in LEARN.

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Open or refresh your LEARN grades page.

The extension runs only on the grades page when the URL contains an `ou`
parameter. It also updates fractions added after the page loads. Any fraction
in a single text node is changed, including fractions that are not grades; it
does not change editable fields or fractions split across HTML elements.
