(function () {
  if (window.zsMostnaChatbotLoaded) return;
  window.zsMostnaChatbotLoaded = true;

  // Vercel URL - ZMENIŤ NA SKUTOČNÚ URL PO NASADENÍ
  const VERCEL_URL = "https://zs-mostna.vercel.app/";

  // Povolené domény - AKTUALIZOVAŤ PODĽA POTREBY
  const allowed = ["zsmostna.sk", "www.zsmostna.sk", "ragnetiq.com", "www.ragnetiq.com", "localhost", "127.0.0.1"];
  if (!allowed.includes(window.location.hostname)) {
    console.warn("Tento widget nie je povolený na tejto doméne");
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = VERCEL_URL;
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "260px";
  iframe.style.height = "56px";
  iframe.style.border = "none";
  iframe.style.borderRadius = "28px";
  iframe.style.zIndex = "99999";
  iframe.style.boxShadow = "0 8px 30px rgba(128, 71, 20, 0.25)";
  iframe.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
  iframe.style.overflow = "hidden";
  
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("allow", "clipboard-write");
  iframe.style.margin = "0";
  iframe.style.padding = "0";
  iframe.style.display = "block";
  
  document.body.appendChild(iframe);

  function getResponsiveSizes() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    if (vw <= 768) {
      return {
        openWidth: `${vw}px`,
        openHeight: `${vh}px`,
        closedWidth: vw <= 420 ? "220px" : "240px",
        closedHeight: vw <= 420 ? "50px" : "52px",
        bottom: "0",
        right: "0",
        borderRadius: {
          open: "0",
          closed: "26px"
        }
      };
    } else {
      return {
        openWidth: "380px",
        openHeight: "600px",
        closedWidth: "260px",
        closedHeight: "56px", 
        bottom: "20px",
        right: "20px",
        borderRadius: {
          open: "24px",
          closed: "28px"
        }
      };
    }
  }

  function applyResponsiveSizes(isOpen = false) {
    const sizes = getResponsiveSizes();
    const isMobile = window.innerWidth <= 768;
    
    if (isOpen) {
      iframe.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
      iframe.style.width = sizes.openWidth;
      iframe.style.height = sizes.openHeight;
      iframe.style.borderRadius = sizes.borderRadius.open;
      iframe.style.boxShadow = isMobile ? "none" : "0 20px 60px rgba(0, 0, 0, 0.15)";
      
      if (isMobile) {
        iframe.style.bottom = "0";
        iframe.style.right = "0";
        iframe.style.left = "0";
        iframe.style.top = "0";
        iframe.style.position = "fixed";
      } else {
        iframe.style.bottom = sizes.bottom;
        iframe.style.right = sizes.right;
        iframe.style.left = "auto";
        iframe.style.top = "auto";
      }
      
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "widget-opened" }, "*");
        }
      }, 50);
    } else {
      iframe.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
      iframe.style.width = sizes.closedWidth;
      iframe.style.height = sizes.closedHeight;
      iframe.style.borderRadius = sizes.borderRadius.closed;
      iframe.style.boxShadow = "0 8px 30px rgba(128, 71, 20, 0.25)";
      
      if (isMobile) {
        iframe.style.bottom = "10px";
        iframe.style.right = "10px";
      } else {
        iframe.style.bottom = sizes.bottom;
        iframe.style.right = sizes.right;
      }
      iframe.style.left = "auto";
      iframe.style.top = "auto";
      
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "widget-closed" }, "*");
        }
      }, 50);
    }
  }

  let isOpen = false;

  iframe.addEventListener("load", function() {
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "widget-closed" }, "*");
      }
    }, 100);
  });

  window.addEventListener("message", function(event) {
    if (event.origin !== VERCEL_URL.replace(/\/$/, '')) return;
    
    if (event.data.type === "chatbot-toggle") {
      isOpen = !isOpen;
      applyResponsiveSizes(isOpen);
    } else if (event.data.type === "chatbot-open") {
      isOpen = true;
      applyResponsiveSizes(true);
    } else if (event.data.type === "chatbot-close") {
      isOpen = false;
      applyResponsiveSizes(false);
    }
  });

  window.addEventListener("resize", function() {
    applyResponsiveSizes(isOpen);
  });

  applyResponsiveSizes(false);
})();
