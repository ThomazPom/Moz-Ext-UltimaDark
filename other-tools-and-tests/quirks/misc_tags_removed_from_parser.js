// Define the testTag function
function testTag(tagHtml) {
    // Build HTML strings for testing the tag in <body> and <head>
    const htmlInBody = `
      <html>
        <head><title>Test Document</title></head>
        <body>
          ${tagHtml}
        </body>
      </html>
    `;
  
    const htmlInHead = `
      <html>
        <head>
          ${tagHtml}
        </head>
        <body>
          <p>This is body content.</p>
        </body>
      </html>
    `;
  
    // Parse the HTML strings
    const parser = new DOMParser();
  
    // Parse the HTML with the tag in <body>
    const docBody = parser.parseFromString(htmlInBody, "text/html");
    const initialTagsInBody = Array.from(tagHtml.matchAll(/<([a-z]+)[\s>]/gi)).map(match => match[1]);
    const remainingTagsInBody = Array.from(docBody.body.querySelectorAll("*")).map(el => el.tagName.toLowerCase());
    const removedTagsInBody = initialTagsInBody.filter(tag => !remainingTagsInBody.includes(tag));
  
    // Parse the HTML with the tag in <head>
    const docHead = parser.parseFromString(htmlInHead, "text/html");
    const initialTagsInHead = Array.from(tagHtml.matchAll(/<([a-z]+)[\s>]/gi)).map(match => match[1]);
    const remainingTagsInHead = Array.from(docHead.head.querySelectorAll("*")).map(el => el.tagName.toLowerCase());
    const removedTagsInHead = initialTagsInHead.filter(tag => !remainingTagsInHead.includes(tag));
  
    // Log results for both <body> and <head> placements
    console.log("Testing tag:", tagHtml);
  
    if (removedTagsInBody.length > 0) {
      console.warn("In <body> - Elements removed:", Array.from(new Set(removedTagsInBody)));
          console.log("o",htmlInBody);
          console.log("p",docBody.documentElement.outerHTML)
          console.log("Parsed:",docBody)
    } else {
      console.log("In <body> - Elements kept:", remainingTagsInBody);
    }
  
    console.log("In <head> - Elements removed:", Array.from(new Set(removedTagsInHead)));
    console.log("In <head> - Elements kept:", remainingTagsInHead);
    console.log("-------------------------------------------------------");
  }
  
  // Test multiple tags by calling testTag with various HTML snippets
  
  // Root and metadata tags
  testTag('<meta charset="UTF-8">');
  testTag('<link rel="stylesheet" href="style.css">');
  testTag('<base href="/">');
  testTag('<title>Test Document</title>');
  
  // Frameset and frames
  testTag('<frameset rows="50%,50%"><frame src="frame1.html"><frame src="frame2.html"></frameset>');
  
  // Deprecated and special behavior tags
  testTag('<center>This is centered text</center>');
  testTag('<font color="red">This is red text using font tag</font>');
  testTag('<applet code="MyApplet.class"></applet>');
  testTag('<strike>This text is struck through</strike>');
  testTag('<u>This text is underlined</u>');
  testTag('<big>This text is big</big>');
  testTag('<blink>This text blinks</blink>');
  testTag('<marquee>Scrolling Text in Marquee</marquee>');
  testTag('<dir><li>Item 1</li><li>Item 2</li></dir>');
  
  // Media embedding and scripting tags
  testTag('<script>alert("This is a script");</script>');
  testTag('<noscript>JavaScript is disabled</noscript>');
  testTag('<embed src="media.mp3">');
  testTag('<object data="data.pdf" type="application/pdf"></object>');
  testTag('<param name="autoplay" value="true">');
  
  // MathML and SVG tags
  testTag('<math><mrow><mi>a</mi><mo>=</mo><mi>b</mi></mrow></math>');
  testTag('<svg width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>');
  
  // Web components and custom elements
  testTag('<template><p>Template content</p></template>');
  testTag('<slot name="slot-content"></slot>');
  testTag('<custom-element></custom-element>');
  
  // HTML5 interactive and miscellaneous tags
  testTag('<dialog open>This is a dialog</dialog>');
  testTag('<menu label="Options"><menuitem label="Save"></menuitem><menuitem label="Load"></menuitem></menu>');
  
  // Obsolete formatting tags
  testTag('<isindex prompt="Search:">');
  testTag('<listing>This is a listing tag</listing>');
  testTag('<xmp>This is an xmp tag</xmp>');
  testTag('<plaintext>This tag turns everything into plain text</plaintext>');
  testTag('<tt>This is teletype text</tt>');
  testTag('<spacer size="50">');
  