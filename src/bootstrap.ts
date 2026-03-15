import type { Resource } from "./collect-resources";

export function generateBootstrapScript(options: {
  resources: Resource[];
  entryUrl: string;
  loaderId: string;
  delay: number;
  exitClass?: string;
}): string {
  return `<script type="module">
(function() {
  var resources = ${JSON.stringify(options.resources)};
  var total = resources.length;
  var loaded = 0;
  var bar = document.getElementById("progress-bar");
  var pct = document.getElementById("progress-pct");

  function updateProgress() {
    loaded++;
    var p = Math.round((loaded / total) * 100);
    if (bar) bar.style.width = p + "%";
    if (pct) pct.textContent = p + "%";
    if (loaded >= total) onComplete();
  }

  function onComplete() {
    var loader = document.getElementById(${JSON.stringify(options.loaderId)});
    ${options.exitClass ? `if (loader) loader.classList.add(${JSON.stringify(options.exitClass)});` : ""}
    setTimeout(function() {
      if (loader) loader.parentNode.removeChild(loader);
      import(${JSON.stringify(options.entryUrl)});
    }, ${options.delay});
  }

  if (total === 0) {
    onComplete();
  } else {
    for (var i = 0; i < resources.length; i++) {
      var r = resources[i];
      if (r.type === "css") {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = r.url;
        link.onload = updateProgress;
        link.onerror = updateProgress;
        document.head.appendChild(link);
      } else {
        var link = document.createElement("link");
        link.rel = "modulepreload";
        link.href = r.url;
        link.onload = updateProgress;
        link.onerror = updateProgress;
        document.head.appendChild(link);
      }
    }
  }
})();
</script>`;
}
