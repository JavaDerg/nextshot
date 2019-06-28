var cycling = false;
var intervalTime = 1000;
var timeouts = {};

// Main
(() => {
  browser.browserAction.onClicked.addListener((tab) => {
    if(cycling) {
      cycling = !cycling;
      if(tab.id in timeouts)
        clearTimeout(timeouts[tab.id]);
      return;
    }
    var id = tab.url.substr(16,6);
    var key = generateKey(id);
    browser.tabs.update({url: `https://prnt.sc/${key}`});
  });
  browser.menus.create({
    id: "nextshot.cycle"
  });

  browser.menus.onShown.addListener(async (info, tab) => {
    await browser.menus.update(
      "nextshot.cycle",
      {
        visible: tab.url.startsWith("https://prnt.sc/"),
        title: `${cycling ? "Stop" : "Start"} cycling`
      }
    );
    browser.menus.refresh();
  });

  browser.menus.onClicked.addListener((info, tab) => {
    if(info.menuItemId !== "nextshot.cycle") return;
    if(cycling = !cycling) {
      timeouts[tab.id] = 
        setTimeout(() => {
          if(!cycling) return;
          var id = tab.url.substr(16,6);
          var key = generateKey(id);
          browser.tabs.update(tab.id, {url: `https://prnt.sc/${key}`});
          delete timeouts[tab.id];
        }, intervalTime);
    } else {
      if(tab.id in timeouts)
        clearTimeout(timeouts[tab.id]);
    }
  });

  browser.tabs.onUpdated.addListener((tabId, {status}, {url}) => {
    if(status === undefined) return;
    console.trace(url + " " + status + " " + cycling);
    if(status === "complete" && url.startsWith("https://prnt.sc/") && cycling)
    {
      console.trace("HEY!");
      if(tabId in timeouts) {
        console.warn("Timeour already running?", {tabId, url});
        clearTimeout(timeouts[tabId]);
        delete timeouts[tabId];
      }
      timeouts[tabId] = 
        setTimeout(() => {
          if(!cycling) return;
          var id = url.substr(16,6);
          var key = generateKey(id);
          browser.tabs.update(tabId, {url: `https://prnt.sc/${key}`});
          delete timeouts[tabId];
        }, intervalTime);
    } else if(tabId in timeouts)
      clearTimeout(timeouts[tabId]);
  });
})();

function generateKey(key) {
  var charSet = "0123456789abcdefghijklmnopqrstuvwxyz";
  if(key.length < 1) {
    for(var i = 0; i < 6; i++)
      key += charSet.charAt(Math.floor(Math.random() * charSet.length));
    return key;
  }
  for(var i = key.length - 1; i > 0; i--) {
    var upped = upChar(key[i]);
    key = key.substr(0, i) + upped.new + key.substr(i + 1);
    if(!upped.overflow) break;
  }
  return key;

  function upChar(char) {
    var index = charSet.indexOf(char);
    if(index === -1) return "0";
    var overflow = index + 1 >= charSet.length;
    var newIndex = (index + 1) % charSet.length;
    return {
      new: charSet[newIndex],
      overflow
    };
  }
}