/*
 * UltimaDark image late-connection bench
 *
 * Run this file in the console of a normal web page with UltimaDark image
 * processing enabled. It intentionally creates images while they are detached,
 * waits long enough for the temporary source to fail, and only then connects
 * them.
 */
(async () => {
  const marker = "data:text/ud-late-connection;";
  const results = [];
  const createdUrls = [];
  const fixture = document.createElement("div");
  fixture.id = "ud-image-late-connection-bench";
  fixture.style.cssText = "position:fixed;left:-10000px;top:-10000px";
  document.body.appendChild(fixture);

  const wait = milliseconds =>
    new Promise(resolve => setTimeout(resolve, milliseconds));

  const makeImageUrl = (width, height, color) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
      + `<rect width="100%" height="100%" fill="${color}"/></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    createdUrls.push(url);
    return url;
  };

  const settleImage = (image, timeout = 3000) =>
    Promise.race([
      new Promise(resolve => {
        if (image.complete && image.naturalWidth) {
          resolve({ type: "already-complete" });
          return;
        }
        image.addEventListener("load", event => resolve(event), { once: true });
        image.addEventListener("error", event => resolve(event), { once: true });
      }),
      new Promise(resolve => {
        const inspect = () => {
          if (image.complete && image.naturalWidth) {
            resolve({ type: "complete" });
          } else {
            setTimeout(inspect, 10);
          }
        };
        inspect();
      }),
      wait(timeout).then(() => ({ type: "timeout" })),
    ]);

  const record = (test, pass, details = {}) => {
    results.push({ test, pass: Boolean(pass), details });
  };

  const attributesContainMarker = element =>
    ["src", "srcset"].some(attribute =>
      element.getAttribute(attribute)?.includes(marker)
    );

  try {
    if (!window.uDark?.userSettings?.imageEditionEnabled) {
      throw new Error("UltimaDark image processing must be enabled");
    }

    {
      const container = document.createElement("div");
      const child = document.createElement("span");
      let error = null;
      try {
        container.insertBefore(child, null);
        container.append("text");
      } catch (caughtError) {
        error = caughtError;
      }
      record(
        "nullable and string insertion arguments remain valid",
        error === null && container.lastChild?.nodeType === Node.TEXT_NODE,
        { error: error?.stack || null }
      );
    }

    {
      const image = document.createElement("img");
      const source = makeImageUrl(31, 17, "red");
      let websiteErrorCount = 0;
      image.addEventListener("error", () => {
        websiteErrorCount++;
      });
      image.src = source;
      const stagedTopology = {
        parentNode: image.parentNode,
        parentElement: image.parentElement,
        rootIsSelf: image.getRootNode() === image,
        assignedSlot: image.assignedSlot,
        connected: image.isConnected,
      };
      image.remove();
      image.before(document.createElement("span"));
      const stagedAfterDetachedMethods = {
        parentNode: image.parentNode,
        rootIsSelf: image.getRootNode() === image,
        pending: window.uDark.lateConnectionStates.has(image),
      };
      await wait(50);
      const failedWhileDetached =
        window.uDark.lateConnectionStates.get(image)?.failureCaught === true;
      fixture.appendChild(image);
      const event = await settleImage(image);

      record(
        "captured detached failure recovers after connection",
        image.naturalWidth === 31 &&
          image.naturalHeight === 17 &&
          !attributesContainMarker(image),
        {
          event: event.type,
          failedWhileDetached,
          websiteErrorCount,
          connected: image.isConnected,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
      record(
        "captured temporary error does not reach a normal website listener",
        websiteErrorCount === 0,
        { websiteErrorCount }
      );
      record(
        "private staging preserves detached topology semantics",
        stagedTopology.parentNode === null &&
          stagedTopology.parentElement === null &&
          stagedTopology.rootIsSelf &&
          stagedTopology.assignedSlot === null &&
          !stagedTopology.connected &&
          stagedAfterDetachedMethods.parentNode === null &&
          stagedAfterDetachedMethods.rootIsSelf &&
          stagedAfterDetachedMethods.pending,
        { stagedTopology, stagedAfterDetachedMethods }
      );
    }

    {
      const container = document.createElement("div");
      const first = document.createElement("img");
      const second = document.createElement("img");
      const firstSource = makeImageUrl(23, 11, "green");
      const secondSource = makeImageUrl(47, 19, "blue");
      first.src = firstSource;
      second.src = secondSource;
      await wait(50);
      container.append(first, second);
      fixture.appendChild(container);
      await Promise.all([settleImage(first), settleImage(second)]);

      record(
        "sibling images retain independent sources",
        first.naturalWidth === 23 &&
          second.naturalWidth === 47 &&
          first.src === firstSource &&
          second.src === secondSource,
        {
          first: {
            src: first.src,
            size: `${first.naturalWidth}x${first.naturalHeight}`,
          },
          second: {
            src: second.src,
            size: `${second.naturalWidth}x${second.naturalHeight}`,
          },
        }
      );
    }

    {
      const picture = document.createElement("picture");
      const sourceElement = document.createElement("source");
      const image = document.createElement("img");
      const responsiveSource = makeImageUrl(53, 29, "purple");
      const fallbackSource = makeImageUrl(13, 7, "orange");
      sourceElement.media = "(min-width: 1px)";
      sourceElement.srcset = `${responsiveSource} 1x`;
      image.src = fallbackSource;
      picture.append(sourceElement, image);
      await wait(50);
      fixture.appendChild(picture);
      const event = await settleImage(image);

      record(
        "picture srcset is restored candidate by candidate",
        image.naturalWidth === 53 &&
          sourceElement.srcset === `${responsiveSource} 1x` &&
          !attributesContainMarker(sourceElement) &&
          !attributesContainMarker(image),
        {
          event: event.type,
          currentSrc: image.currentSrc,
          srcset: sourceElement.srcset,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
    }

    {
      const image = document.createElement("img");
      const source = makeImageUrl(37, 21, "black");
      image.src = source;
      const firstDecode = image.decode();
      const secondDecode = image.decode();
      await wait(50);
      fixture.appendChild(image);
      const settled = await Promise.allSettled([firstDecode, secondDecode]);

      record(
        "concurrent decode calls settle after recovery",
        settled.every(result => result.status === "fulfilled") &&
          image.naturalWidth === 37 &&
          !Object.hasOwn(image, "decode"),
        {
          settled: settled.map(result => result.status),
          ownDecode: Object.hasOwn(image, "decode"),
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
    }

    {
      const image = document.createElement("img");
      const source = makeImageUrl(43, 27, "navy");
      image.src = source;
      const outcome = await Promise.race([
        image.decode().then(
          () => "fulfilled",
          error => `rejected: ${error?.name || error}`
        ),
        wait(3000).then(() => "timeout"),
      ]);

      record(
        "detached preloader decode completes before insertion",
        outcome === "fulfilled" &&
          !image.isConnected &&
          image.naturalWidth === 43 &&
          !attributesContainMarker(image) &&
          !Object.hasOwn(image, "decode"),
        {
          outcome,
          connected: image.isConnected,
          ownDecode: Object.hasOwn(image, "decode"),
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
      fixture.appendChild(image);
      await settleImage(image);
    }

    {
      const preview = document.createElement("div");
      const thumbnail = document.createElement("img");
      const fullImage = document.createElement("img");
      const thumbnailSource = makeImageUrl(19, 19, "silver");
      const fullSource = makeImageUrl(67, 41, "maroon");
      thumbnail.src = thumbnailSource;
      preview.appendChild(thumbnail);
      fixture.appendChild(preview);
      await settleImage(thumbnail);

      let websiteLoadCount = 0;
      let synchronousParentVisible = false;
      fullImage.addEventListener("load", () => {
        websiteLoadCount++;
        if (!fullImage.isConnected) {
          preview.insertBefore(fullImage, thumbnail);
          synchronousParentVisible = fullImage.parentNode === preview;
          thumbnail.style.visibility = "hidden";
        }
      });
      fullImage.src = fullSource;
      const outcome = await Promise.race([
        new Promise(resolve => {
          const inspect = () => {
            if (fullImage.isConnected && fullImage.naturalWidth === 67) {
              resolve("inserted");
            } else {
              setTimeout(inspect, 10);
            }
          };
          inspect();
        }),
        wait(3000).then(() => "timeout"),
      ]);
      await wait(100);

      record(
        "detached native load can gate full-image insertion",
        outcome === "inserted" &&
          websiteLoadCount === 1 &&
          synchronousParentVisible &&
          preview.firstElementChild === fullImage &&
          thumbnail.style.visibility === "hidden" &&
          !attributesContainMarker(fullImage),
        {
          outcome,
          websiteLoadCount,
          synchronousParentVisible,
          inserted: fullImage.isConnected,
          fullSize: `${fullImage.naturalWidth}x${fullImage.naturalHeight}`,
          thumbnailVisibility: thumbnail.style.visibility,
        }
      );
    }

    {
      const image = document.createElement("img");
      const firstSource = makeImageUrl(29, 17, "olive");
      const secondSource = makeImageUrl(71, 39, "coral");
      image.src = firstSource;
      const firstOutcome = await Promise.race([
        image.decode().then(() => "fulfilled", () => "rejected"),
        wait(3000).then(() => "timeout"),
      ]);
      image.src = secondSource;
      const secondOutcome = await Promise.race([
        image.decode().then(() => "fulfilled", () => "rejected"),
        wait(3000).then(() => "timeout"),
      ]);
      fixture.appendChild(image);
      await settleImage(image);

      record(
        "detached preloader supports a second source generation",
        firstOutcome === "fulfilled" &&
          secondOutcome === "fulfilled" &&
          image.src === secondSource &&
          image.naturalWidth === 71 &&
          !attributesContainMarker(image) &&
          !Object.hasOwn(image, "decode"),
        {
          firstOutcome,
          secondOutcome,
          src: image.src,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
          ownDecode: Object.hasOwn(image, "decode"),
        }
      );
    }

    {
      const image = document.createElement("img");
      const replacedSource = makeImageUrl(17, 9, "gray");
      const finalSource = makeImageUrl(61, 33, "white");
      image.src = replacedSource;
      image.src = finalSource;
      await wait(50);
      fixture.appendChild(image);
      const event = await settleImage(image);

      record(
        "latest detached source wins during rapid replacement",
        image.src === finalSource &&
          image.naturalWidth === 61 &&
          !attributesContainMarker(image),
        {
          event: event.type,
          src: image.src,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
    }

    {
      const fragment = document.createDocumentFragment();
      const wrapper = document.createElement("div");
      const image = document.createElement("img");
      const source = makeImageUrl(73, 37, "indigo");
      image.src = source;
      await image.decode();
      wrapper.appendChild(image);
      fragment.appendChild(wrapper);
      await wait(50);
      fixture.appendChild(fragment);
      const event = await settleImage(image);

      record(
        "DocumentFragment construction recovers without insertion hooks",
        image.isConnected &&
          image.naturalWidth === 73 &&
          !attributesContainMarker(image),
        {
          event: event.type,
          connected: image.isConnected,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
    }

    {
      const image = document.createElement("img");
      const oneX = makeImageUrl(41, 25, "cyan");
      const twoX = makeImageUrl(82, 50, "magenta");
      image.srcset = `${oneX} 1x, ${twoX} 2x`;
      await wait(50);
      fixture.appendChild(image);
      const event = await settleImage(image);

      record(
        "multi-candidate img srcset survives recovery",
        image.srcset === `${oneX} 1x, ${twoX} 2x` &&
          image.naturalWidth > 0 &&
          !attributesContainMarker(image),
        {
          event: event.type,
          currentSrc: image.currentSrc,
          srcset: image.srcset,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
    }

    {
      const host = document.createElement("div");
      const shadowRoot = host.attachShadow({ mode: "open" });
      const image = document.createElement("img");
      const source = makeImageUrl(43, 27, "navy");
      fixture.appendChild(host);
      image.src = source;
      await wait(50);
      const failedWhileDetached =
        window.uDark.lateConnectionStates.get(image)?.failureCaught === true;
      shadowRoot.appendChild(image);
      const event = await settleImage(image);

      record(
        "detached failure recovers inside an existing shadow root",
        failedWhileDetached &&
          image.naturalWidth === 43 &&
          !attributesContainMarker(image),
        {
          event: event.type,
          failedWhileDetached,
          connected: image.isConnected,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
    }

    {
      const host = document.createElement("div");
      const shadowRoot = host.attachShadow({ mode: "closed" });
      const picture = document.createElement("picture");
      const sourceElement = document.createElement("source");
      const image = document.createElement("img");
      const responsiveSource = makeImageUrl(59, 35, "teal");
      const fallbackSource = makeImageUrl(15, 9, "yellow");
      sourceElement.media = "(min-width: 1px)";
      sourceElement.srcset = `${responsiveSource} 1x`;
      // Bypass the patched property setter so only the source participates in
      // late recovery. This exercises error-listener installation at insertion.
      image.setAttribute("src", fallbackSource);
      picture.append(sourceElement, image);
      fixture.appendChild(host);
      await wait(50);
      shadowRoot.appendChild(picture);
      const event = await settleImage(image);

      record(
        "source-only failure recovers inside a closed shadow root",
        image.naturalWidth === 59 &&
          sourceElement.srcset === `${responsiveSource} 1x` &&
          !attributesContainMarker(sourceElement),
        {
          event: event.type,
          currentSrc: image.currentSrc,
          srcset: sourceElement.srcset,
          size: `${image.naturalWidth}x${image.naturalHeight}`,
        }
      );
    }

    await wait(0);
    record(
      "late-connection path uses no mutation observer",
      window.uDark.nonConnectedImagesAndSources.size === 0 &&
        window.uDark.lateConnectionActiveStages.size === 0 &&
        window.uDark.lateConnectionObserver === undefined,
      {
        pending: window.uDark.nonConnectedImagesAndSources.size,
        activeStages: window.uDark.lateConnectionActiveStages.size,
        mutationObserverPresent:
          window.uDark.lateConnectionObserver !== undefined,
      }
    );
  } catch (error) {
    record("bench setup", false, {
      error: error?.stack || String(error),
    });
  } finally {
    fixture.remove();
    createdUrls.forEach(url => URL.revokeObjectURL(url));
  }

  const failures = results.filter(result => !result.pass);
  console.group(
    `UltimaDark image late-connection bench: ${failures.length
      ? `${failures.length} FAIL`
      : "PASS"}`
  );
  console.table(results.map(({ test, pass, details }) => ({
    test,
    pass,
    details: JSON.stringify(details),
  })));
  failures.forEach(failure => console.error(failure.test, failure.details));
  console.groupEnd();

  return results;
})();
