const tabGroups = {};

const download = (dataToDownload) => {
  const data = JSON.stringify(dataToDownload, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tab_data.json";
  a.click();

  URL.revokeObjectURL(url);
};

const createTabs = async (tabList) => {
  const tabsIds = [];

  for (const _tab of tabList) {
    const tab = await chrome.tabs.create({ url: _tab.url });
    tabsIds.push(tab.id);
  }

  const groupId = await chrome.tabs.group({ tabIds: tabsIds });

  chrome.tabGroups.update(groupId, {
    collapsed: true,
    title: "yoyo",
    color: "grey",
  });
};

document.getElementById("getTabs").addEventListener("click", function () {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) => {
      if (!tabGroups.hasOwnProperty(tab.groupId)) {
        tabGroups[tab.groupId] = [];
      }

      tabGroups[tab.groupId].push(tab);
    });

    console.log("tabGroups", tabGroups);
  });
});

document.getElementById("getTab").addEventListener("click", function () {
  const groupId = document.getElementById("tabId").value;

  const group = tabGroups[groupId];
  download(
    group.map((i) => {
      return { favIconUrl: i.favIconUrl, title: i.title, url: i.url };
    })
  );
});

document
  .getElementById("openTabsButton")
  .addEventListener("click", function () {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    const reader = new FileReader();

    reader.onload = function (e) {
      const tabList = JSON.parse(e.target.result);

      createTabs(tabList);
    };

    reader.readAsText(file);
  });
